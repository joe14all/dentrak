import React, { useState } from 'react';
import { CheckCircle, XCircle, Edit2, Trash2, AlertTriangle, Loader } from 'lucide-react';
import Modal from '../../components/common/Modal/Modal';
import styles from './ImportConfirmationModal.module.css';

const ImportConfirmationModal = ({ entries, practiceName, onConfirm, onCancel, isImporting, importProgress }) => {
  const [editableEntries, setEditableEntries] = useState(entries);
  const [selectedForRemoval, setSelectedForRemoval] = useState(new Set());

  const handleToggleRemoval = (index) => {
    const newSet = new Set(selectedForRemoval);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedForRemoval(newSet);
  };

  const handleFieldEdit = (index, field, value) => {
    const updated = [...editableEntries];
    if (field === 'production' || field === 'collection') {
      updated[index][field] = parseFloat(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setEditableEntries(updated);
  };

  const handleConfirm = () => {
    // Filter out entries marked for removal
    const finalEntries = editableEntries.filter((_, idx) => !selectedForRemoval.has(idx));
    onConfirm(finalEntries);
  };

  // Calculate progress percentage
  const progressPercentage = importProgress 
    ? Math.round((importProgress.current / importProgress.total) * 100)
    : 0;

  const totalProduction = editableEntries
    .filter((_, idx) => !selectedForRemoval.has(idx))
    .reduce((sum, entry) => sum + (entry.production || 0), 0);

  const totalCollection = editableEntries
    .filter((_, idx) => !selectedForRemoval.has(idx))
    .reduce((sum, entry) => sum + (entry.collection || 0), 0);

  const entriesCount = editableEntries.length - selectedForRemoval.size;

  return (
    <Modal 
      isOpen={true} 
      onClose={onCancel}
      size="large"
    >
      <div className={styles.confirmationContainer}>
        <div className={styles.header}>
          <AlertTriangle size={28} className={styles.warningIcon} />
          <div>
            <h2>Confirm Import</h2>
            <p className={styles.subtitle}>
              Review and edit entries before importing to <strong>{practiceName}</strong>
            </p>
          </div>
        </div>

        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Entries:</span>
            <span className={styles.summaryValue}>{entriesCount}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Production:</span>
            <span className={styles.summaryValue}>
              ${totalProduction.toFixed(2)}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Collection:</span>
            <span className={styles.summaryValue}>
              ${totalCollection.toFixed(2)}
            </span>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.entriesTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Procedures</th>
                <th>Production</th>
                <th>Collection</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {editableEntries.map((entry, idx) => {
                const isMarkedForRemoval = selectedForRemoval.has(idx);
                return (
                  <tr 
                    key={idx} 
                    className={isMarkedForRemoval ? styles.markedForRemoval : ''}
                  >
                    <td>
                      <input
                        type="date"
                        value={entry.date}
                        onChange={(e) => handleFieldEdit(idx, 'date', e.target.value)}
                        className={styles.dateInput}
                        disabled={isMarkedForRemoval}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={entry.patientId}
                        onChange={(e) => handleFieldEdit(idx, 'patientId', e.target.value)}
                        className={styles.textInput}
                        disabled={isMarkedForRemoval}
                      />
                    </td>
                    <td className={styles.procedureCell}>
                      <div className={styles.procedureCodes} title={entry.procedureCode}>
                        {entry.procedureCode}
                      </div>
                      <div className={styles.procedureCount}>
                        {entry.procedureCount} procedure(s)
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={entry.production}
                        onChange={(e) => handleFieldEdit(idx, 'production', e.target.value)}
                        className={styles.numberInput}
                        disabled={isMarkedForRemoval}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={entry.collection}
                        onChange={(e) => handleFieldEdit(idx, 'collection', e.target.value)}
                        className={styles.numberInput}
                        disabled={isMarkedForRemoval}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleRemoval(idx)}
                        className={
                          isMarkedForRemoval 
                            ? styles.restoreButton 
                            : styles.removeButton
                        }
                        title={isMarkedForRemoval ? 'Restore' : 'Remove'}
                      >
                        {isMarkedForRemoval ? (
                          <CheckCircle size={18} />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {isImporting && (
          <div className={styles.importingOverlay}>
            <div className={styles.progressContainer}>
              <Loader size={32} className={styles.spinner} />
              <div className={styles.progressText}>
                <strong>Importing Entries...</strong>
                <p>{importProgress?.current || 0} of {importProgress?.total || 0} entries imported</p>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className={styles.progressPercentage}>{progressPercentage}%</div>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={isImporting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={styles.confirmButton}
            disabled={entriesCount === 0 || isImporting}
          >
            {isImporting ? (
              <>
                <Loader size={18} className={styles.buttonSpinner} />
                Importing...
              </>
            ) : (
              `Import ${entriesCount} ${entriesCount === 1 ? 'Entry' : 'Entries'}`
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportConfirmationModal;
