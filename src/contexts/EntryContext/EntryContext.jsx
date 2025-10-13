/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { 
  getAllEntries,
  addEntry as dbAddEntry,
  updateEntry as dbUpdateEntry,
  deleteEntry as dbDeleteEntry,
  populateEntries 
} from '../../database/entries';

const EntryContext = createContext();

let hasInitialized = false;

export const EntryProvider = ({ children }) => {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const allEntriesFromDB = await getAllEntries();
      
      // THE FIX: Sort all entries chronologically after fetching.
      allEntriesFromDB.sort((a, b) => {
        // Robustly get the primary date for sorting (use start date for periods)
        const dateA = new Date(a.date || a.periodStartDate || 0);
        const dateB = new Date(b.date || b.periodStartDate || 0);
        return dateB - dateA; // Sort descending (most recent first)
      });

      console.log(`[EntryContext] Fetched and sorted ${allEntriesFromDB.length} entries.`);
      setEntries(allEntriesFromDB);
    } catch (error) {
      console.error(`[EntryContext] Failed to fetch all entries:`, error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeDB = async () => {
      if (!hasInitialized) {
        hasInitialized = true;
        await populateEntries();
        await refreshEntries();
      } else {
        if (entries.length === 0) {
            await refreshEntries();
        }
      }
    };
    initializeDB();
  }, [refreshEntries, entries.length]);

  const addNewEntry = async (data) => { await dbAddEntry(data); await refreshEntries(); };
  const editEntry = async (id, data) => { await dbUpdateEntry(id, data); await refreshEntries(); };
  const removeEntry = async (id) => { await dbDeleteEntry(id); await refreshEntries(); };

  const value = { entries, isLoading, addNewEntry, editEntry, removeEntry };

  return <EntryContext.Provider value={value}>{children}</EntryContext.Provider>;
};

export const useEntries = () => {
  const context = useContext(EntryContext);
  if (context === undefined) {
    throw new Error('useEntries must be used within an EntryProvider');
  }
  return context;
};

