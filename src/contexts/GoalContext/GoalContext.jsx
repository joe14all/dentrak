import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import {
  getAllGoals,
  addGoal as dbAddGoal,
  updateGoal as dbUpdateGoal,
  deleteGoal as dbDeleteGoal,
} from '../../database/goals'; // Import the new DB functions

const GoalContext = createContext();

export const GoalProvider = ({ children }) => {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshGoals = useCallback(async () => {
    // Don't set loading true here unless it's the initial load,
    // to avoid UI flicker on subsequent updates.
    try {
      const goalsFromDb = await getAllGoals();
      setGoals(goalsFromDb);
      console.log(`[GoalContext] Refreshed ${goalsFromDb.length} goals.`);
    } catch (error) {
      console.error("[GoalContext] Failed to refresh goals:", error);
    }
  }, []);

  // Initial load effect
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await refreshGoals();
      setIsLoading(false);
    };
    loadInitialData();
  }, [refreshGoals]);

  const addNewGoal = async (goalData) => {
    try {
      await dbAddGoal(goalData);
      await refreshGoals(); // Refresh state after adding
    } catch (error) {
      console.error("[GoalContext] Failed to add new goal:", error);
      throw error; // Re-throw for potential UI feedback
    }
  };

  const editGoal = async (goalId, updatedData) => {
    try {
      await dbUpdateGoal(goalId, updatedData);
      await refreshGoals(); // Refresh state after editing
    } catch (error) {
      console.error(`[GoalContext] Failed to edit goal ${goalId}:`, error);
      throw error;
    }
  };

  const removeGoal = async (goalId) => {
    try {
      await dbDeleteGoal(goalId);
      await refreshGoals(); // Refresh state after deleting
    } catch (error) {
      console.error(`[GoalContext] Failed to remove goal ${goalId}:`, error);
      throw error;
    }
  };

  const value = {
    goals,
    isLoading,
    refreshGoals,
    addNewGoal,
    editGoal,
    removeGoal,
  };

  return (
    <GoalContext.Provider value={value}>
      {children}
    </GoalContext.Provider>
  );
};

// Custom hook
// eslint-disable-next-line react-refresh/only-export-components
export const useGoals = () => {
  const context = useContext(GoalContext);
  if (context === undefined) {
    throw new Error('useGoals must be used within a GoalProvider');
  }
  return context;
};