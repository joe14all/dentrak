import React from 'react';
import styles from './DeleteReportConfirmation.module.css';
import { AlertTriangle } from 'lucide-react';

const DeleteReportConfirmation = ({ onConfirm, onCancel }) => (
  <div className={styles.container}>
    <div className={styles.iconWrapper}><AlertTriangle size={48} className={styles.alertIcon} /></div>
    <h3 className={styles.title}>Delete Report?</h3>
    <p className={styles.message}>This will permanently delete the saved report. This action cannot be undone.</p>
    <div className={styles.actions}>
      <button onClick={onCancel} className={styles.cancelButton}>Cancel</button>
      <button onClick={onConfirm} className={styles.confirmButton}>Yes, Delete</button>
    </div>
  </div>
);

export default DeleteReportConfirmation;
