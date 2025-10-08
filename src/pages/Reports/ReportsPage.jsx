import React, { useState } from 'react';
import { useReports } from '../../contexts/ReportContext/ReportContext';
import ReportBuilder from '../../features/reports/ReportBuilder';
import SavedReportsList from '../../features/reports/SavedReportsList';
import ReportViewer from '../../features/reports/ReportViewer';
import Modal from '../../components/common/Modal/Modal';
import SaveReportModal from '../../features/reports/SaveReportModal';
import DeleteReportConfirmation from '../../features/reports/DeleteReportConfirmation';
import styles from './ReportsPage.module.css';

const ReportsPage = () => {
  const { savedReports, generateReport, saveGeneratedReport, deleteSavedReport } = useReports();
  
  const [activeReports, setActiveReports] = useState([]);
  const [isSaveModalOpen, setSaveModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  const handleGenerateReport = (params) => {
    const reportData = generateReport(params);
    if (reportData && reportData.length > 0) {
      setActiveReports(reportData);
    } else {
      alert("Could not generate a report with the selected parameters.");
    }
  };
  
  const handleSaveConfirmed = async (reportName) => {
    if (reportName && activeReports.length > 0) {
      for (const report of activeReports) {
        const finalName = activeReports.length > 1 ? `${reportName} - ${report.data.practiceName}` : reportName;
        await saveGeneratedReport({ ...report, name: finalName });
      }
    }
    setSaveModalOpen(false);
    setActiveReports([]);
  };

  const handleViewSavedReport = (report) => {
    setActiveReports([report]);
  };
  
  const handleDeleteConfirmed = async () => {
    if (reportToDelete) {
        await deleteSavedReport(reportToDelete);
        setReportToDelete(null);
    }
  };

  const handleCloseViewer = () => {
    setActiveReports([]);
  };

  return (
    <div className={styles.page}>
      {activeReports.length > 0 ? (
        <ReportViewer 
          reports={activeReports}
          onClose={handleCloseViewer}
          onSaveAll={() => setSaveModalOpen(true)}
        />
      ) : (
        <div className={styles.mainContent}>
          <ReportBuilder onGenerate={handleGenerateReport} />
          <SavedReportsList 
            reports={savedReports}
            onView={handleViewSavedReport}
            onDelete={(reportId) => setReportToDelete(reportId)}
          />
        </div>
      )}

      {/* --- Modals --- */}
      <Modal isOpen={isSaveModalOpen} onClose={() => setSaveModalOpen(false)} title="Save Report">
        <SaveReportModal 
          defaultName={activeReports[0]?.name.split(' - ')[0]}
          onSave={handleSaveConfirmed}
          onCancel={() => setSaveModalOpen(false)}
        />
      </Modal>
      
      <Modal isOpen={!!reportToDelete} onClose={() => setReportToDelete(null)} title="Confirm Deletion">
        <DeleteReportConfirmation
            onConfirm={handleDeleteConfirmed}
            onCancel={() => setReportToDelete(null)}
        />
      </Modal>
    </div>
  );
};

export default ReportsPage;

