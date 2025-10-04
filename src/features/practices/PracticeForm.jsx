import React, { useState, useEffect } from 'react';
import styles from './PracticeForm.module.css';
import GeneralInfoSection from './form-components/GeneralInfoSection';
import PaymentModelSection from './form-components/PaymentModelSection';
import AdjustmentsSection from './form-components/AdjustmentsSection';
import PayCycleSection from './form-components/PayCycleSection';

// A more robust initial state that reflects the full data model
const getInitialState = () => ({
  name: '',
  status: 'active',
  address: '',
  city: '',
  provinceState: '',
  taxStatus: 'contractor',
  paymentType: 'percentage',
  calculationBase: 'production',
  percentage: 40,
  dailyGuarantee: 0,
  basePay: 700,
  bonusTiers: [],
  deductions: [],
  holdback: {
    enabled: false,
    percentage: 5,
    notes: '',
  },
  payCycle: 'monthly',
  paymentDetail: '',
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
        holdback: {
          ...getInitialState().holdback,
          enabled: !!practiceToEdit.holdback,
          ...(practiceToEdit.holdback || {})
        },
        deductions: practiceToEdit.deductions ? [...practiceToEdit.deductions] : [],
        bonusTiers: practiceToEdit.bonusTiers ? [...practiceToEdit.bonusTiers] : []
      });
    } else {
      setFormData(getInitialState());
    }
  }, [practiceToEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      // Handle nested state for holdback
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
  
  const setDynamicListData = (field, data) => {
    setFormData(prev => ({...prev, [field]: data }));
  }


  const handleSubmit = (e) => {
    e.preventDefault();
    // Before saving, remove the 'enabled' flag from holdback if it's not active
    const dataToSave = { ...formData };
    if (dataToSave.holdback && !dataToSave.holdback.enabled) {
        delete dataToSave.holdback;
    }
    onSave(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <GeneralInfoSection formData={formData} handleChange={handleChange} />
      <PaymentModelSection 
        formData={formData} 
        handleChange={handleChange} 
        setBonusTiers={(data) => setDynamicListData('bonusTiers', data)}
      />
      <AdjustmentsSection 
        formData={formData} 
        handleChange={handleChange}
        setDeductions={(data) => setDynamicListData('deductions', data)}
      />
      <PayCycleSection formData={formData} handleChange={handleChange} />

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

