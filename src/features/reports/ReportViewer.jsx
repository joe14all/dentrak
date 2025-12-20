import React, { useState } from 'react';
import styles from './ReportViewer.module.css';
import PayPeriodStatement from './viewer-components/PayPeriodStatement';
import AnnualSummary from './viewer-components/AnnualSummary';
import PracticeComparison from './viewer-components/PracticeComparison';
import YtdIncomeReport from './viewer-components/YtdIncomeReport';
import TaxSummary from './viewer-components/TaxSummary';
import { X, Save, Download, LoaderCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const reportComponentMap = {
  payPeriodStatement: PayPeriodStatement,
  annualSummary: AnnualSummary,
  practiceComparison: PracticeComparison,
  ytdIncome: YtdIncomeReport,
  taxSummary: TaxSummary,
};

const ReportViewer = ({ reports, onClose, onSaveAll }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!reports || reports.length === 0) {
    return <div className={styles.viewer}><p>Loading report data...</p></div>;
  }

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    const reportElement = document.getElementById('printable-report');
    
    const { jsPDF } = window.jspdf;
    const html2canvas = window.html2canvas;

    if (reportElement && jsPDF && html2canvas) {
      // Add a class to apply print-specific scaling
      reportElement.classList.add(styles.printing);
      
      try {
        const canvas = await html2canvas(reportElement, { 
            scale: 2, // Higher scale for better quality
            useCORS: true,
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        // A4 dimensions in pixels at 96 DPI (approx)
        const pdfWidth = 794; 
        const pdfHeight = 1123;
        
        const canvasAspectRatio = canvas.width / canvas.height;
        
        let finalCanvasWidth = pdfWidth;
        let finalCanvasHeight = pdfWidth / canvasAspectRatio;

        // If the scaled height is still too large, fit to height instead
        if (finalCanvasHeight > pdfHeight) {
            finalCanvasHeight = pdfHeight;
            finalCanvasWidth = pdfHeight * canvasAspectRatio;
        }

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: 'a4'
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, finalCanvasWidth, finalCanvasHeight);
        pdf.save(`${reports[activeTab].name.replace(/\s/g, '_')}.pdf`);

      } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Sorry, there was an error generating the PDF.");
      } finally {
        // Always remove the printing class
        reportElement.classList.remove(styles.printing);
      }
    }
    setIsGeneratingPdf(false);
  };

  const activeReport = reports[activeTab];
  if (!activeReport) {
    return <div className={styles.viewer}><p>Error: Report not found.</p></div>;
  }

  const ActiveReportComponent = reportComponentMap[activeReport.type];
  const activeReportData = activeReport.data;
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
          <button onClick={handleGeneratePdf} className={styles.toolButton} disabled={isGeneratingPdf}>
            {isGeneratingPdf ? <LoaderCircle size={18} className={styles.spinner}/> : <Download size={18}/>}
            {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
          </button>
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

