import React from 'react';
import styles from './PerformanceToolbar.module.css';
import { X, PlusCircle } from 'lucide-react';

const PerformanceToolbar = ({ practices, activeFilters, onFilterChange, onAddEntry }) => {

  const handleFilterChange = (field, value) => {
    onFilterChange(prev => ({ ...prev, [field]: value }));
  };
  
  const handleTypeChange = (entryType) => {
    const newTypes = new Set(activeFilters.entryTypes);
    if (newTypes.has(entryType)) {
      newTypes.delete(entryType);
    } else {
      newTypes.add(entryType);
    }
    onFilterChange(prev => ({ ...prev, entryTypes: Array.from(newTypes) }));
  };
  
  const handleClear = () => {
    onFilterChange({
      practiceId: 'all',
      entryTypes: [],
      startDate: '',
      endDate: ''
    });
  }

  const entryTypeOptions = [
      { label: 'Daily', value: 'dailySummary'},
      { label: 'Period', value: 'periodSummary'},
      { label: 'Procedure', value: 'individualProcedure'},
  ];
  
  const activeFilterCount = 
    (activeFilters.practiceId !== 'all' ? 1 : 0) +
    activeFilters.entryTypes.length +
    (activeFilters.startDate ? 1 : 0) +
    (activeFilters.endDate ? 1 : 0);

  return (
    <div className={styles.toolbar}>
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Practice</label>
          <select value={activeFilters.practiceId} onChange={e => handleFilterChange('practiceId', e.target.value)}>
            <option value="all">All Practices</option>
            {(practices || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label>Entry Type</label>
          <div className={styles.checkboxGroup}>
            {entryTypeOptions.map(opt => (
                <label key={opt.value} className={activeFilters.entryTypes.includes(opt.value) ? styles.active : ''}>
                    <input 
                        type="checkbox" 
                        checked={activeFilters.entryTypes.includes(opt.value)}
                        onChange={() => handleTypeChange(opt.value)}
                    />
                    {opt.label}
                </label>
            ))}
          </div>
        </div>
        
        <div className={styles.filterGroup}>
          <label>Date Range</label>
          <div className={styles.dateInputs}>
            <input type="date" value={activeFilters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} />
            <span>-</span>
            <input type="date" value={activeFilters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} />
          </div>
        </div>
        
        {activeFilterCount > 0 && (
          <button onClick={handleClear} className={styles.clearButton}>
            <X size={14} /> Clear ({activeFilterCount})
          </button>
        )}
      </div>
      <button className={styles.addButton} onClick={onAddEntry}>
        <PlusCircle size={16} />
        <span>Add Entry</span>
      </button>
    </div>
  );
};

export default PerformanceToolbar;

