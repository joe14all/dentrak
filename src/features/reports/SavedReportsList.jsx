import React from 'react';
import styles from './SavedReportsList.module.css';
import { Archive, Trash2, Eye } from 'lucide-react';

const SavedReportsList = ({ reports, onView, onDelete }) => {
  return (
    <div className={styles.listContainer}>
      <h3 className={styles.title}><Archive size={20}/> Saved Reports</h3>
      <div className={styles.list}>
        {reports.length > 0 ? reports.map(report => (
          <div key={report.id} className={styles.reportItem}>
            <div className={styles.reportInfo}>
              <span className={styles.reportName}>{report.name}</span>
              <span className={styles.reportDate}>Generated on {new Date(report.createdAt).toLocaleDateString()}</span>
            </div>
            <div className={styles.actions}>
              <button onClick={() => onView(report)}><Eye size={16}/> View</button>
              <button onClick={() => onDelete(report.id)} className={styles.deleteButton}><Trash2 size={16}/> Delete</button>
            </div>
          </div>
        )) : <p className={styles.emptyText}>No reports saved yet.</p>}
      </div>
    </div>
  );
};

export default SavedReportsList;
