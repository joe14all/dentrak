import React from 'react';
import styles from './ConfirmationModal.module.css';
import { AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({ onConfirm, onCancel }) => {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <AlertTriangle size={48} className={styles.alertIcon} />
      </div>
      <h3 className={styles.title}>Are you absolutely sure?</h3>
      <p className={styles.message}>
        This action is irreversible and will permanently delete all your application data, including practices, entries, and all transactions.
      </p>
      <div className={styles.actions}>
        <button onClick={onCancel} className={styles.cancelButton}>
          Cancel
        </button>
        <button onClick={onConfirm} className={styles.confirmButton}>
          Yes, delete all data
        </button>
      </div>
    </div>
  );
};

export default ConfirmationModal;
