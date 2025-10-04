import React from 'react';
import EntryCard from './EntryCard';
import styles from './EntriesList.module.css';
import { FolderSearch, LoaderCircle } from 'lucide-react';

const EntriesList = ({ entries, practices, isLoading, viewType, onEditEntry, onDeleteEntry }) => {

  if (isLoading) {
    return (
      <div className={styles.infoState}>
        <LoaderCircle size={48} className={styles.spinnerIcon} />
        <h3 className={styles.infoStateTitle}>Loading Entries...</h3>
      </div>
    );
  }

  const emptyStateTitle = viewType === 'performance' ? 'No Performance Entries Found' : 'No Attendance Records Found';
  const emptyStateText = `There are no ${viewType} entries that match the current filter.`;

  return (
    <div className={styles.listContainer}>
      {entries.length > 0 ? (
        <div className={styles.grid}>
          {entries.map((entry) => (
            <EntryCard 
              key={entry.id} 
              entry={entry}
              practice={practices.find(p => p.id === entry.practiceId)}
              onEdit={() => onEditEntry(entry)}
              onDelete={() => onDeleteEntry(entry.id)}
            />
          ))}
        </div>
      ) : (
        <div className={styles.infoState}>
          <FolderSearch size={48} />
          <h3 className={styles.infoStateTitle}>{emptyStateTitle}</h3>
          <p className={styles.infoStateText}>{emptyStateText}</p>
        </div>
      )}
    </div>
  );
};

export default EntriesList;

