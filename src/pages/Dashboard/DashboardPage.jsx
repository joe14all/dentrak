import React, {useState } from 'react';
import styles from './DashboardPage.module.css';

// Import all necessary contexts
import { usePractices } from '../../contexts/PracticeContext/PracticeContext';
import { useEntries } from '../../contexts/EntryContext/EntryContext';
import { usePayments } from '../../contexts/PaymentContext/PaymentContext';
import { useNavigation } from '../../contexts/NavigationContext/NavigationContext';

// Import all modular dashboard components
import CoreOverview from '../../features/dashboard/CoreOverview/CoreOverview';
import QuickActions from '../../features/dashboard/QuickActions/QuickActions';
import YtdAnalytics from '../../features/dashboard/YtdAnalytics/YtdAnalytics';
import BalanceTracker from '../../features/dashboard/BalanceTracker/BalanceTracker';
import SummaryInsights from '../../features/dashboard/SummaryInsights/SummaryInsights';
import CashFlowForecast from '../../features/dashboard/CashFlowForecast/CashFlowForecast';
import TaxPlanning from '../../features/dashboard/TaxPlanning/TaxPlanning';
import PracticeComparison from '../../features/dashboard/PracticeComparison/PracticeComparison';

// Import Modals and Forms for Quick Actions
import Modal from '../../components/common/Modal/Modal';
import EntryForm from '../../features/entries/form-components/EntryForm';
import PaymentForm from '../../features/payments/form-components/PaymentForm';
import PdfSummaryGenerator from '../../features/dashboard/PdfSummaryGenerator/PdfSummaryGenerator';

const DashboardPage = () => {
  const { practices } = usePractices();
  const { addNewEntry } = useEntries();
  const { addNewPayment } = usePayments();
  const { navigateToPage } = useNavigation();
  
  const [isEntryModalOpen, setEntryModalOpen] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isPdfModalOpen, setPdfModalOpen] = useState(false);
  
  const handleAddAttendance = () => navigateToPage('Entries', { openAttendance: true });
  const handleSaveEntry = (formData) => {
    addNewEntry(formData);
    setEntryModalOpen(false);
  };
  const handleSavePayment = (formData) => {
    addNewPayment(formData);
    setPaymentModalOpen(false);
  };

  return (
    <div className={styles.page}>
        {/* ** REWORK: The grid is now driven by CSS grid-template-areas for a professional layout ** */}
        <div className={styles.dashboardGrid}>
            {/* The order here is semantic, but the visual layout is controlled by CSS */}
            
            {/* Top Row: High-level overview and immediate actions */}
            <div className={styles.overview}>
                <CoreOverview />
            </div>
            <div className={styles.actions}>
                <QuickActions 
                    onAddAttendance={handleAddAttendance}
                    onAddEntry={() => setEntryModalOpen(true)}
                    onAddPayment={() => setPaymentModalOpen(true)}
                    onCreatePdf={() => setPdfModalOpen(true)}
                />
            </div>

            {/* Main Content: The detailed monthly performance analysis */}
            <div className={styles.main}>
                <SummaryInsights />
            </div>

            {/* Sidebar: Supporting contextual modules */}
            <div className={styles.sidebar}>
                <YtdAnalytics />
                <BalanceTracker />
            </div>

            {/* Cash Flow Forecast: Full-width forecast section */}
            <div className={styles.forecast}>
                <CashFlowForecast />
            </div>

            {/* Tax Planning: Full-width tax section */}
            <div className={styles.taxPlanning}>
                <TaxPlanning />
            </div>

            {/* Practice Comparison: Full-width comparison section */}
            <div className={styles.practiceComparison}>
                <PracticeComparison />
            </div>
        </div>

        {/* --- Modals for Quick Actions (Unchanged) --- */}
        <Modal isOpen={isEntryModalOpen} onClose={() => setEntryModalOpen(false)} title="Add New Performance Entry">
          <EntryForm
            practices={practices}
            initialEntryType="dailySummary"
            onSave={handleSaveEntry}
            onCancel={() => setEntryModalOpen(false)}
          />
        </Modal>

        <Modal isOpen={isPaymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Log New Payment">
          <PaymentForm
            practices={practices}
            onSave={handleSavePayment}
            onCancel={() => setPaymentModalOpen(false)}
          />
        </Modal>
        
        <Modal isOpen={isPdfModalOpen} onClose={() => setPdfModalOpen(false)} title="Create PDF Payment Summary">
            <PdfSummaryGenerator onCancel={() => setPdfModalOpen(false)} />
        </Modal>
    </div>
  );
};

export default DashboardPage;