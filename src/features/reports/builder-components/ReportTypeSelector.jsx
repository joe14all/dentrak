import React from 'react';
import styles from './ReportTypeSelector.module.css';

const ReportTypeSelector = ({ selectedType, onChange }) => {
  const reportTypes = [
    { label: "Pay Period Statement", value: "payPeriodStatement", description: "Detailed earnings for a specific period" },
    { label: "Annual Summary", value: "annualSummary", description: "Full year financial overview" },
    { label: "Practice Comparison", value: "practiceComparison", description: "Compare multiple practices" },
    { label: "YTD Income Report", value: "ytdIncome", description: "Year-to-date income tracking" },
    { label: "Tax Summary", value: "taxSummary", description: "Quarterly breakdown for tax filing" },
  ];

  return (
    <div className={styles.formGroup}>
      <label>Report Type</label>
      <div className={styles.reportGrid}>
        {reportTypes.map(type => (
          <button
            key={type.value}
            type="button"
            className={`${styles.reportCard} ${selectedType === type.value ? styles.active : ''}`}
            onClick={() => onChange(type.value)}
          >
            <span className={styles.reportLabel}>{type.label}</span>
            <span className={styles.reportDescription}>{type.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReportTypeSelector;

