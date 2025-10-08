import React, { useState } from 'react';
import styles from './ReportViewer.module.css';
import PayPeriodStatement from './viewer-components/PayPeriodStatement';
import AnnualSummary from './viewer-components/AnnualSummary';
import PracticeComparison from './viewer-components/PracticeComparison';
import { X, Save, Printer } from 'lucide-react';

const reportComponentMap = {
  payPeriodStatement: PayPeriodStatement,
  annualSummary: AnnualSummary,
  practiceComparison: PracticeComparison,
};

const ReportViewer = ({ reports, onClose, onSaveAll }) => {
  const [activeTab, setActiveTab] = useState(0);

  // THE FIX: This guard clause prevents the component from rendering with invalid data.
  // It checks if 'reports' is a valid, non-empty array before proceeding.
  if (!reports || reports.length === 0) {
    // You can return null for a silent fail, or a loading/error message.
    return <div className={styles.viewer}><p>Loading report data...</p></div>;
  }

  const handlePrint = () => {
    window.print();
  };

  const activeReport = reports[activeTab];
  // Another guard in case the activeTab is out of sync
  if (!activeReport) {
    return <div className={styles.viewer}><p>Error: Report not found.</p></div>;
  }

  const ActiveReportComponent = reportComponentMap[activeReport.type];
  const activeReportData = activeReport.data;

  // Check if any of the open reports are unsaved (don't have an 'id' from the DB)
  const hasUnsavedReports = reports.some(r => !r.id);

  return (
    <div className={styles.viewer}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
            <button onClick={onClose} className={styles.toolButton}><X size={18}/> Close</button>
            {reports.length > 1 && (
                <div className={styles.tabSwitcher}>
                    {reports.map((report, index) => (
                        <button 
                            key={report.name || index} 
                            className={`${styles.tabButton} ${activeTab === index ? styles.active : ''}`}
                            onClick={() => setActiveTab(index)}
                        >
                            {report.data?.practiceName || report.name.substring(0, 20)}
                        </button>
                    ))}
                </div>
            )}
        </div>
        <div className={styles.actions}>
          <button onClick={handlePrint} className={styles.toolButton}><Printer size={18}/> Print</button>
          {hasUnsavedReports && <button onClick={onSaveAll} className={`${styles.toolButton} ${styles.saveButton}`}><Save size={18}/> Save Report(s)</button>}
        </div>
      </div>
      <div className={styles.reportContent} id="printable-report">
        {ActiveReportComponent ? <ActiveReportComponent data={activeReportData} /> : <p>Unsupported report type.</p>}
      </div>
    </div>
  );
};

export default ReportViewer;

