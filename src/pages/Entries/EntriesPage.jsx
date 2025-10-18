import React, { useState, useMemo } from 'react';
import { useEntries } from '../../contexts/EntryContext/EntryContext';
import { usePractices } from '../../contexts/PracticeContext/PracticeContext';
import PageHeader from '../../features/entries/PageHeader';
import PerformanceToolbar from '../../features/entries/PerformanceToolbar';
import PerformanceSummary from '../../features/entries/PerformanceSummary'; // Import the new component
import EntriesList from '../../features/entries/EntriesList';
import AttendanceTracker from '../../features/entries/attendance/AttendanceTracker';
import Modal from '../../components/common/Modal/Modal';
import EntryForm from '../../features/entries/form-components/EntryForm';
import DeleteConfirmation from '../../features/entries/DeleteConfirmation';
import styles from './EntriesPage.module.css';

const EntriesPage = () => {
  const { entries, isLoading, addNewEntry, editEntry, removeEntry } = useEntries();
  const { practices } = usePractices();

  const [activeView, setActiveView] = useState('performance');
  const [filters, setFilters] = useState({
    practiceId: 'all',
    entryTypes: [],
    startDate: '',
    endDate: ''
  });

  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);

  const filteredPerformanceEntries = useMemo(() => {
    if (!entries) return [];
    
    let performanceEntries = entries.filter(entry => entry.entryType !== 'attendanceRecord');

    if (filters.practiceId !== 'all') {
      performanceEntries = performanceEntries.filter(e => e.practiceId === parseInt(filters.practiceId));
    }
    if (filters.entryTypes.length > 0) {
      performanceEntries = performanceEntries.filter(e => filters.entryTypes.includes(e.entryType));
    }
    
    if (filters.startDate) {
      const startDateFilter = new Date(`${filters.startDate}T00:00:00Z`);
      performanceEntries = performanceEntries.filter(e => {
        const dateStr = e.entryType === 'periodSummary' ? e.periodEndDate : e.date;
        if (!dateStr) return false;
        return new Date(`${dateStr}T00:00:00Z`) >= startDateFilter;
      });
    }
    if (filters.endDate) {
      const endDateFilter = new Date(`${filters.endDate}T00:00:00Z`);
      performanceEntries = performanceEntries.filter(e => {
        const dateStr = e.entryType === 'periodSummary' ? e.periodStartDate : e.date;
        if (!dateStr) return false;
        return new Date(`${dateStr}T00:00:00Z`) <= endDateFilter;
      });
    }

    return performanceEntries;
  }, [entries, filters]);

  // Calculate summary data from the filtered entries
  const performanceSummaryData = useMemo(() => {
    return filteredPerformanceEntries.reduce((acc, entry) => {
      acc.totalProduction += entry.production || 0;
      acc.totalCollection += entry.collection || 0;
      acc.totalAdjustments += (entry.adjustments || []).reduce((sum, adj) => sum + adj.amount, 0);
      return acc;
    }, { totalProduction: 0, totalCollection: 0, totalAdjustments: 0 });
  }, [filteredPerformanceEntries]);


  const handleOpenAddModal = () => {
    setEntryToEdit(null);
    setFormModalOpen(true);
  };
  const handleOpenEditModal = (entry) => {
    setEntryToEdit(entry);
    setFormModalOpen(true);
  };
  const handleOpenDeleteModal = (entryId) => {
    setEntryToDelete(entryId);
    setDeleteModalOpen(true);
  };
  const handleCloseModals = () => {
    setFormModalOpen(false);
    setDeleteModalOpen(false);
    setEntryToEdit(null);
    setEntryToDelete(null);
  };
  const handleSaveEntry = (formData) => {
    if (entryToEdit) {
      editEntry(entryToEdit.id, formData);
    } else {
      addNewEntry(formData);
    }
    handleCloseModals();
  };
  const handleConfirmDelete = () => {
    if (entryToDelete) {
      removeEntry(entryToDelete);
    }
    handleCloseModals();
  };


  return (
    <div className={styles.entriesPage}>
      <PageHeader
        title="Entries"
        activeView={activeView}
        setActiveView={setActiveView}
      />
      
      {activeView === 'performance' && (
        <>
          <PerformanceToolbar
            practices={practices}
            activeFilters={filters}
            onFilterChange={setFilters}
            onAddEntry={handleOpenAddModal}
          />
          {/* Add the new summary component here */}
          <PerformanceSummary summaryData={performanceSummaryData} />
        </>
      )}
      
      <div className={styles.viewContent}>
        {activeView === 'performance' ? (
          <EntriesList 
            entries={filteredPerformanceEntries}
            practices={practices}
            isLoading={isLoading}
            onEditEntry={handleOpenEditModal}
            onDeleteEntry={handleOpenDeleteModal}
          />
        ) : (
          <AttendanceTracker 
            entries={entries}
            practices={practices}
          />
        )}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={handleCloseModals} title={entryToEdit ? "Edit Entry" : "Add New Entry"}>
        <EntryForm 
          entryToEdit={entryToEdit}
          practices={practices}
          initialEntryType={activeView === 'attendance' ? 'attendanceRecord' : 'dailySummary'}
          onSave={handleSaveEntry}
          onCancel={handleCloseModals}
        />
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseModals} title="Confirm Deletion">
        <DeleteConfirmation onConfirm={handleConfirmDelete} onCancel={handleCloseModals} />
      </Modal>
    </div>
  );
};

export default EntriesPage;