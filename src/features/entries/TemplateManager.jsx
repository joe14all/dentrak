import React, { useState } from 'react';
import { useEntryTemplates } from '../../contexts/EntryTemplateContext/EntryTemplateContext';
import { usePractices } from '../../contexts/PracticeContext/PracticeContext';
import styles from './TemplateManager.module.css';
import { PlusCircle, Edit, Trash2, Copy, FileText } from 'lucide-react';

// Helper to format entry type for display
const formatEntryType = (type) => {
  const typeMap = {
    dailySummary: 'Daily Summary',
    periodSummary: 'Period Summary',
    individualProcedure: 'Individual Procedure',
    attendanceRecord: 'Attendance Record',
  };
  return typeMap[type] || type;
};

// Sub-component for the Template Form
const TemplateForm = ({ templateToEdit, onSave, onCancel, practices }) => {
  const [formData, setFormData] = useState(
    templateToEdit || {
      name: '',
      practiceId: practices?.[0]?.id || '',
      entryType: 'dailySummary',
      production: 0,
      collection: 0,
      adjustments: [],
      checkInTime: '',
      checkOutTime: '',
      notes: '',
    }
  );

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let processedValue = value;
    
    if (name === 'practiceId') {
      processedValue = parseInt(value, 10);
    } else if (type === 'number') {
      processedValue = parseFloat(value) || 0;
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleAdjustmentChange = (index, field, value) => {
    const newAdjustments = [...formData.adjustments];
    newAdjustments[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setFormData(prev => ({ ...prev, adjustments: newAdjustments }));
  };

  const addAdjustment = () => {
    setFormData(prev => ({
      ...prev,
      adjustments: [...prev.adjustments, { name: '', amount: 0, type: 'cost' }],
    }));
  };

  const removeAdjustment = (index) => {
    setFormData(prev => ({
      ...prev,
      adjustments: prev.adjustments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const isAttendance = formData.entryType === 'attendanceRecord';
  const showFinancials = !isAttendance;

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formSection}>
        <h4>Template Details</h4>
        
        <div className={styles.formGroup}>
          <label htmlFor="name">Template Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Typical Tuesday at All Care"
            required
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="practiceId">Practice *</label>
            <select
              id="practiceId"
              name="practiceId"
              value={formData.practiceId}
              onChange={handleChange}
              required
            >
              {practices?.map(practice => (
                <option key={practice.id} value={practice.id}>
                  {practice.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="entryType">Entry Type *</label>
            <select
              id="entryType"
              name="entryType"
              value={formData.entryType}
              onChange={handleChange}
              required
            >
              <option value="dailySummary">Daily Summary</option>
              <option value="attendanceRecord">Attendance Record</option>
              <option value="individualProcedure">Individual Procedure</option>
            </select>
          </div>
        </div>
      </div>

      {showFinancials && (
        <div className={styles.formSection}>
          <h4>Financial Defaults</h4>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="production">Production ($)</label>
              <input
                type="number"
                id="production"
                name="production"
                value={formData.production}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="collection">Collection ($)</label>
              <input
                type="number"
                id="collection"
                name="collection"
                value={formData.collection}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className={styles.adjustmentsSection}>
            <div className={styles.adjustmentsHeader}>
              <label>Adjustments</label>
              <button type="button" onClick={addAdjustment} className={styles.addButton}>
                <PlusCircle size={16} /> Add Adjustment
              </button>
            </div>
            
            {formData.adjustments.map((adj, index) => (
              <div key={index} className={styles.adjustmentRow}>
                <input
                  type="text"
                  placeholder="Name (e.g., Lab Fee)"
                  value={adj.name}
                  onChange={(e) => handleAdjustmentChange(index, 'name', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={adj.amount}
                  onChange={(e) => handleAdjustmentChange(index, 'amount', e.target.value)}
                  min="0"
                  step="0.01"
                />
                <select
                  value={adj.type}
                  onChange={(e) => handleAdjustmentChange(index, 'type', e.target.value)}
                >
                  <option value="cost">Cost</option>
                  <option value="write-off">Write-off</option>
                  <option value="other">Other</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeAdjustment(index)}
                  className={styles.removeButton}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAttendance && (
        <div className={styles.formSection}>
          <h4>Attendance Defaults</h4>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="checkInTime">Check-in Time</label>
              <input
                type="time"
                id="checkInTime"
                name="checkInTime"
                value={formData.checkInTime}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="checkOutTime">Check-out Time</label>
              <input
                type="time"
                id="checkOutTime"
                name="checkOutTime"
                value={formData.checkOutTime}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      )}

      <div className={styles.formSection}>
        <div className={styles.formGroup}>
          <label htmlFor="notes">Default Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            placeholder="Optional notes to include with each entry"
          />
        </div>
      </div>

      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} className={styles.cancelButton}>
          Cancel
        </button>
        <button type="submit" className={styles.saveButton}>
          {templateToEdit ? 'Update Template' : 'Create Template'}
        </button>
      </div>
    </form>
  );
};

// Main Template Manager Component
const TemplateManager = () => {
  const { templates, addNewTemplate, updateTemplate, removeTemplate, isLoading } = useEntryTemplates();
  const { practices } = usePractices();
  const [isFormVisible, setFormVisible] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleSave = async (formData) => {
    try {
      if (templateToEdit) {
        await updateTemplate(templateToEdit.id, formData);
      } else {
        await addNewTemplate(formData);
      }
      setFormVisible(false);
      setTemplateToEdit(null);
    } catch {
      alert('Failed to save template. Please try again.');
    }
  };

  const handleEdit = (template) => {
    setTemplateToEdit(template);
    setFormVisible(true);
  };

  const handleDelete = async (templateId) => {
    try {
      await removeTemplate(templateId);
      setDeleteConfirm(null);
    } catch {
      alert('Failed to delete template. Please try again.');
    }
  };

  const handleCancel = () => {
    setFormVisible(false);
    setTemplateToEdit(null);
  };

  const getPracticeName = (practiceId) => {
    const practice = practices?.find(p => p.id === practiceId);
    return practice?.name || 'Unknown Practice';
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading templates...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <FileText size={24} />
          <h2>Entry Templates</h2>
        </div>
        <button
          onClick={() => setFormVisible(!isFormVisible)}
          className={styles.addTemplateButton}
        >
          <PlusCircle size={20} />
          {isFormVisible ? 'Cancel' : 'New Template'}
        </button>
      </div>

      {isFormVisible && (
        <div className={styles.formContainer}>
          <TemplateForm
            templateToEdit={templateToEdit}
            practices={practices}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      )}

      <div className={styles.templateList}>
        {templates.length === 0 ? (
          <div className={styles.emptyState}>
            <Copy size={48} />
            <h3>No Templates Yet</h3>
            <p>Create templates to quickly add recurring entries</p>
          </div>
        ) : (
          templates.map(template => (
            <div key={template.id} className={styles.templateCard}>
              <div className={styles.templateHeader}>
                <h3>{template.name}</h3>
                <div className={styles.actions}>
                  <button
                    onClick={() => handleEdit(template)}
                    className={styles.editButton}
                    title="Edit template"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(template.id)}
                    className={styles.deleteButton}
                    title="Delete template"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className={styles.templateDetails}>
                <div className={styles.detail}>
                  <span className={styles.label}>Practice:</span>
                  <span>{getPracticeName(template.practiceId)}</span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.label}>Type:</span>
                  <span>{formatEntryType(template.entryType)}</span>
                </div>
                
                {template.entryType !== 'attendanceRecord' && (
                  <>
                    {template.production > 0 && (
                      <div className={styles.detail}>
                        <span className={styles.label}>Production:</span>
                        <span>${template.production.toFixed(2)}</span>
                      </div>
                    )}
                    {template.collection > 0 && (
                      <div className={styles.detail}>
                        <span className={styles.label}>Collection:</span>
                        <span>${template.collection.toFixed(2)}</span>
                      </div>
                    )}
                    {template.adjustments?.length > 0 && (
                      <div className={styles.detail}>
                        <span className={styles.label}>Adjustments:</span>
                        <span>{template.adjustments.length} item(s)</span>
                      </div>
                    )}
                  </>
                )}
                
                {template.notes && (
                  <div className={styles.detail}>
                    <span className={styles.label}>Notes:</span>
                    <span className={styles.notePreview}>{template.notes}</span>
                  </div>
                )}
              </div>

              {deleteConfirm === template.id && (
                <div className={styles.deleteConfirm}>
                  <p>Delete this template?</p>
                  <div className={styles.confirmActions}>
                    <button onClick={() => setDeleteConfirm(null)} className={styles.cancelButton}>
                      Cancel
                    </button>
                    <button onClick={() => handleDelete(template.id)} className={styles.confirmButton}>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TemplateManager;
