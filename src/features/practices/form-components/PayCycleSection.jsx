import React from 'react';
import styles from './PayCycleSection.module.css';
import { ChevronDown } from 'lucide-react';

const PayCycleSection = ({ formData, handleChange }) => {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Pay Cycle & Notes</legend>
      
      <div className={styles.subSection}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="payCycle">Payment Frequency</label>
            <div className={styles.selectWrapper}>
              <select id="payCycle" name="payCycle" value={formData.payCycle} onChange={handleChange}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
              <ChevronDown size={20} className={styles.selectIcon} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="paymentDetail">Payment Details</label>
            <input 
              type="text" 
              placeholder="e.g., Every second Friday" 
              id="paymentDetail" 
              name="paymentDetail" 
              value={formData.paymentDetail} 
              onChange={handleChange} 
            />
          </div>
        </div>
         <p className={styles.explanationText}>
            Specify the regular pay schedule and provide details, such as "15th of the following month."
          </p>
      </div>

      <div className={styles.subSection}>
         <div className={styles.formGroup}>
            <label htmlFor="notes">General Notes</label>
             <p className={styles.explanationText}>
                Add any other important, non-financial details about this practice.
            </p>
            <textarea 
              id="notes" 
              name="notes" 
              value={formData.notes} 
              onChange={handleChange} 
              rows="4"
              placeholder="e.g., High-volume clinic, focus on cosmetic work..."
            ></textarea>
         </div>
      </div>
    </fieldset>
  );
};

export default PayCycleSection;

