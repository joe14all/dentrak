import { useState, useCallback } from 'react';
import { useScheduleBlocks } from '../contexts/ScheduleBlockContext/ScheduleBlockContext';

// Helper function (keep as is)
const isDateEffectivelyBlocked = (dateStr, existingBlocks, pendingRemovals) => {
    if (!dateStr || !existingBlocks || existingBlocks.length === 0) {
        return false;
    }
    const checkDate = new Date(`${dateStr}T00:00:00Z`); // Use UTC for comparison consistency

    return existingBlocks.some(block => {
        // Only consider the block if it's NOT staged for removal
        if (pendingRemovals.has(block.id)) {
            return false;
        }
        try {
            const startDate = new Date(`${block.startDate}T00:00:00Z`);
            const endDate = new Date(`${block.endDate}T00:00:00Z`);
            return checkDate >= startDate && checkDate <= endDate;
        } catch (e) {
            console.error("Error parsing block dates:", block, e);
            return false; // Treat invalid blocks as non-blocking
        }
    });
};

export const useScheduleBlockEditor = (initialBlocks, addNewBlock, removeBlock) => {
  const [pendingChanges, setPendingChanges] = useState({ additions: {}, removals: new Set() });

  const stageBlockChange = useCallback((dateStr) => {
    const newAdditions = { ...pendingChanges.additions };
    const newRemovals = new Set(pendingChanges.removals);
    const additionKey = dateStr;

    const existingBlockCoveringDay = initialBlocks.find(block =>
        !newRemovals.has(block.id) &&
        new Date(`${dateStr}T00:00:00Z`) >= new Date(`${block.startDate}T00:00:00Z`) &&
        new Date(`${dateStr}T00:00:00Z`) <= new Date(`${block.endDate}T00:00:00Z`)
    );

    if (existingBlockCoveringDay) {
      newRemovals.add(existingBlockCoveringDay.id);
      if (newAdditions[additionKey]) {
        delete newAdditions[additionKey];
      }
    } else {
      if (newAdditions[additionKey]) {
        delete newAdditions[additionKey];
      } else {
        const removalStagedBlock = initialBlocks.find(block =>
          newRemovals.has(block.id) &&
          new Date(`${dateStr}T00:00:00Z`) >= new Date(`${block.startDate}T00:00:00Z`) &&
          new Date(`${dateStr}T00:00:00Z`) <= new Date(`${block.endDate}T00:00:00Z`)
        );
        if (removalStagedBlock) {
          newRemovals.delete(removalStagedBlock.id);
        } else {
           newAdditions[additionKey] = { startDate: dateStr, endDate: dateStr, reason: 'Blocked' };
        }
      }
    }
    const newState = { additions: newAdditions, removals: newRemovals };
    setPendingChanges(newState);
  }, [initialBlocks, pendingChanges.additions, pendingChanges.removals]);


  const applyBulkBlockUpdate = useCallback((criteria) => {
    const { action, startDate, endDate, daysOfWeek } = criteria;

    setPendingChanges(currentPendingChanges => {
        const nextAdditions = { ...currentPendingChanges.additions };
        const nextRemovals = new Set(currentPendingChanges.removals);

        const start = new Date(`${startDate}T00:00:00Z`);
        const end = new Date(`${endDate}T00:00:00Z`);

        for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
            const year = d.getUTCFullYear();
            const month = String(d.getUTCMonth() + 1).padStart(2, '0');
            const day = String(d.getUTCDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

          if (daysOfWeek.includes(d.getUTCDay())) {
            const additionKey = dateStr;

            const existingBlocksCoveringDay = initialBlocks.filter(block =>
                new Date(`${dateStr}T00:00:00Z`) >= new Date(`${block.startDate}T00:00:00Z`) &&
                new Date(`${dateStr}T00:00:00Z`) <= new Date(`${block.endDate}T00:00:00Z`)
            );

            if (action === 'block') {
                const isAlreadyEffectivelyBlocked = existingBlocksCoveringDay.some(b => !nextRemovals.has(b.id));

                if (!isAlreadyEffectivelyBlocked && !nextAdditions[additionKey]) {
                    nextAdditions[additionKey] = { startDate: dateStr, endDate: dateStr, reason: 'Blocked (Bulk)' };
                }
                existingBlocksCoveringDay.forEach(block => {
                    if (nextRemovals.has(block.id)) {
                        nextRemovals.delete(block.id);
                    }
                });

            } else if (action === 'unblock') {
              if (nextAdditions[additionKey]) {
                delete nextAdditions[additionKey];
              }
              existingBlocksCoveringDay.forEach(block => {
                  if (!nextRemovals.has(block.id)) {
                     nextRemovals.add(block.id);
                  }
              });
            }
          }
        }
        const newState = { additions: nextAdditions, removals: nextRemovals };
        return newState;
    });

  }, [initialBlocks]);


  const saveBlockChanges = useCallback(async () => {
    const { additions, removals } = pendingChanges;
    const removalPromises = [];
    const additionPromises = [];

    removals.forEach(blockId => removalPromises.push(removeBlock(blockId)));

    Object.values(additions).forEach(addition => {
      additionPromises.push(addNewBlock({
        startDate: addition.startDate,
        endDate: addition.endDate,
        reason: addition.reason || 'Blocked',
      }));
    });

    try {
        await Promise.all([...removalPromises, ...additionPromises]);
        setPendingChanges({ additions: {}, removals: new Set() });
    } catch (error) {
        console.error("Error saving block changes:", error);
        throw error;
    }
  }, [pendingChanges, addNewBlock, removeBlock]);


  const revertBlockChanges = useCallback(() => {
    setPendingChanges({ additions: {}, removals: new Set() });
  }, []);

  return {
      pendingBlockChanges: pendingChanges,
      stageBlockChange,
      applyBulkBlockUpdate,
      saveBlockChanges,
      revertBlockChanges
  };
};