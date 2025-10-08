import React, { useState } from 'react';
import styles from './SaveReportModal.module.css';

const SaveReportModal = ({ defaultName, onSave, onCancel }) => {
  const [reportName, setReportName] = useState(defaultName || '');

  const handleSave = () => {
    if (reportName.trim()) {
      onSave(reportName);
    } else {
      alert("Please enter a name for the report.");
    }
  };

  return (
    <div className={styles.container}>
      <p className={styles.message}>Please provide a name for this report. You can edit it later.</p>
      <div className={styles.formGroup}>
        <label htmlFor="reportName">Report Name</label>
        <input
          type="text"
          id="reportName"
          value={reportName}
          onChange={(e) => setReportName(e.target.value)}
          placeholder="e.g., Q4 Production Summary"
        />
      </div>
      <div className={styles.actions}>
        <button onClick={onCancel} className={styles.cancelButton}>Cancel</button>
        <button onClick={handleSave} className={styles.saveButton}>Save Report</button>
      </div>
    </div>
  );
};

export default SaveReportModal;
