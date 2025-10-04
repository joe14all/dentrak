import React from 'react';
import styles from './AdjustmentsSection.module.css';
import { Plus, Trash2 } from 'lucide-react';

const AdjustmentsSection = ({ formData, handleChange, setDeductions }) => {

  const handleDeductionChange = (index, field, value) => {
    const newDeductions = [...formData.deductions];
    const deduction = newDeductions[index];
    
    // Ensure the value is handled as a number where appropriate
    const finalValue = (field === 'value' && value !== '') ? parseFloat(value) : value;
    
    deduction[field] = finalValue;
    setDeductions(newDeductions);
  };

  const addDeduction = () => {
    const newDeduction = { name: '', type: 'percentage', value: 50, timing: 'pre-split' };
    setDeductions([...formData.deductions, newDeduction]);
  };

  const removeDeduction = (index) => {
    const newDeductions = formData.deductions.filter((_, i) => i !== index);
    setDeductions(newDeductions);
  };

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Adjustments & Holdbacks</legend>
      
      {/* --- DEDUCTIONS SUB-SECTION --- */}
      <div className={styles.subSection}>
        <h4 className={styles.subSectionTitle}>Deductions</h4>
        <p className={styles.explanationText}>
          Define rules for deductions from pay, such as lab fees or supplies.
        </p>
        
        <div className={styles.dynamicListContainer}>
          {formData.deductions.map((deduction, index) => (
            <div key={index} className={styles.dynamicItem}>
              <div className={styles.formGroup}>
                  <label>Deduction Name</label>
                  <input type="text" placeholder="e.g., Lab Fees" value={deduction.name} onChange={(e) => handleDeductionChange(index, 'name', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                  <label>Value</label>
                  <input type="number" placeholder="50" value={deduction.value} onChange={(e) => handleDeductionChange(index, 'value', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                  <label>Type</label>
                  <select value={deduction.type} onChange={(e) => handleDeductionChange(index, 'type', e.target.value)}>
                    <option value="percentage">%</option>
                    <option value="flat">$</option>
                  </select>
              </div>
              <div className={styles.formGroup}>
                  <label>Timing</label>
                  <select value={deduction.timing} onChange={(e) => handleDeductionChange(index, 'timing', e.target.value)}>
                    <option value="pre-split">Pre-Split</option>
                    <option value="post-split">Post-Split</option>
                  </select>
              </div>
              <button type="button" onClick={() => removeDeduction(index)} className={styles.removeButton} aria-label="Remove Deduction"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addDeduction} className={styles.addButton}><Plus size={16} /> Add Deduction Rule</button>
      </div>

      {/* --- HOLDBACK SUB-SECTION --- */}
      <div className={styles.subSection}>
        <div className={styles.toggleHeader}>
            <div className={styles.toggleInfo}>
                <h4 className={styles.subSectionTitle}>Holdback</h4>
                <p className={styles.explanationText}>
                Optionally retain a percentage of pay to be released later.
                </p>
            </div>
            {/* Apple-style Toggle Switch */}
            <label className={styles.toggleSwitch}>
              <input type="checkbox" name="holdback.enabled" checked={formData.holdback.enabled} onChange={handleChange} />
              <span className={styles.slider}></span>
            </label>
        </div>
        
        {formData.holdback.enabled && (
          <div className={styles.conditionalFields}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="holdback.percentage">Holdback Rate (%)</label>
                <input type="number" id="holdback.percentage" name="holdback.percentage" value={formData.holdback.percentage} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="holdback.notes">Release Conditions / Notes</label>
                <input type="text" placeholder="e.g., Released quarterly" id="holdback.notes" name="holdback.notes" value={formData.holdback.notes} onChange={handleChange} />
              </div>
            </div>
          </div>
        )}
      </div>
    </fieldset>
  );
};

export default AdjustmentsSection;

