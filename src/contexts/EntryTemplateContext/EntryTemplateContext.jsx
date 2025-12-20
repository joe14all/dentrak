/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import {
  getAllEntryTemplates,
  addEntryTemplate as dbAddEntryTemplate,
  updateEntryTemplate as dbUpdateEntryTemplate,
  deleteEntryTemplate as dbDeleteEntryTemplate,
  createEntryFromTemplate,
  generateEntriesFromTemplate,
} from '../../database/entryTemplates';

const EntryTemplateContext = createContext();

export const EntryTemplateProvider = ({ children }) => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTemplates = useCallback(async () => {
    try {
      const templatesFromDb = await getAllEntryTemplates();
      setTemplates(templatesFromDb);
      console.log(`[EntryTemplateContext] Refreshed ${templatesFromDb.length} templates.`);
    } catch (error) {
      console.error("[EntryTemplateContext] Failed to refresh templates:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await refreshTemplates();
      setIsLoading(false);
    };
    loadInitialData();
  }, [refreshTemplates]);

  const addNewTemplate = async (templateData) => {
    try {
      const newId = await dbAddEntryTemplate(templateData);
      await refreshTemplates();
      return newId;
    } catch (error) {
      console.error("[EntryTemplateContext] Failed to add template:", error);
      throw error;
    }
  };

  const updateTemplate = async (templateId, updatedData) => {
    try {
      await dbUpdateEntryTemplate(templateId, updatedData);
      await refreshTemplates();
    } catch (error) {
      console.error("[EntryTemplateContext] Failed to update template:", error);
      throw error;
    }
  };

  const removeTemplate = async (templateId) => {
    try {
      await dbDeleteEntryTemplate(templateId);
      await refreshTemplates();
    } catch (error) {
      console.error("[EntryTemplateContext] Failed to remove template:", error);
      throw error;
    }
  };

  const getTemplatesForPractice = useCallback(
    (practiceId) => {
      return templates.filter(t => t.practiceId === practiceId);
    },
    [templates]
  );

  const createFromTemplate = useCallback((template, date) => {
    return createEntryFromTemplate(template, date);
  }, []);

  const generateBulkEntries = useCallback((template, startDate, endDate, daysOfWeek, isDateBlockedFn) => {
    return generateEntriesFromTemplate(template, startDate, endDate, daysOfWeek, isDateBlockedFn);
  }, []);

  const value = {
    templates,
    isLoading,
    refreshTemplates,
    addNewTemplate,
    updateTemplate,
    removeTemplate,
    getTemplatesForPractice,
    createFromTemplate,
    generateBulkEntries,
  };

  return (
    <EntryTemplateContext.Provider value={value}>
      {children}
    </EntryTemplateContext.Provider>
  );
};

export const useEntryTemplates = () => {
  const context = useContext(EntryTemplateContext);
  if (context === undefined) {
    throw new Error('useEntryTemplates must be used within an EntryTemplateProvider');
  }
  return context;
};
