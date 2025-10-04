import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { 
  getAllEntries,
  addEntry as dbAddEntry,
  updateEntry as dbUpdateEntry,
  deleteEntry as dbDeleteEntry,
  populateEntries 
} from '../../database/entries';

const EntryContext = createContext();

export const EntryProvider = ({ children }) => {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // This is a safe function to only refresh the state from the DB
  const refreshEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const allEntriesFromDB = await getAllEntries();
      setEntries(allEntriesFromDB);
    } catch (error) {
      console.error(`Failed to fetch all entries:`, error);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // This effect now handles all initialization logic robustly.
  useEffect(() => {
    const initializeDB = async () => {
      // Step 1: Run the smarter populator. It will add missing data if needed.
      await populateEntries();
      // Step 2: Now that we know the DB is correct, refresh the state.
      await refreshEntries();
    };
    initializeDB();
  }, [refreshEntries]); // Depends on refreshEntries to run after it's defined

  const addNewEntry = async (entryData) => {
    try {
      await dbAddEntry(entryData);
      await refreshEntries(); // Refresh state after any change
    } catch (error) {
      console.error("Failed to add new entry:", error);
    }
  };

  const editEntry = async (id, updatedData) => {
    try {
      await dbUpdateEntry(id, updatedData);
      await refreshEntries();
    } catch (error) {
      console.error(`Failed to edit entry ${id}:`, error);
    }
  };

  const removeEntry = async (id) => {
    try {
      await dbDeleteEntry(id);
      await refreshEntries();
    } catch (error) {
      console.error(`Failed to remove entry ${id}:`, error);
    }
  };

  const value = {
    entries,
    isLoading,
    refreshEntries,
    addNewEntry,
    editEntry,
    removeEntry,
  };

  return (
    <EntryContext.Provider value={value}>
      {children}
    </EntryContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useEntries = () => {
  const context = useContext(EntryContext);
  if (context === undefined) {
    throw new Error('useEntries must be used within an EntryProvider');
  }
  return context;
};

