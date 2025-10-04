import React from 'react';
import styles from './PerformanceToolbar.module.css';
import { PlusCircle, ChevronDown } from 'lucide-react';

const PerformanceToolbar = ({ practices, activeFilter, setActiveFilter, onAddEntry }) => {
  return (
    <div className={styles.toolbar}>
      <div className={styles.filterWrapper}>
        <label htmlFor="practiceFilter">Filter by Practice</label>
        <div className={styles.selectWrapper}>
          <select
            id="practiceFilter"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <option value="all">All Practices</option>
            {(practices || []).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown size={20} className={styles.selectIcon} />
        </div>
      </div>
      <button className={styles.addButton} onClick={onAddEntry}>
        <PlusCircle size={16} />
        <span>Add Performance Entry</span>
      </button>
    </div>
  );
};

export default PerformanceToolbar;
