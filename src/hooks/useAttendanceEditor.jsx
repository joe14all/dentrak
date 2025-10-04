import { useState, useCallback } from 'react';

export const useAttendanceEditor = (entries, addNewEntry, removeEntry) => {
  const [pendingChanges, setPendingChanges] = useState({ additions: {}, removals: new Set() });

  const stageChange = useCallback((dateStr, practiceId) => {
    const newAdditions = { ...pendingChanges.additions };
    const newRemovals = new Set(pendingChanges.removals);
    const additionKey = `${dateStr}-${practiceId}`;
    
    const existingEntry = entries.find(e => e.date === dateStr && e.practiceId === practiceId);

    if (existingEntry) {
      if (newRemovals.has(existingEntry.id)) {
        newRemovals.delete(existingEntry.id);
      } else {
        newRemovals.add(existingEntry.id);
      }
    } else {
      if (newAdditions[additionKey]) {
        delete newAdditions[additionKey];
      } else {
        newAdditions[additionKey] = { date: dateStr, practiceId };
      }
    }
    
    setPendingChanges({ additions: newAdditions, removals: newRemovals });
  }, [entries, pendingChanges.additions, pendingChanges.removals]);

  const applyBulkUpdate = useCallback((criteria) => {
    const { action, targetPracticeId, startDate, endDate, daysOfWeek } = criteria;
    const newAdditions = { ...pendingChanges.additions };
    const newRemovals = new Set(pendingChanges.removals);

    for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
      if (daysOfWeek.includes(d.getDay())) {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const additionKey = `${dateStr}-${targetPracticeId}`;
        const existingEntry = entries.find(e => e.date === dateStr && e.practiceId === targetPracticeId);
        
        if (action === 'select') {
          if (!existingEntry) newAdditions[additionKey] = { date: dateStr, practiceId: targetPracticeId };
        } else if (action === 'deselect') {
          if (newAdditions[additionKey]) delete newAdditions[additionKey];
          if (existingEntry) newRemovals.add(existingEntry.id);
        }
      }
    }
    setPendingChanges({ additions: newAdditions, removals: newRemovals });
  }, [entries, pendingChanges.additions, pendingChanges.removals]);

  const saveChanges = useCallback(() => {
    const { additions, removals } = pendingChanges;
    
    removals.forEach(entryId => removeEntry(entryId));
    Object.values(additions).forEach(addition => {
       const newEntry = {
          practiceId: addition.practiceId,
          entryType: 'attendanceRecord',
          date: addition.date,
          notes: 'Work day',
        };
        addNewEntry(newEntry);
    });
    
    setPendingChanges({ additions: {}, removals: new Set() });
  }, [pendingChanges, addNewEntry, removeEntry]);

  const revertChanges = useCallback(() => {
    setPendingChanges({ additions: {}, removals: new Set() });
  }, []);

  return { pendingChanges, stageChange, applyBulkUpdate, saveChanges, revertChanges };
};
