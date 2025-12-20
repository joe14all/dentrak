import { useState, useCallback } from 'react';

export const useAttendanceEditor = (entries, addNewEntry, removeEntry, updateEntry) => {
  const [pendingChanges, setPendingChanges] = useState({ additions: {}, removals: new Set(), updates: {} });

  const stageChange = useCallback((dateStr, practiceId) => {
    const newAdditions = { ...pendingChanges.additions };
    const newRemovals = new Set(pendingChanges.removals);
    const newUpdates = { ...pendingChanges.updates };
    const additionKey = `${dateStr}-${practiceId}`;

    const existingEntry = entries.find(e => e.date === dateStr && e.practiceId === practiceId);

    if (existingEntry) {
      // Entry exists - cycle through: full-day → half-day → removal
      const currentType = newUpdates[existingEntry.id]?.attendanceType || existingEntry.attendanceType || 'full-day';
      
      if (currentType === 'full-day') {
        // Change to half-day
        newUpdates[existingEntry.id] = { attendanceType: 'half-day' };
        newRemovals.delete(existingEntry.id); // Ensure not staged for removal
      } else if (currentType === 'half-day') {
        // Remove the entry
        newRemovals.add(existingEntry.id);
        delete newUpdates[existingEntry.id]; // Clear any pending update
      }
    } else {
      // No existing entry
      const stagedAddition = newAdditions[additionKey];
      
      if (!stagedAddition) {
        // Add as full-day
        newAdditions[additionKey] = { date: dateStr, practiceId, attendanceType: 'full-day' };
      } else if (stagedAddition.attendanceType === 'full-day') {
        // Change to half-day
        newAdditions[additionKey] = { date: dateStr, practiceId, attendanceType: 'half-day' };
      } else {
        // Remove the staged addition
        delete newAdditions[additionKey];
      }
    }

    setPendingChanges({ additions: newAdditions, removals: newRemovals, updates: newUpdates });
  }, [entries, pendingChanges.additions, pendingChanges.removals, pendingChanges.updates]);


  // Function to explicitly stage the removal of an existing entry by ID
  const stageRemoval = useCallback((entryId) => {
      setPendingChanges(prev => {
          if (prev.removals.has(entryId)) return prev; // Already staged

          const newRemovals = new Set(prev.removals);
          newRemovals.add(entryId);

          // Also remove any pending addition for the same day/practice if it exists
          const entryToRemove = entries.find(e => e.id === entryId);
          const newAdditions = { ...prev.additions };
          const newUpdates = { ...prev.updates };
          
          if (entryToRemove) {
              const additionKey = `${entryToRemove.date}-${entryToRemove.practiceId}`;
              if (newAdditions[additionKey]) {
                  delete newAdditions[additionKey];
              }
              // Clear any pending update for this entry
              delete newUpdates[entryId];
          }

          return { additions: newAdditions, removals: newRemovals, updates: newUpdates };
      });
  }, [entries]); // Added entries dependency

  const applyBulkUpdate = useCallback((criteria) => {
    const { action, targetPracticeId, startDate, endDate, daysOfWeek, attendanceType } = criteria;
    const newAdditions = { ...pendingChanges.additions };
    const newRemovals = new Set(pendingChanges.removals);
    const newUpdates = { ...pendingChanges.updates };

    // Use UTC dates for reliable iteration
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);

    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        // Extract UTC date parts
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

      if (daysOfWeek.includes(d.getUTCDay())) { // Use getUTCDay
        const additionKey = `${dateStr}-${targetPracticeId}`;
        const existingEntry = entries.find(e => e.date === dateStr && e.practiceId === targetPracticeId);

        if (action === 'select') {
          if (existingEntry) {
            newRemovals.delete(existingEntry.id); // Ensure removal is unstaged
            // Update attendance type if specified
            if (attendanceType) {
              newUpdates[existingEntry.id] = { attendanceType };
            }
          }
          // Only add if it doesn't exist and isn't already staged
          if (!existingEntry && !newAdditions[additionKey]) {
            newAdditions[additionKey] = { 
              date: dateStr, 
              practiceId: targetPracticeId,
              attendanceType: attendanceType || 'full-day'
            };
          }
        } else if (action === 'deselect') {
          if (newAdditions[additionKey]) {
            delete newAdditions[additionKey]; // Unstage addition
          }
          // Stage removal only if it exists and isn't already staged
          if (existingEntry && !newRemovals.has(existingEntry.id)) {
            newRemovals.add(existingEntry.id);
            delete newUpdates[existingEntry.id]; // Clear any pending update
          }
        }
      }
    }
    setPendingChanges({ additions: newAdditions, removals: newRemovals, updates: newUpdates });
  }, [entries, pendingChanges.additions, pendingChanges.removals, pendingChanges.updates]);


  const saveChanges = useCallback(async () => { // Make async for potential DB operations
    const { additions, removals, updates } = pendingChanges;
    const removalPromises = [];
    const additionPromises = [];
    const updatePromises = [];

    removals.forEach(entryId => {
        console.log(`[useAttendanceEditor] Staging removal promise for entry ID: ${entryId}`);
        removalPromises.push(removeEntry(entryId)); // Assuming removeEntry is async
    });

    Object.values(additions).forEach(addition => {
       const newEntry = {
          practiceId: addition.practiceId,
          entryType: 'attendanceRecord',
          date: addition.date,
          attendanceType: addition.attendanceType || 'full-day', // Default to full-day
          notes: 'Work day (Bulk/Single Add)', // Default note
          // Add default checkInTime/checkOutTime if desired
        };
        console.log(`[useAttendanceEditor] Staging addition promise for date: ${addition.date}, practice: ${addition.practiceId}, type: ${newEntry.attendanceType}`);
        additionPromises.push(addNewEntry(newEntry)); // Assuming addNewEntry is async
    });

    Object.entries(updates).forEach(([entryId, updateData]) => {
        console.log(`[useAttendanceEditor] Staging update promise for entry ID: ${entryId}, data:`, updateData);
        updatePromises.push(updateEntry(parseInt(entryId), updateData));
    });

    try {
        console.log(`[useAttendanceEditor] Executing ${removalPromises.length} removals, ${additionPromises.length} additions, and ${updatePromises.length} updates.`);
        await Promise.all([...removalPromises, ...additionPromises, ...updatePromises]);
        setPendingChanges({ additions: {}, removals: new Set(), updates: {} }); // Clear changes only on success
        console.log("[useAttendanceEditor] Attendance changes saved successfully.");
        // Consider triggering a refresh or relying on context updates
    } catch (error) {
        console.error("[useAttendanceEditor] Error saving attendance changes:", error);
        // Optionally: revert UI state or show error to user
        // Do NOT clear pendingChanges here, so the user can see what failed or retry
        throw error; // Re-throw so the caller knows it failed
    }

  }, [pendingChanges, addNewEntry, removeEntry, updateEntry]);

  const revertChanges = useCallback(() => {
    setPendingChanges({ additions: {}, removals: new Set(), updates: {} });
  }, []);

  return {
    pendingChanges,
    stageChange,
    applyBulkUpdate,
    saveChanges,
    revertChanges,
    stageRemoval // Expose the function needed by the conflict modal
  };
};