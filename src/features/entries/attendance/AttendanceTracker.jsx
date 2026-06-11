import React, { useState, useMemo, useCallback } from 'react';
import AttendanceToolbar from './AttendanceToolbar';
import AttendanceCalendar from './AttendanceCalendar';
import AttendanceLegend from './AttendanceLegend';
import Modal from '../../../components/common/Modal/Modal';
import BulkEditPanel from './BulkEditPanel';
import BlockConflictModal from './BlockConflictModal';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';
import { useAttendanceEditor } from '../../../hooks/useAttendanceEditor';
import { useScheduleBlocks } from '../../../contexts/ScheduleBlockContext/ScheduleBlockContext';
import { useScheduleBlockEditor } from '../../../hooks/useScheduleBlockEditor';
import styles from './AttendanceTracker.module.css';

const PRACTICE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const generateColorMap = (practices) => {
  if (!practices) return {};
  const map = {};
  practices.forEach((p) => {
    // Use practice id to pick a stable color regardless of which practices are visible
    map[p.id] = PRACTICE_COLORS[p.id % PRACTICE_COLORS.length];
  });
  return map;
};

const AttendanceTracker = ({ entries, practices }) => {
  // --- State ---
  const { addNewEntry, removeEntry, updateEntry } = useEntries();
  const { scheduleBlocks, addNewBlock, removeBlock, isDateBlocked: isDateBlockedFromContext } = useScheduleBlocks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isBulkEditOpen, setBulkEditOpen] = useState(false);
  const [editMode, setEditMode] = useState('attendance');
  const [blockConflicts, setBlockConflicts] = useState([]);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [pendingBlockAction, setPendingBlockAction] = useState(null);

  // --- Memos ---
  const attendanceEntries = useMemo(() => {
     if (!entries) return [];
     return entries.filter(e => e.entryType === 'attendanceRecord');
   }, [entries]);

  // Only show practices that were active during the viewed month.
  // Archived practices are hidden starting from the month AFTER they were archived.
  const visiblePractices = useMemo(() => {
    if (!practices) return [];
    const viewYear = currentDate.getFullYear();
    const viewMonth = currentDate.getMonth(); // 0-indexed
    return practices.filter(p => {
      if (p.status !== 'archived') return true;
      if (!p.archivedDate) return false;
      const [y, m] = p.archivedDate.split('-').map(Number); // m is 1-indexed
      // Show if the archive month/year >= the viewed month/year
      if (y > viewYear) return true;
      if (y === viewYear) return (m - 1) >= viewMonth;
      return false;
    });
  }, [practices, currentDate]);

  const colorMap = useMemo(() => generateColorMap(visiblePractices), [visiblePractices]);

  // --- Editor Hooks ---
  const {
      pendingChanges: pendingAttendanceChanges,
      stageChange: stageAttendanceChange,
      applyBulkUpdate: applyBulkAttendanceUpdate,
      saveChanges: saveAttendanceChanges,
      revertChanges: revertAttendanceChanges,
      stageRemoval: stageAttendanceRemoval
  } = useAttendanceEditor(
    attendanceEntries,
    addNewEntry,
    removeEntry,
    updateEntry
  );

  const {
      pendingBlockChanges,
      stageBlockChange: stageBlockChangeInternal,
      applyBulkBlockUpdate: applyBulkBlockUpdateInternal,
      saveBlockChanges,
      revertBlockChanges
  } = useScheduleBlockEditor(
      scheduleBlocks,
      addNewBlock,
      removeBlock
  );

   // Local block check function incorporating pending changes
   const isDateEffectivelyBlocked = useCallback((dateStr) => {
       const isBlockedByExisting = scheduleBlocks.some(block =>
           !pendingBlockChanges.removals.has(block.id) &&
           new Date(`${dateStr}T00:00:00Z`) >= new Date(`${block.startDate}T00:00:00Z`) &&
           new Date(`${dateStr}T00:00:00Z`) <= new Date(`${block.endDate}T00:00:00Z`)
       );
       const isBlockedByPending = !!pendingBlockChanges.additions[dateStr];
       return isBlockedByExisting || isBlockedByPending;
   }, [scheduleBlocks, pendingBlockChanges]);


  // --- Conflict Detection ---
  const findConflicts = useCallback((datesToBlock) => {
      const conflicts = [];
      datesToBlock.forEach(dateStr => {
          const conflictingEntries = attendanceEntries.filter(entry =>
              entry.date === dateStr && !pendingAttendanceChanges.removals.has(entry.id)
          );
          const conflictingAdditions = Object.values(pendingAttendanceChanges.additions).filter(add => add.date === dateStr);

          conflictingEntries.forEach(entry => {
              conflicts.push({
                  date: dateStr,
                  practiceId: entry.practiceId,
                  practiceName: visiblePractices.find(p => p.id === entry.practiceId)?.name || 'Unknown',
                  entryId: entry.id,
                  isPendingAddition: false,
              });
          });
          conflictingAdditions.forEach(addition => {
               conflicts.push({
                   date: dateStr,
                   practiceId: addition.practiceId,
                   practiceName: visiblePractices.find(p => p.id === addition.practiceId)?.name || 'Unknown',
                   entryId: null,
                   isPendingAddition: true,
                   additionKey: `${dateStr}-${addition.practiceId}`
               });
           });
      });
      return conflicts;
  }, [attendanceEntries, pendingAttendanceChanges, visiblePractices]);


  // --- Action Handlers ---

  const stageBlockChange = useCallback((dateStr) => {
    const isCurrentlyBlocked = isDateEffectivelyBlocked(dateStr);
    const isStagedForAddition = !!pendingBlockChanges.additions[dateStr];
    const intendsToBlock = !isCurrentlyBlocked && !isStagedForAddition;

    if (intendsToBlock) {
        const conflicts = findConflicts([dateStr]);
        if (conflicts.length > 0) {
            setBlockConflicts(conflicts);
            setPendingBlockAction({ type: 'single', data: dateStr });
            setIsConflictModalOpen(true);
        } else {
            stageBlockChangeInternal(dateStr);
        }
    } else {
        stageBlockChangeInternal(dateStr);
    }
  }, [isDateEffectivelyBlocked, pendingBlockChanges, findConflicts, stageBlockChangeInternal]);


  const handleBulkUpdate = useCallback((criteria) => {
    if (editMode === 'attendance') {
        const { startDate, endDate, daysOfWeek, action, targetPracticeId } = criteria;
        let blockedDayFound = false;
        const start = new Date(`${startDate}T00:00:00Z`);
        const end = new Date(`${endDate}T00:00:00Z`);

        if (action === 'select') {
            for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
                 if (daysOfWeek.includes(d.getUTCDay())) {
                    const year = d.getUTCFullYear();
                    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
                    const day = String(d.getUTCDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    if (isDateEffectivelyBlocked(dateStr)) {
                        blockedDayFound = true;
                        break;
                    }
                 }
            }
        }

        if (blockedDayFound) {
            alert("Cannot apply bulk attendance selection. One or more selected dates are blocked or pending block. Please unblock the dates first or adjust your selection.");
            setBulkEditOpen(false);
        } else {
            applyBulkAttendanceUpdate(criteria);
            setCurrentDate(new Date(`${startDate}T00:00:00`));
            setBulkEditOpen(false);
        }

    } else { // editMode === 'blocks'
        const { startDate, endDate, daysOfWeek, action } = criteria;

        // Panel sends 'block'/'unblock' directly for blocks mode — use it as-is
        const blockAction = action;
        const blockCriteria = { action: blockAction, startDate, endDate, daysOfWeek };

        if (blockCriteria.action === 'block') {
            const datesToBlock = [];
            const start = new Date(`${startDate}T00:00:00Z`);
            const end = new Date(`${endDate}T00:00:00Z`);
             for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
                 if (daysOfWeek.includes(d.getUTCDay())) {
                    const year = d.getUTCFullYear();
                    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
                    const day = String(d.getUTCDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    if (!isDateEffectivelyBlocked(dateStr)) {
                        datesToBlock.push(dateStr);
                    }
                 }
            }

            const conflicts = findConflicts(datesToBlock);
            if (conflicts.length > 0) {
                setBlockConflicts(conflicts);
                setPendingBlockAction({ type: 'bulk', data: blockCriteria });
                setIsConflictModalOpen(true);
            } else {
                applyBulkBlockUpdateInternal(blockCriteria);
                setCurrentDate(new Date(`${startDate}T00:00:00`));
                setBulkEditOpen(false);
            }
        } else { // Unblocking
            applyBulkBlockUpdateInternal(blockCriteria);
            setCurrentDate(new Date(`${startDate}T00:00:00`));
            setBulkEditOpen(false);
        }
    }
  }, [
      editMode,
      applyBulkAttendanceUpdate,
      applyBulkBlockUpdateInternal,
      isDateEffectivelyBlocked,
      findConflicts,
      visiblePractices,
      attendanceEntries
    ]);


  const handleSaveAll = useCallback(async () => {
    try {
        await saveAttendanceChanges();
        await saveBlockChanges();
        alert("Changes saved successfully!");
    } catch(error) {
        console.error("Error saving changes:", error);
        alert("Error saving changes. Check console for details.");
    }
  }, [saveAttendanceChanges, saveBlockChanges]);

  const handleRevertAll = useCallback(() => {
    revertAttendanceChanges();
    revertBlockChanges();
  }, [revertAttendanceChanges, revertBlockChanges]);


  const handleConfirmConflictResolution = useCallback(() => {
    blockConflicts.forEach(conflict => {
        if (!conflict.isPendingAddition && conflict.entryId) {
            stageAttendanceRemoval(conflict.entryId);
        } else if (conflict.isPendingAddition && conflict.additionKey) {
             console.warn("Need mechanism to remove pending attendance addition on conflict confirmation:", conflict.additionKey);
             // Consider adding unstageAttendanceAddition(key) to useAttendanceEditor
        }
    });

    if (pendingBlockAction) {
      if (pendingBlockAction.type === 'single') {
        stageBlockChangeInternal(pendingBlockAction.data);
        setCurrentDate(new Date(`${pendingBlockAction.data}T00:00:00`));
      } else if (pendingBlockAction.type === 'bulk') {
        applyBulkBlockUpdateInternal(pendingBlockAction.data);
        setCurrentDate(new Date(`${pendingBlockAction.data.startDate}T00:00:00`));
      }
    }

    setIsConflictModalOpen(false);
    setBlockConflicts([]);
    setPendingBlockAction(null);
    if (pendingBlockAction?.type === 'bulk') setBulkEditOpen(false);
  }, [blockConflicts, pendingBlockAction, stageAttendanceRemoval, stageBlockChangeInternal, applyBulkBlockUpdateInternal]);


  const handleCancelConflictResolution = useCallback(() => {
    setIsConflictModalOpen(false);
    setBlockConflicts([]);
    setPendingBlockAction(null);
    if (pendingBlockAction?.type === 'bulk') setBulkEditOpen(false);
  }, [pendingBlockAction]);


  const handleDayClick = useCallback((dateStr, practiceId) => {
    if (editMode === 'attendance') {
        const isBlocked = isDateEffectivelyBlocked(dateStr);
        if (!isBlocked) {
             stageAttendanceChange(dateStr, practiceId);
        } else {
            alert(`Cannot add attendance: ${dateStr} is currently blocked or pending block.`);
        }
    } else { // editMode === 'blocks'
        stageBlockChange(dateStr); // Includes conflict check
    }
}, [editMode, stageAttendanceChange, stageBlockChange, isDateEffectivelyBlocked]);


  // --- Render ---
  return (
    <div className={styles.trackerContainer}>
      <div className={styles.mainContent}>
        <AttendanceToolbar
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          pendingAttendanceChanges={pendingAttendanceChanges}
          pendingBlockChanges={pendingBlockChanges}
          onSave={handleSaveAll}
          onRevert={handleRevertAll}
          onAutomate={() => setBulkEditOpen(true)}
          editMode={editMode}
          setEditMode={setEditMode}
        />
        <AttendanceCalendar
          currentDate={currentDate}
          attendanceEntries={attendanceEntries}
          practices={visiblePractices || []}
          colorMap={colorMap}
          pendingAttendanceChanges={pendingAttendanceChanges}
          scheduleBlocks={scheduleBlocks}
          pendingBlockChanges={pendingBlockChanges}
          onDayClick={handleDayClick}
          editMode={editMode}
          isDateBlocked={isDateEffectivelyBlocked} // Pass the combined checker
        />
      </div>

       {visiblePractices && visiblePractices.length > 0 && (
         <AttendanceLegend
           practices={visiblePractices}
           colorMap={colorMap}
           attendanceEntries={attendanceEntries}
           currentDate={currentDate}
           pendingChanges={pendingAttendanceChanges}
         />
       )}

      <Modal isOpen={isBulkEditOpen} onClose={() => setBulkEditOpen(false)} title={`Quick ${editMode === 'attendance' ? 'Attendance' : 'Blocking'}`}>
         <BulkEditPanel
           practices={visiblePractices || []}
           currentDate={currentDate}
           onApply={handleBulkUpdate}
           onCancel={() => setBulkEditOpen(false)}
           mode={editMode}
         />
       </Modal>

      <Modal isOpen={isConflictModalOpen} onClose={handleCancelConflictResolution} title="Block Conflict">
         <BlockConflictModal
             conflicts={blockConflicts}
             onConfirmRemoveAttendance={handleConfirmConflictResolution}
             onCancel={handleCancelConflictResolution}
         />
      </Modal>

    </div>
  );
};

export default AttendanceTracker;