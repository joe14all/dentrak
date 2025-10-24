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
        // If staged for removal, unstage it
        newRemovals.delete(existingEntry.id);
      } else {
        // If not staged for removal, stage it
        newRemovals.add(existingEntry.id);
         // If we stage removal, ensure any pending addition is also removed
         if (newAdditions[additionKey]) {
            delete newAdditions[additionKey];
         }
      }
    } else {
      // No existing entry for this day/practice
      if (newAdditions[additionKey]) {
        // If staged for addition, unstage it (toggle off)
        delete newAdditions[additionKey];
      } else {
         // Before adding, check if removal was staged for an existing entry on the same day/practice
         // (this handles the case where an existing entry was clicked off in the same session before clicking back on)
         const wasRemoved = Array.from(newRemovals).some(removedId => {
             const removedEntry = entries.find(e => e.id === removedId);
             return removedEntry && removedEntry.date === dateStr && removedEntry.practiceId === practiceId;
         });

         if (!wasRemoved) { // Only stage addition if not toggling off a staged removal
            newAdditions[additionKey] = { date: dateStr, practiceId };
         } else {
             // If it was staged for removal, simply unstage the removal instead of adding
             const entryToRemove = entries.find(e => e.date === dateStr && e.practiceId === practiceId);
             if(entryToRemove) {
                 newRemovals.delete(entryToRemove.id);
             }
             console.warn("Attempted to stage addition which seems to be cancelling a staged removal on the same click cycle.");
         }
      }
    }

    setPendingChanges({ additions: newAdditions, removals: newRemovals });
  }, [entries, pendingChanges.additions, pendingChanges.removals]);


  // Function to explicitly stage the removal of an existing entry by ID
  const stageRemoval = useCallback((entryId) => {
      setPendingChanges(prev => {
          if (prev.removals.has(entryId)) return prev; // Already staged

          const newRemovals = new Set(prev.removals);
          newRemovals.add(entryId);

          // Also remove any pending addition for the same day/practice if it exists
          const entryToRemove = entries.find(e => e.id === entryId);
          const newAdditions = { ...prev.additions };
          if (entryToRemove) {
              const additionKey = `${entryToRemove.date}-${entryToRemove.practiceId}`;
              if (newAdditions[additionKey]) {
                  delete newAdditions[additionKey];
              }
          }

          return { additions: newAdditions, removals: newRemovals };
      });
  }, [entries]); // Added entries dependency

  const applyBulkUpdate = useCallback((criteria) => {
    const { action, targetPracticeId, startDate, endDate, daysOfWeek } = criteria;
    const newAdditions = { ...pendingChanges.additions };
    const newRemovals = new Set(pendingChanges.removals);

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
          }
          // Only add if it doesn't exist and isn't already staged
          if (!existingEntry && !newAdditions[additionKey]) {
            newAdditions[additionKey] = { date: dateStr, practiceId: targetPracticeId };
          }
        } else if (action === 'deselect') {
          if (newAdditions[additionKey]) {
            delete newAdditions[additionKey]; // Unstage addition
          }
          // Stage removal only if it exists and isn't already staged
          if (existingEntry && !newRemovals.has(existingEntry.id)) {
            newRemovals.add(existingEntry.id);
          }
        }
      }
    }
    setPendingChanges({ additions: newAdditions, removals: newRemovals });
  }, [entries, pendingChanges.additions, pendingChanges.removals]);


  const saveChanges = useCallback(async () => { // Make async for potential DB operations
    const { additions, removals } = pendingChanges;
    const removalPromises = [];
    const additionPromises = [];

    removals.forEach(entryId => {
        console.log(`[useAttendanceEditor] Staging removal promise for entry ID: ${entryId}`);
        removalPromises.push(removeEntry(entryId)); // Assuming removeEntry is async
    });

    Object.values(additions).forEach(addition => {
       const newEntry = {
          practiceId: addition.practiceId,
          entryType: 'attendanceRecord',
          date: addition.date,
          notes: 'Work day (Bulk/Single Add)', // Default note
          // Add default checkInTime/checkOutTime if desired
        };
        console.log(`[useAttendanceEditor] Staging addition promise for date: ${addition.date}, practice: ${addition.practiceId}`);
        additionPromises.push(addNewEntry(newEntry)); // Assuming addNewEntry is async
    });

    try {
        console.log(`[useAttendanceEditor] Executing ${removalPromises.length} removals and ${additionPromises.length} additions.`);
        await Promise.all([...removalPromises, ...additionPromises]);
        setPendingChanges({ additions: {}, removals: new Set() }); // Clear changes only on success
        console.log("[useAttendanceEditor] Attendance changes saved successfully.");
        // Consider triggering a refresh or relying on context updates
    } catch (error) {
        console.error("[useAttendanceEditor] Error saving attendance changes:", error);
        // Optionally: revert UI state or show error to user
        // Do NOT clear pendingChanges here, so the user can see what failed or retry
        throw error; // Re-throw so the caller knows it failed
    }

  }, [pendingChanges, addNewEntry, removeEntry]);

  const revertChanges = useCallback(() => {
    setPendingChanges({ additions: {}, removals: new Set() });
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