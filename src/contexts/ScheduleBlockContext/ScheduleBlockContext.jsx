/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import {
  getAllScheduleBlocks,
  addScheduleBlock as dbAddScheduleBlock,
  deleteScheduleBlock as dbDeleteScheduleBlock,
  isDateBlocked as checkDateBlocked // Import the utility function
} from '../../database/scheduleBlocks';

const ScheduleBlockContext = createContext();

export const ScheduleBlockProvider = ({ children }) => {
  const [scheduleBlocks, setScheduleBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshScheduleBlocks = useCallback(async () => {
    // No need to set loading true here if it's just a refresh,
    // only on initial load. Let the caller decide if UI needs loading state.
    try {
      const blocksFromDb = await getAllScheduleBlocks();
      setScheduleBlocks(blocksFromDb);
      console.log(`[ScheduleBlockContext] Refreshed ${blocksFromDb.length} blocks.`);
    } catch (error) {
      console.error("[ScheduleBlockContext] Failed to refresh schedule blocks:", error);
    }
  }, []);

  // Initial load effect
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await refreshScheduleBlocks();
      setIsLoading(false);
    };
    loadInitialData();
  }, [refreshScheduleBlocks]);

  const addNewBlock = async (blockData) => {
    try {
      await dbAddScheduleBlock(blockData);
      await refreshScheduleBlocks(); // Refresh state after adding
    } catch (error) {
      console.error("[ScheduleBlockContext] Failed to add new block:", error);
      // Optional: Add user feedback here (e.g., toast notification)
    }
  };

  const removeBlock = async (blockId) => {
    try {
      await dbDeleteScheduleBlock(blockId);
      await refreshScheduleBlocks(); // Refresh state after deleting
    } catch (error) {
      console.error("[ScheduleBlockContext] Failed to remove block:", error);
      // Optional: Add user feedback here
    }
  };

  /**
   * Checks if a specific date string (YYYY-MM-DD) is blocked.
   * @param {string} dateStr
   * @returns {boolean}
   */
  const isBlocked = useCallback((dateStr) => {
      // Use the imported utility function with the current state
      return checkDateBlocked(dateStr, scheduleBlocks);
  }, [scheduleBlocks]);


  const value = {
    scheduleBlocks,
    isLoading,
    refreshScheduleBlocks,
    addNewBlock,
    removeBlock,
    isDateBlocked: isBlocked // Expose the check function
  };

  return (
    <ScheduleBlockContext.Provider value={value}>
      {children}
    </ScheduleBlockContext.Provider>
  );
};

export const useScheduleBlocks = () => {
  const context = useContext(ScheduleBlockContext);
  if (context === undefined) {
    throw new Error('useScheduleBlocks must be used within a ScheduleBlockProvider');
  }
  return context;
};