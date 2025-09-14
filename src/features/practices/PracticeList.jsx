import React from 'react';
import PracticeCard from './PracticeCard';
import styles from './PracticeList.module.css';
import { FolderSearch } from 'lucide-react';

const PracticeList = ({ practices, isLoading, onEdit, onDelete }) => {
  if (isLoading) {
    return <div className={styles.loading}>Loading practices...</div>;
  }

  return (
    <div className={styles.practiceListContainer}>
      {practices.length > 0 ? (
        <div className={styles.grid}>
          {practices.map((practice) => (
            <PracticeCard 
              key={practice.id} 
              practice={practice} 
              onEdit={() => onEdit(practice)}
              onDelete={() => onDelete(practice)}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <FolderSearch size={48} />
          </div>
          <h3 className={styles.emptyStateTitle}>No Practices Found</h3>
          <p className={styles.emptyStateText}>
            There are no practices that match the current filter.
          </p>
        </div>
      )}
    </div>
  );
};

export default PracticeList;

