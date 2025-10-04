import React from 'react';
import styles from './DeleteConfirmation.module.css';
import { AlertTriangle } from 'lucide-react';

const DeleteConfirmation = ({ onConfirm, onCancel }) => (
  <div className={styles.container}>
    <div className={styles.iconWrapper}><AlertTriangle size={48} className={styles.alertIcon} /></div>
    <h3 className={styles.title}>Are you sure?</h3>
    <p className={styles.message}>This will permanently delete the payment record.</p>
    <div className={styles.actions}>
      <button onClick={onCancel} className={styles.cancelButton}>Cancel</button>
      <button onClick={onConfirm} className={styles.confirmButton}>Yes, delete payment</button>
    </div>
  </div>
);

export default DeleteConfirmation;
