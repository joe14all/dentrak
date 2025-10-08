import React from 'react';
import styles from './ReportTypeSelector.module.css';

const ReportTypeSelector = ({ selectedType, onChange }) => {
  // All report types are now enabled
  const reportTypes = [
    { label: "Pay Period", value: "payPeriodStatement" },
    { label: "Annual", value: "annualSummary" },
    { label: "Comparison", value: "practiceComparison" },
  ];

  return (
    <div className={styles.formGroup}>
      <label>Report Type</label>
      <div className={styles.segmentedControl}>
        {reportTypes.map(type => (
          <button
            key={type.value}
            type="button"
            className={`${styles.segmentButton} ${selectedType === type.value ? styles.active : ''}`}
            onClick={() => onChange(type.value)}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReportTypeSelector;

