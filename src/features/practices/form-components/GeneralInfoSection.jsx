import React from 'react';
import styles from './GeneralInfoSection.module.css';

// Custom Segmented Control Component for reusability and clean code
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

const GeneralInfoSection = ({ formData, handleChange }) => {
  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Archived', value: 'archived' },
  ];

  const taxStatusOptions = [
    { label: 'Contractor (1099)', value: 'contractor' },
    { label: 'Employee (W-2)', value: 'employee' },
  ];

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>General Information</legend>
      
      <div className={styles.formGroup}>
        <label htmlFor="name">Practice Name</label>
        <input 
          type="text" 
          id="name" 
          name="name" 
          value={formData.name} 
          onChange={handleChange}
          placeholder="e.g., Smile Bright Dental"
          required 
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Status</label>
          <SegmentedControl
            name="status"
            options={statusOptions}
            selectedValue={formData.status}
            onChange={handleChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Tax Status</label>
           <SegmentedControl
            name="taxStatus"
            options={taxStatusOptions}
            selectedValue={formData.taxStatus}
            onChange={handleChange}
          />
        </div>
      </div>
      
      <div className={styles.addressGrid}>
        <div className={`${styles.formGroup} ${styles.address}`}>
          <label htmlFor="address">Address</label>
          <input type="text" id="address" name="address" value={formData.address || ''} onChange={handleChange} placeholder="123 Main St" />
        </div>
        <div className={`${styles.formGroup} ${styles.city}`}>
          <label htmlFor="city">City</label>
          <input type="text" id="city" name="city" value={formData.city || ''} onChange={handleChange} placeholder="Metropolis" />
        </div>
        <div className={`${styles.formGroup} ${styles.province}`}>
          <label htmlFor="provinceState">Province / State</label>
          <input type="text" id="provinceState" name="provinceState" value={formData.provinceState || ''} onChange={handleChange} placeholder="CA" />
        </div>
      </div>
    </fieldset>
  );
};

export default GeneralInfoSection;

