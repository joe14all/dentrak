/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import {
  getAllExpenses,
  getExpensesByYear,
  getExpensesByYearAndCategory,
  getExpensesByPractice,
  getExpensesByDateRange,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpenseTotalsByCategory,
  getQuarterlyExpenseTotals,
  EXPENSE_CATEGORIES,
} from '../../database/expenses';

const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all expenses on mount
  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllExpenses();
      setExpenses(data);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Add a new expense
  const addNewExpense = useCallback(async (expenseData) => {
    try {
      const id = await addExpense(expenseData);
      await loadExpenses(); // Reload to get the complete expense with year
      return id;
    } catch (error) {
      console.error('Failed to add expense:', error);
      throw error;
    }
  }, [loadExpenses]);

  // Update an expense
  const editExpense = useCallback(async (id, updates) => {
    try {
      await updateExpense(id, updates);
      await loadExpenses();
    } catch (error) {
      console.error('Failed to update expense:', error);
      throw error;
    }
  }, [loadExpenses]);

  // Delete an expense
  const removeExpense = useCallback(async (id) => {
    try {
      await deleteExpense(id);
      await loadExpenses();
    } catch (error) {
      console.error('Failed to delete expense:', error);
      throw error;
    }
  }, [loadExpenses]);

  // Get expenses for a specific year
  const getYearExpenses = useCallback(async (year) => {
    try {
      return await getExpensesByYear(year);
    } catch (error) {
      console.error('Failed to get expenses by year:', error);
      return [];
    }
  }, []);

  // Get expenses by category
  const getCategoryExpenses = useCallback(async (year, category) => {
    try {
      return await getExpensesByYearAndCategory(year, category);
    } catch (error) {
      console.error('Failed to get expenses by category:', error);
      return [];
    }
  }, []);

  // Get expenses for a practice
  const getPracticeExpenses = useCallback(async (practiceId) => {
    try {
      return await getExpensesByPractice(practiceId);
    } catch (error) {
      console.error('Failed to get expenses by practice:', error);
      return [];
    }
  }, []);

  // Get expenses in date range
  const getDateRangeExpenses = useCallback(async (startDate, endDate) => {
    try {
      return await getExpensesByDateRange(startDate, endDate);
    } catch (error) {
      console.error('Failed to get expenses by date range:', error);
      return [];
    }
  }, []);

  // Get category totals for a year
  const getCategoryTotals = useCallback(async (year) => {
    try {
      return await getExpenseTotalsByCategory(year);
    } catch (error) {
      console.error('Failed to get category totals:', error);
      return {};
    }
  }, []);

  // Get quarterly totals
  const getQuarterlyTotals = useCallback(async (year) => {
    try {
      return await getQuarterlyExpenseTotals(year);
    } catch (error) {
      console.error('Failed to get quarterly totals:', error);
      return [];
    }
  }, []);

  const value = {
    expenses,
    isLoading,
    categories: EXPENSE_CATEGORIES,
    addNewExpense,
    editExpense,
    removeExpense,
    getYearExpenses,
    getCategoryExpenses,
    getPracticeExpenses,
    getDateRangeExpenses,
    getCategoryTotals,
    getQuarterlyTotals,
    refreshExpenses: loadExpenses,
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};
