import React from 'react';
import styles from './DeleteConfirmation.module.css';
import { AlertTriangle } from 'lucide-react';

const DeleteConfirmation = ({ onConfirm, onCancel }) => (
  <div className={styles.container}>
    <div className={styles.iconWrapper}><AlertTriangle size={48} /></div>
    <h3>Are you sure?</h3>
    <p>This will permanently delete the transaction record.</p>
    <div className={styles.actions}>
      <button onClick={onCancel}>Cancel</button>
      <button onClick={onConfirm}>Yes, delete it</button>
    </div>
  </div>
);

export default DeleteConfirmation;
