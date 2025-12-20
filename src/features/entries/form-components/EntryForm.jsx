import React, { useState, useEffect } from 'react';
import styles from './EntryForm.module.css';
import { PlusCircle, Trash2, ChevronDown, Copy } from 'lucide-react';
import { useEntryTemplates } from '../../../contexts/EntryTemplateContext/EntryTemplateContext';

// A more robust initial state that reflects the full data model
const getInitialState = (initialType = 'dailySummary') => ({
    practiceId: '',
    entryType: initialType,
    date: new Date().toISOString().split('T')[0],
    periodStartDate: new Date().toISOString().split('T')[0],
    periodEndDate: new Date().toISOString().split('T')[0],
    production: 0,
    collection: 0,
    adjustments: [], // Now an array of objects
    patientId: '',
    procedureCode: '',
    notes: '',
    checkInTime: '',
    checkOutTime: '',
    attendanceType: 'full-day', // Default to full-day attendance
});

// Reusable Segmented Control
const SegmentedControl = ({ name, options, selectedValue, onChange }) => (
  <div className={styles.segmentedControl}>
    {options.map(option => (
      <button
        key={option.value}
        type="button"
        className={`${selectedValue === option.value ? styles.active : ''}`}
        onClick={() => onChange({ target: { name, value: option.value } })}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const EntryForm = ({ entryToEdit, practices, initialEntryType, onSave, onCancel }) => {
    const { getTemplatesForPractice, createFromTemplate } = useEntryTemplates();
    const [formData, setFormData] = useState(getInitialState(initialEntryType));
    const [availableTemplates, setAvailableTemplates] = useState([]);

    useEffect(() => {
        if (entryToEdit) {
            setFormData({
                ...getInitialState(entryToEdit.entryType),
                ...entryToEdit,
                date: entryToEdit.date ? new Date(entryToEdit.date).toISOString().split('T')[0] : '',
                periodStartDate: entryToEdit.periodStartDate ? new Date(entryToEdit.periodStartDate).toISOString().split('T')[0] : '',
                periodEndDate: entryToEdit.periodEndDate ? new Date(entryToEdit.periodEndDate).toISOString().split('T')[0] : '',
            });
        } else {
            const initialState = getInitialState(initialEntryType);
            if (practices && practices.length > 0) {
                initialState.practiceId = practices[0].id;
            }
            setFormData(initialState);
        }
    }, [entryToEdit, practices, initialEntryType]);

    // Update available templates when practice changes
    useEffect(() => {
        if (formData.practiceId && !entryToEdit) {
            const templates = getTemplatesForPractice(formData.practiceId);
            setAvailableTemplates(templates);
        }
    }, [formData.practiceId, getTemplatesForPractice, entryToEdit]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        
        // THE FIX: Check if the changed field is 'practiceId' and convert its value to a number.
        if (name === 'practiceId') {
            setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
        }
    };

    const handleApplyTemplate = (e) => {
        const templateId = parseInt(e.target.value, 10);
        if (!templateId) return;

        const template = availableTemplates.find(t => t.id === templateId);
        if (!template) return;

        // Create entry from template, preserving the current date
        const templateEntry = createFromTemplate(template, formData.date);
        
        // Merge with existing form data
        setFormData(prev => ({
            ...prev,
            ...templateEntry,
            date: prev.date, // Keep the current date
        }));

        // Reset the select
        e.target.value = '';
    };

    // --- Adjustment Handlers ---
    const handleAdjustmentChange = (index, field, value) => {
        const newAdjustments = [...formData.adjustments];
        newAdjustments[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
        setFormData(prev => ({ ...prev, adjustments: newAdjustments }));
    };

    const addAdjustment = () => {
        const newAdjustment = { name: '', amount: 0, type: 'cost' };
        setFormData(prev => ({ ...prev, adjustments: [...prev.adjustments, newAdjustment] }));
    };

    const removeAdjustment = (index) => {
        const newAdjustments = formData.adjustments.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, adjustments: newAdjustments }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };
    
    const isAttendance = formData.entryType === 'attendanceRecord';

    return (
        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <div className={styles.formContent}>
            <div className={styles.section}>
                <label className={styles.sectionLabel}>Entry Details</label>
                
                {!entryToEdit && availableTemplates.length > 0 && (
                    <div className={styles.templateSelector}>
                        <label htmlFor="template" className={styles.templateLabel}>
                            <Copy size={16} />
                            Quick Fill from Template
                        </label>
                        <select id="template" onChange={handleApplyTemplate} className={styles.templateSelect}>
                            <option value="">Select a template...</option>
                            {availableTemplates.map(template => (
                                <option key={template.id} value={template.id}>
                                    {template.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                
                <div className={styles.formGroup}>
                    <label htmlFor="practiceId">Practice</label>
                    <div className={styles.selectWrapper}>
                        <select id="practiceId" name="practiceId" value={formData.practiceId} onChange={handleChange} required disabled={!!entryToEdit}>
                            <option value="" disabled>Select a practice...</option>
                            {(practices || []).map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                        </select>
                        <ChevronDown size={20} className={styles.selectIcon} />
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label>Entry Type</label>
                    <SegmentedControl
                        name="entryType"
                        selectedValue={formData.entryType}
                        onChange={handleChange}
                        options={[
                            { label: "Daily", value: "dailySummary" },
                            { label: "Period", value: "periodSummary" },
                            { label: "Procedure", value: "individualProcedure" },
                            { label: "Attendance", value: "attendanceRecord" },
                        ]}
                    />
                </div>
            </div>

            <div className={styles.section}>
                <label className={styles.sectionLabel}>Date & Time</label>
                 {formData.entryType === 'periodSummary' ? (
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}><label>Start Date</label><input type="date" name="periodStartDate" value={formData.periodStartDate} onChange={handleChange} /></div>
                        <div className={styles.formGroup}><label>End Date</label><input type="date" name="periodEndDate" value={formData.periodEndDate} onChange={handleChange} /></div>
                    </div>
                 ) : (
                    <>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}><label>Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} required /></div>
                            {isAttendance && <div className={styles.formGroup}><label>Check In</label><input type="time" name="checkInTime" value={formData.checkInTime || ''} onChange={handleChange} /></div>}
                            {isAttendance && <div className={styles.formGroup}><label>Check Out</label><input type="time" name="checkOutTime" value={formData.checkOutTime || ''} onChange={handleChange} /></div>}
                        </div>
                        {isAttendance && (
                            <div className={styles.formGroup}>
                                <label>Attendance Type</label>
                                <SegmentedControl
                                    name="attendanceType"
                                    selectedValue={formData.attendanceType || 'full-day'}
                                    onChange={handleChange}
                                    options={[
                                        { label: "Full Day", value: "full-day" },
                                        { label: "Half Day", value: "half-day" },
                                    ]}
                                />
                            </div>
                        )}
                    </>
                 )}
            </div>

            {!isAttendance && (
              <>
                <div className={styles.section}>
                    <label className={styles.sectionLabel}>Financials</label>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}><label>Production ($)</label><input type="number" step="0.01" name="production" value={formData.production} onChange={handleChange} /></div>
                        <div className={styles.formGroup}><label>Collection ($)</label><input type="number" step="0.01" name="collection" value={formData.collection} onChange={handleChange} /></div>
                    </div>
                    {formData.entryType === 'individualProcedure' && (
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}><label>Patient ID (Optional)</label><input type="text" name="patientId" value={formData.patientId} onChange={handleChange} /></div>
                            <div className={styles.formGroup}><label>Procedure Code (Optional)</label><input type="text" name="procedureCode" value={formData.procedureCode} onChange={handleChange} /></div>
                        </div>
                    )}
                </div>
                <div className={styles.section}>
                    <label className={styles.sectionLabel}>Adjustments</label>
                     <div className={styles.adjustmentsList}>
                        {formData.adjustments.map((adj, index) => (
                            <div key={index} className={styles.dynamicItem}>
                                <input type="text" placeholder="Adjustment name (e.g., Lab Fee)" value={adj.name} onChange={(e) => handleAdjustmentChange(index, 'name', e.target.value)} />
                                <input type="number" step="0.01" value={adj.amount} onChange={(e) => handleAdjustmentChange(index, 'amount', e.target.value)} />
                                <select value={adj.type} onChange={(e) => handleAdjustmentChange(index, 'type', e.target.value)}>
                                    <option value="cost">Cost</option>
                                    <option value="write-off">Write-Off</option>
                                    <option value="other">Other</option>
                                </select>
                                <button type="button" onClick={() => removeAdjustment(index)} className={styles.removeButton}><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addAdjustment} className={styles.addButton}><PlusCircle size={16}/> Add Adjustment</button>
                </div>
              </>
            )}

            <div className={styles.section}>
                <label className={styles.sectionLabel}>Notes</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows="4" placeholder="Add any relevant details..."></textarea>
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="button" onClick={onCancel} className={styles.cancelButton}>Cancel</button>
            <button type="submit" className={styles.saveButton}>{entryToEdit ? 'Save Changes' : 'Add Entry'}</button>
          </div>
        </form>
    );
};

export default EntryForm;

