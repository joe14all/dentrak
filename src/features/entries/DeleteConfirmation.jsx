import React from 'react';
import styles from './DeleteConfirmation.module.css';
import { AlertTriangle } from 'lucide-react';

const DeleteConfirmation = ({ onConfirm, onCancel }) => {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <AlertTriangle size={48} className={styles.alertIcon} />
      </div>
      <h3 className={styles.title}>Are you sure?</h3>
      <p className={styles.message}>
        This action cannot be undone. This will permanently delete the entry.
      </p>
      <div className={styles.actions}>
        <button onClick={onCancel} className={styles.cancelButton}>
          Cancel
        </button>
        <button onClick={onConfirm} className={styles.confirmButton}>
          Yes, delete it
        </button>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
