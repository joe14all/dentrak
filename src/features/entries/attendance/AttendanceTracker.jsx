import React, { useState, useMemo} from 'react';
import AttendanceToolbar from './AttendanceToolbar';
import AttendanceCalendar from './AttendanceCalendar';
import AttendanceLegend from './AttendanceLegend';
import Modal from '../../../components/common/Modal/Modal';
import BulkEditPanel from './BulkEditPanel';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';
import { useAttendanceEditor } from '../../../hooks/useAttendanceEditor';
import styles from './AttendanceTracker.module.css';

const generateColorMap = (practices) => {
  if (!practices) return {};
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const map = {};
  practices.forEach((p, index) => {
    map[p.id] = colors[index % colors.length];
  });
  return map;
};

const AttendanceTracker = ({ entries, practices }) => {
  const { addNewEntry, removeEntry } = useEntries();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isBulkEditOpen, setBulkEditOpen] = useState(false);

  const attendanceEntries = useMemo(() => {
    if (!entries) return [];
    return entries.filter(e => e.entryType === 'attendanceRecord');
  }, [entries]);

  const { pendingChanges, stageChange, applyBulkUpdate, saveChanges, revertChanges } = useAttendanceEditor(
    attendanceEntries, 
    addNewEntry, 
    removeEntry
  );
  
  const colorMap = useMemo(() => generateColorMap(practices), [practices]);
  
  const handleBulkUpdate = (criteria) => {
    applyBulkUpdate(criteria);
    setBulkEditOpen(false);
  };
  
  return (
    <div className={styles.trackerContainer}>
      <div className={styles.mainContent}>
        <AttendanceToolbar
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          pendingChanges={pendingChanges}
          onSave={saveChanges}
          onRevert={revertChanges}
          onAutomate={() => setBulkEditOpen(true)}
        />
        <AttendanceCalendar
          currentDate={currentDate}
          attendanceEntries={attendanceEntries}
          practices={practices || []}
          colorMap={colorMap}
          pendingChanges={pendingChanges}
          onDayClick={stageChange}
        />
      </div>
      
      {practices && practices.length > 0 && (
        <AttendanceLegend 
          practices={practices} 
          colorMap={colorMap}
          attendanceEntries={attendanceEntries}
          currentDate={currentDate}
          pendingChanges={pendingChanges}
        />
      )}

      <Modal isOpen={isBulkEditOpen} onClose={() => setBulkEditOpen(false)} title="">
        <BulkEditPanel 
          practices={practices || []}
          currentDate={currentDate}
          onApply={handleBulkUpdate}
          onCancel={() => setBulkEditOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default AttendanceTracker;

