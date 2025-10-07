import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { 
  getAllEntries,
  addEntry as dbAddEntry,
  updateEntry as dbUpdateEntry,
  deleteEntry as dbDeleteEntry,
  populateEntries 
} from '../../database/entries';

const EntryContext = createContext();

// This flag exists OUTSIDE the component. It will only be false once
// when the application first loads.
let hasInitialized = false;

export const EntryProvider = ({ children }) => {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const allEntriesFromDB = await getAllEntries();
      setEntries(allEntriesFromDB);
    } catch (error) {
      console.error(`[EntryContext] Failed to fetch all entries:`, error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeDB = async () => {
      // We check the module-level flag.
      if (!hasInitialized) {
        // If it's the first run, set the flag to true immediately.
        hasInitialized = true;
        await populateEntries();
        await refreshEntries();
      } else {
        // On subsequent runs (like from Strict Mode), this will be skipped.
        // We can still refresh to ensure data is up to date if needed.
        if (entries.length === 0) { // Only refresh if state is empty
            await refreshEntries();
        }
      }
    };

    initializeDB();
    
    // We no longer need the cleanup function for this pattern.
  }, [refreshEntries, entries.length]); // Add entries.length to dependencies

  const addNewEntry = async (data) => { await dbAddEntry(data); await refreshEntries(); };
  const editEntry = async (id, data) => { await dbUpdateEntry(id, data); await refreshEntries(); };
  const removeEntry = async (id) => { await dbDeleteEntry(id); await refreshEntries(); };

  const value = { entries, isLoading, addNewEntry, editEntry, removeEntry };

  return <EntryContext.Provider value={value}>{children}</EntryContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useEntries = () => {
  const context = useContext(EntryContext);
  if (context === undefined) {
    throw new Error('useEntries must be used within an EntryProvider');
  }
  return context;
};

