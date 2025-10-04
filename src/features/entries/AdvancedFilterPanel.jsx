import React, { useState, useEffect } from 'react';
import styles from './AdvancedFilterPanel.module.css';
import { X } from 'lucide-react';

const AdvancedFilterPanel = ({ practices, activeFilters, onApply, onClear }) => {
  const [filters, setFilters] = useState(activeFilters);

  useEffect(() => {
    setFilters(activeFilters);
  }, [activeFilters]);

  const handlePracticeChange = (practiceId) => {
    setFilters(prev => ({ ...prev, practiceId }));
  };

  const handleTypeChange = (entryType) => {
    const newTypes = new Set(filters.entryTypes);
    if (newTypes.has(entryType)) {
      newTypes.delete(entryType);
    } else {
      newTypes.add(entryType);
    }
    setFilters(prev => ({ ...prev, entryTypes: Array.from(newTypes) }));
  };

  const handleDateChange = (field, value) => {
    setFilters(prev => ({...prev, [field]: value}));
  }

  const handleApply = () => {
    onApply(filters);
  };
  
  const entryTypeOptions = [
      { label: 'Daily Summary', value: 'dailySummary'},
      { label: 'Period Summary', value: 'periodSummary'},
      { label: 'Procedure', value: 'individualProcedure'},
  ];

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h4 className={styles.title}>Filter Entries</h4>
        <button onClick={onClear} className={styles.clearButton}>Clear All</button>
      </div>
      
      <div className={styles.content}>
        <div className={styles.section}>
          <label className={styles.sectionLabel}>By Practice</label>
          <select value={filters.practiceId} onChange={e => handlePracticeChange(e.target.value)}>
            <option value="all">All Practices</option>
            {practices.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className={styles.section}>
          <label className={styles.sectionLabel}>By Entry Type</label>
          <div className={styles.checkboxGroup}>
            {entryTypeOptions.map(opt => (
                <label key={opt.value}>
                    <input 
                        type="checkbox" 
                        checked={filters.entryTypes.includes(opt.value)}
                        onChange={() => handleTypeChange(opt.value)}
                    />
                    {opt.label}
                </label>
            ))}
          </div>
        </div>
        
        <div className={styles.section}>
          <label className={styles.sectionLabel}>By Date Range</label>
          <div className={styles.dateRow}>
            <input type="date" value={filters.startDate} onChange={e => handleDateChange('startDate', e.target.value)} />
            <span>to</span>
            <input type="date" value={filters.endDate} onChange={e => handleDateChange('endDate', e.target.value)} />
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button onClick={handleApply} className={styles.applyButton}>Apply Filters</button>
      </div>
    </div>
  );
};

export default AdvancedFilterPanel;
