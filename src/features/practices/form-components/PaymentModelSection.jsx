import React, { useState } from 'react';
import styles from './PaymentModelSection.module.css';
import { PlusCircle, Trash2 } from 'lucide-react';

// Reusable Segmented Control
const SegmentedControl = ({ name, options, selectedValue, onChange }) => (
  <div className={styles.segmentedControl}>
    {options.map(option => (
      <button
        key={option.value}
        type="button"
        className={`${styles.segmentButton} ${selectedValue === option.value ? styles.active : ''}`}
        onClick={() => onChange({ target: { name, value: option.value } })}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const PaymentModelSection = ({ formData, handleChange, setBonusTiers }) => {
  // Local state to manage the simple vs. tiered UI
  const [bonusType, setBonusType] = useState(
    formData.bonusTiers && formData.bonusTiers.length > 0 ? 'tiered' : 'simple'
  );

  const calculationBaseOptions = [
      { label: 'Production', value: 'production' },
      { label: 'Collection', value: 'collection' }
  ];
  
  const bonusTypeOptions = [
      { label: 'Simple %', value: 'simple' },
      { label: 'Tiered Bonus', value: 'tiered' }
  ];

  const handleBonusChange = (index, field, value) => {
    const newBonusTiers = [...formData.bonusTiers];
    newBonusTiers[index][field] = parseFloat(value) || 0;
    setBonusTiers(newBonusTiers);
  };

  const addBonusTier = () => {
    const newTier = { threshold: 3000, percentage: 25 };
    setBonusTiers([...(formData.bonusTiers || []), newTier]);
  };

  const removeBonusTier = (index) => {
    const newBonusTiers = formData.bonusTiers.filter((_, i) => i !== index);
    setBonusTiers(newBonusTiers);
  };

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Compensation Structure</legend>

      {/* --- Base Compensation Section --- */}
      <div className={styles.subSection}>
        <h4 className={styles.subSectionTitle}>Base Compensation</h4>
        <div className={styles.formGroup}>
          <label htmlFor="basePay">Daily Rate / Guarantee ($)</label>
          <p className={styles.explanationText}>
            Enter a flat daily rate for employment, or a minimum guarantee for percentage-based roles. Use 0 if not applicable.
          </p>
          <input type="number" id="basePay" name="basePay" value={formData.basePay} onChange={handleChange} />
        </div>
      </div>

      {/* --- Production-Based Pay Section --- */}
      <div className={styles.subSection}>
         <h4 className={styles.subSectionTitle}>Production-Based Pay</h4>
         <p className={styles.explanationText}>
            Define compensation based on a percentage of production or collection. This can be a simple flat rate or a complex tiered structure.
         </p>
         <div className={styles.formRow}>
            <div className={styles.formGroup}>
                <label>Calculation Base</label>
                <SegmentedControl
                    name="calculationBase"
                    options={calculationBaseOptions}
                    selectedValue={formData.calculationBase}
                    onChange={handleChange}
                />
            </div>
            <div className={styles.formGroup}>
                <label>Bonus Structure</label>
                <SegmentedControl
                    name="bonusType"
                    options={bonusTypeOptions}
                    selectedValue={bonusType}
                    onChange={({target}) => setBonusType(target.value)}
                />
            </div>
         </div>
         
         {bonusType === 'simple' && (
            <div className={styles.formGroup} style={{marginTop: '1rem'}}>
                <label htmlFor="percentage">Simple Percentage Rate (%)</label>
                <input type="number" id="percentage" name="percentage" value={formData.percentage} onChange={handleChange} />
            </div>
         )}
         
         {bonusType === 'tiered' && (
             <div className={styles.dynamicListContainer}>
                {formData.bonusTiers && formData.bonusTiers.map((tier, index) => (
                <div key={index} className={styles.dynamicItem}>
                    <div className={styles.formGroup}>
                    <label>If daily amount exceeds ($)</label>
                    <input type="number" value={tier.threshold} onChange={(e) => handleBonusChange(index, 'threshold', e.target.value)} />
                    </div>
                    <span className={styles.connectorText}>then bonus is</span>
                    <div className={styles.formGroup}>
                    <label>Bonus Rate (%)</label>
                    <input type="number" value={tier.percentage} onChange={(e) => handleBonusChange(index, 'percentage', e.target.value)} />
                    </div>
                    <button type="button" onClick={() => removeBonusTier(index)} className={styles.removeButton} aria-label="Remove Tier"><Trash2 size={16} /></button>
                </div>
                ))}
                <button type="button" onClick={addBonusTier} className={styles.addButton}><PlusCircle size={16} /> Add Bonus Tier</button>
             </div>
         )}
      </div>
    </fieldset>
  );
};

export default PaymentModelSection;

