import React from 'react';
import styles from './PracticeFilters.module.css';
import { Briefcase, Percent, Archive } from 'lucide-react';

const PracticeFilters = ({ activeFilter, setActiveFilter }) => {
  const filters = [
    { label: 'Active', value: 'active', icon: null },
    { label: 'Contractor', value: 'contractor', icon: Percent },
    { label: 'Employee', value: 'employee', icon: Briefcase },
    { label: 'Archived', value: 'archived', icon: Archive },
  ];

  return (
    <div className={styles.filterContainer}>
      {filters.map(filter => (
        <button
          key={filter.value}
          className={`${styles.filterButton} ${activeFilter === filter.value ? styles.active : ''}`}
          onClick={() => setActiveFilter(filter.value)}
        >
          {filter.icon && <filter.icon size={14} />}
          <span>{filter.label}</span>
        </button>
      ))}
    </div>
  );
};

export default PracticeFilters;
