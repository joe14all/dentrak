import React from 'react';
import styles from './FinancialsFilterBar.module.css';
import { X } from 'lucide-react';

const FinancialsFilterBar = ({ practices, filters, onFilterChange }) => {
  const handleChange = (field, value) => {
    onFilterChange(prev => ({ ...prev, [field]: value }));
  };

  const handleClear = () => {
    onFilterChange({
      practiceId: 'all',
      source: 'all',
      status: 'all',
      startDate: '',
      endDate: '',
    });
  };

  const activeFilterCount =
    (filters.practiceId !== 'all' ? 1 : 0) +
    (filters.source !== 'all' ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.startDate ? 1 : 0) +
    (filters.endDate ? 1 : 0);

  return (
    <div className={styles.filterBar}>
      <div className={styles.filterGroup}>
        <label>Practice</label>
        <select value={filters.practiceId} onChange={(e) => handleChange('practiceId', e.target.value)}>
          <option value="all">All Practices</option>
          {(practices || []).map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label>Source</label>
        <select value={filters.source} onChange={(e) => handleChange('source', e.target.value)}>
          <option value="all">All Sources</option>
          <option value="bank">Bank Imported</option>
          <option value="manual">Manually Entered</option>
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label>Status</label>
        <select value={filters.status} onChange={(e) => handleChange('status', e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label>Date Range</label>
        <div className={styles.dateInputs}>
          <input type="date" value={filters.startDate} onChange={(e) => handleChange('startDate', e.target.value)} />
          <span>-</span>
          <input type="date" value={filters.endDate} onChange={(e) => handleChange('endDate', e.target.value)} />
        </div>
      </div>

      {activeFilterCount > 0 && (
        <button onClick={handleClear} className={styles.clearButton}>
          <X size={14} /> Clear ({activeFilterCount})
        </button>
      )}
    </div>
  );
};

export default FinancialsFilterBar;
