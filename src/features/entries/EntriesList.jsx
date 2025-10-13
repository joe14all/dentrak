import React from 'react';
import EntryRow from './EntryRow'; 
import styles from './EntriesList.module.css';
import { FolderSearch, LoaderCircle } from 'lucide-react';

const EntriesList = ({ entries, practices, isLoading,onEditEntry, onDeleteEntry }) => {

  if (isLoading) {
    return (
      <div className={styles.infoState}>
        <LoaderCircle size={48} className={styles.spinnerIcon} />
        <h3 className={styles.infoStateTitle}>Loading Entries...</h3>
      </div>
    );
  }

  const emptyStateTitle = 'No Performance Entries Found';
  const emptyStateText = `There are no performance entries that match the current filter.`;

  return (
    <div className={styles.listContainer}>
      {entries.length > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Practice</th>
              <th>Type</th>
              <th className={styles.thRight}>Production</th>
              <th className={styles.thRight}>Collection</th>
              <th className={styles.thRight}>Adjustments</th>
              <th className={styles.thRight}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <EntryRow 
                key={entry.id} 
                entry={entry}
                practice={practices.find(p => p.id === entry.practiceId)}
                onEdit={() => onEditEntry(entry)}
                onDelete={() => onDeleteEntry(entry.id)}
              />
            ))}
          </tbody>
        </table>
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

