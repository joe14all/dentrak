import React, { useState, useEffect } from 'react';
import styles from './PracticeForm.module.css';
import { PlusCircle, Trash2 } from 'lucide-react';

// A more robust initial state that reflects the full data model
const getInitialState = () => ({
  name: '',
  status: 'active',
  taxStatus: 'contractor',
  paymentType: 'percentage',
  calculationBase: 'production',
  percentage: 40,
  dailyGuarantee: 0,
  basePay: 700,
  productionBonus: {
    enabled: false,
    threshold: 2000,
    percentage: 25
  },
  deductions: [],
  payCycle: 'monthly',
  notes: '',
});


const PracticeForm = ({ practiceToEdit, onSave, onCancel }) => {
  const [formData, setFormData] = useState(getInitialState());

  // If we are editing, populate the form with existing data
  useEffect(() => {
    if (practiceToEdit) {
      // Deep copy and provide defaults for any missing nested structures
      setFormData({
        ...getInitialState(),
        ...practiceToEdit,
        productionBonus: {
          ...getInitialState().productionBonus,
          ...(practiceToEdit.productionBonus || {})
        },
        deductions: practiceToEdit.deductions ? [...practiceToEdit.deductions] : []
      });
    } else {
      setFormData(getInitialState());
    }
  }, [practiceToEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      // Handle nested state for productionBonus
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    }
  };
  
  // --- Deduction Handlers ---
  const handleDeductionChange = (index, field, value) => {
    const newDeductions = [...formData.deductions];
    newDeductions[index][field] = field === 'value' ? parseFloat(value) || 0 : value;
    setFormData(prev => ({ ...prev, deductions: newDeductions }));
  };

  const addDeduction = () => {
    const newDeduction = { name: '', type: 'percentage', value: 50, splitType: 'post-split' };
    setFormData(prev => ({ ...prev, deductions: [...prev.deductions, newDeduction] }));
  };

  const removeDeduction = (index) => {
    const newDeductions = formData.deductions.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, deductions: newDeductions }));
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* --- GENERAL SECTION --- */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>General Information</legend>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Practice Name</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Status</label>
            <div className={styles.radioGroup}>
              <label><input type="radio" name="status" value="active" checked={formData.status === 'active'} onChange={handleChange} /> Active</label>
              <label><input type="radio" name="status" value="archived" checked={formData.status === 'archived'} onChange={handleChange} /> Archived</label>
            </div>
          </div>
        </div>
      </fieldset>
      
      {/* --- PAYMENT MODEL SECTION --- */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Payment Model</legend>
        <div className={styles.formGroup}>
            <label>Tax Status</label>
            <div className={styles.radioGroup}>
              <label><input type="radio" name="taxStatus" value="contractor" checked={formData.taxStatus === 'contractor'} onChange={handleChange} /> Contractor (1099)</label>
              <label><input type="radio" name="taxStatus" value="employee" checked={formData.taxStatus === 'employee'} onChange={handleChange} /> Employee (W-2)</label>
            </div>
        </div>
        <div className={styles.formGroup}>
            <label>Payment Type</label>
            <div className={styles.radioGroup}>
              <label><input type="radio" name="paymentType" value="percentage" checked={formData.paymentType === 'percentage'} onChange={handleChange} /> Percentage</label>
              <label><input type="radio" name="paymentType" value="dailyRate" checked={formData.paymentType === 'dailyRate'} onChange={handleChange} /> Daily Rate</label>
            </div>
        </div>
        
        {/* Conditional Fields for Percentage */}
        {formData.paymentType === 'percentage' && (
          <div className={styles.conditionalFields}>
            <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label>Calculation Base</label>
                    <div className={styles.radioGroup}>
                        <label><input type="radio" name="calculationBase" value="production" checked={formData.calculationBase === 'production'} onChange={handleChange} /> Production</label>
                        <label><input type="radio" name="calculationBase" value="collection" checked={formData.calculationBase === 'collection'} onChange={handleChange} /> Collection</label>
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="percentage">Percentage (%)</label>
                    <input type="number" id="percentage" name="percentage" value={formData.percentage} onChange={handleChange} />
                </div>
            </div>
             <div className={styles.formGroup}>
                <label htmlFor="dailyGuarantee">Daily Guarantee ($) (Optional)</label>
                <input type="number" id="dailyGuarantee" name="dailyGuarantee" value={formData.dailyGuarantee} onChange={handleChange} />
            </div>
          </div>
        )}

        {/* Conditional Fields for Daily Rate */}
        {formData.paymentType === 'dailyRate' && (
            <div className={styles.conditionalFields}>
                <div className={styles.formGroup}>
                    <label htmlFor="basePay">Base Pay Per Day ($)</label>
                    <input type="number" id="basePay" name="basePay" value={formData.basePay} onChange={handleChange} />
                </div>
            </div>
        )}
      </fieldset>

      {/* --- DEDUCTIONS SECTION --- */}
       <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Deductions</legend>
        {formData.deductions.map((deduction, index) => (
          <div key={index} className={styles.dynamicItem}>
            <input type="text" placeholder="Deduction Name (e.g., Lab Fees)" value={deduction.name} onChange={(e) => handleDeductionChange(index, 'name', e.target.value)} className={styles.wideInput}/>
            <input type="number" value={deduction.value} onChange={(e) => handleDeductionChange(index, 'value', e.target.value)} />
            <select value={deduction.type} onChange={(e) => handleDeductionChange(index, 'type', e.target.value)}>
              <option value="percentage">%</option>
              <option value="fixed">$</option>
            </select>
            <select value={deduction.splitType} onChange={(e) => handleDeductionChange(index, 'splitType', e.target.value)}>
              <option value="post-split">Post-Split</option>
              <option value="pre-split">Pre-Split</option>
            </select>
            <button type="button" onClick={() => removeDeduction(index)} className={styles.removeButton}><Trash2 size={16} /></button>
          </div>
        ))}
        <button type="button" onClick={addDeduction} className={styles.addButton}><PlusCircle size={16}/> Add Deduction Rule</button>
      </fieldset>

      {/* --- OTHER DETAILS --- */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Other Details</legend>
         <div className={styles.formGroup}>
            <label htmlFor="payCycle">Pay Cycle</label>
            <select id="payCycle" name="payCycle" value={formData.payCycle} onChange={handleChange}>
              <option value="monthly">Monthly</option>
              <option value="bi-weekly">Bi-Weekly</option>
              <option value="weekly">Weekly</option>
            </select>
         </div>
         <div className={styles.formGroup}>
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows="3"></textarea>
         </div>
      </fieldset>

      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} className={styles.cancelButton}>
          Cancel
        </button>
        <button type="submit" className={styles.saveButton}>
          {practiceToEdit ? 'Save Changes' : 'Add Practice'}
        </button>
      </div>
    </form>
  );
};

export default PracticeForm;

