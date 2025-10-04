import React, { useState, useEffect } from 'react';
import styles from './EntryForm.module.css';

const getInitialState = () => ({
    entryType: 'daily-summary',
    date: new Date().toISOString().split('T')[0], // Default to today
    production: 0,
    collection: 0,
    adjustments: { total: 0, items: [] },
    patientId: '',
    notes: '',
});

const EntryForm = ({ entryToEdit, onSave, onCancel }) => {
    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (entryToEdit) {
            setFormData({
                ...getInitialState(),
                ...entryToEdit,
                date: new Date(entryToEdit.date).toISOString().split('T')[0], // Format date for input
            });
        } else {
            setFormData(getInitialState());
        }
    }, [entryToEdit]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };
    
    // A simple handler for the total adjustments for now
    const handleAdjustmentsChange = (e) => {
        const total = parseFloat(e.target.value) || 0;
        setFormData(prev => ({
            ...prev,
            adjustments: { ...prev.adjustments, total }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
                <label>Entry Type</label>
                <select name="entryType" value={formData.entryType} onChange={handleChange}>
                    <option value="daily-summary">Daily Summary</option>
                    <option value="period-summary">Period Summary</option>
                    <option value="procedure">Single Procedure</option>
                </select>
            </div>

            <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label htmlFor="date">Date</label>
                    <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required />
                </div>
                 <div className={styles.formGroup}>
                    <label htmlFor="patientId">Patient ID (Optional)</label>
                    <input type="text" id="patientId" name="patientId" value={formData.patientId} onChange={handleChange} />
                </div>
            </div>
            
             <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label htmlFor="production">Production ($)</label>
                    <input type="number" id="production" name="production" value={formData.production} onChange={handleChange} />
                </div>
                 <div className={styles.formGroup}>
                    <label htmlFor="collection">Collection ($)</label>
                    <input type="number" id="collection" name="collection" value={formData.collection} onChange={handleChange} />
                </div>
                 <div className={styles.formGroup}>
                    <label htmlFor="adjustments">Adjustments ($)</label>
                    <input type="number" id="adjustments" name="adjustments.total" value={formData.adjustments.total} onChange={handleAdjustmentsChange} />
                </div>
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="notes">Notes</label>
                <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows="3"></textarea>
            </div>

            <div className={styles.formActions}>
                <button type="button" onClick={onCancel} className={styles.cancelButton}>Cancel</button>
                <button type="submit" className={styles.saveButton}>{entryToEdit ? 'Save Changes' : 'Add Entry'}</button>
            </div>
        </form>
    );
};

export default EntryForm;
