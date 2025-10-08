import React, { useState } from 'react';
import styles from './ReportBuilder.module.css';
import { usePractices } from '../../contexts/PracticeContext/PracticeContext';
import ReportTypeSelector from './builder-components/ReportTypeSelector';
import PracticeSelector from './builder-components/PracticeSelector';
import DateRangeSelector from './builder-components/DateRangeSelector';
import { FileText } from 'lucide-react';

const ReportBuilder = ({ onGenerate }) => {
  const { practices } = usePractices();
  
  // State for the entire report configuration
  const [config, setConfig] = useState({
    reportType: 'payPeriodStatement',
    selectedPractices: [],
    startDate: '',
    endDate: '',
  });

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = (e) => {
      e.preventDefault();
      if (!config.startDate || !config.endDate || config.selectedPractices.length === 0) {
          alert("Please select a report type, at least one practice, and a date range.");
          return;
      }
      onGenerate({
          type: config.reportType,
          practiceIds: config.selectedPractices,
          startDate: config.startDate,
          endDate: config.endDate
      });
  };

  return (
    <div className={styles.builder}>
      <h3 className={styles.title}><FileText size={20}/> Report Generator</h3>
      <form onSubmit={handleSubmit} className={styles.form}>
        <ReportTypeSelector 
          selectedType={config.reportType}
          onChange={(value) => handleConfigChange('reportType', value)}
        />
        <PracticeSelector 
          practices={practices || []}
          selectedPractices={config.selectedPractices}
          onChange={(value) => handleConfigChange('selectedPractices', value)}
        />
        <DateRangeSelector 
          startDate={config.startDate}
          endDate={config.endDate}
          onStartDateChange={(value) => handleConfigChange('startDate', value)}
          onEndDateChange={(value) => handleConfigChange('endDate', value)}
        />
        <button type="submit" className={styles.generateButton}>Generate Report</button>
      </form>
    </div>
  );
};

export default ReportBuilder;

