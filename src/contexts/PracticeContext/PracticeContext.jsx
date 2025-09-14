import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { 
  getAllPractices, 
  addPractice, 
  updatePractice, 
  deletePractice,
  populatePractices // Import the populator function
} from '../../database/practices';

// 1. Create the context
const PracticeContext = createContext();

// 2. Create the provider component
export const PracticeProvider = ({ children }) => {
  const [practices, setPractices] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Add a loading state
  const [selectedPractice, setSelectedPractice] = useState(null);

  // A function just for reloading the practices from the DB into state
  const refreshPractices = useCallback(async () => {
    setIsLoading(true);
    try {
      const practicesFromDB = await getAllPractices();
      setPractices(practicesFromDB);
    } catch (error) {
      console.error("Failed to refresh practices:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // This effect runs only ONCE on mount to handle the initial data population.
  useEffect(() => {
    const initializeDB = async () => {
      try {
        // This function has an internal check and will only populate if the DB is empty
        await populatePractices();
        // After ensuring data is there, perform the initial load
        await refreshPractices();
      } catch (error) {
        console.error("Failed to initialize database:", error);
        setIsLoading(false);
      }
    };
    
    initializeDB();
  }, [refreshPractices]); // refreshPractices is stable due to useCallback

  // --- CRUD Functions ---

  const addNewPractice = async (practiceData) => {
    try {
      await addPractice(practiceData);
      await refreshPractices(); // Safely reload the list
    } catch (error) {
      console.error("Failed to add new practice:", error);
    }
  };

  const editPractice = async (id, updatedData) => {
    try {
      await updatePractice(id, updatedData);
      await refreshPractices(); // Safely reload
    } catch (error) {
      console.error("Failed to edit practice:", error);
    }
  };

  const removePractice = async (id) => {
    try {
      await deletePractice(id);
      await refreshPractices(); // Safely reload
    } catch (error) {
      console.error("Failed to remove practice:", error);
    }
  };

  const value = {
    practices,
    selectedPractice,
    setSelectedPractice,
    isLoading,
    refreshPractices, // Expose the safe refresh function
    addNewPractice,
    editPractice,
    removePractice,
  };

  return (
    <PracticeContext.Provider value={value}>
      {children}
    </PracticeContext.Provider>
  );
};

// 3. Create a custom hook for easy consumption
// eslint-disable-next-line react-refresh/only-export-components
export const usePractices = () => {
  const context = useContext(PracticeContext);
  if (context === undefined) {
    throw new Error('usePractices must be used within a PracticeProvider');
  }
  return context;
};

