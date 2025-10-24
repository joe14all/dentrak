import React from 'react';
import styles from './BlockConflictModal.module.css';
import { AlertTriangle, Trash2, X } from 'lucide-react';

const BlockConflictModal = ({ conflicts, onConfirmRemoveAttendance, onCancel }) => {
  if (!conflicts || conflicts.length === 0) {
    return null;
  }

  // Helper to format date nicely
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  };


  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <AlertTriangle size={48} className={styles.alertIcon} />
      </div>
      <h3 className={styles.title}>Block Conflicts Detected</h3>
      <p className={styles.message}>
        You are trying to block {conflicts.length === 1 ? 'a day' : 'days'} that already has attendance recorded. Blocking these days will remove the existing attendance entries.
      </p>

      {/* List conflicts (optional, good for multiple conflicts) */}
      <div className={styles.conflictList}>
        <h4>Conflicting Dates:</h4>
        <ul>
          {conflicts.slice(0, 5).map(conflict => ( // Show first 5 conflicts
            <li key={conflict.date}>
              {formatDate(conflict.date)} ({conflict.practiceName})
            </li>
          ))}
          {conflicts.length > 5 && <li>...and {conflicts.length - 5} more</li>}
        </ul>
      </div>


      <div className={styles.actions}>
        <button onClick={onCancel} className={styles.cancelButton}>
          <X size={16}/> Cancel Block
        </button>
        <button onClick={onConfirmRemoveAttendance} className={styles.confirmButton}>
          <Trash2 size={16}/> Block Day(s) & Remove Attendance
        </button>
      </div>
    </div>
  );
};

export default BlockConflictModal;