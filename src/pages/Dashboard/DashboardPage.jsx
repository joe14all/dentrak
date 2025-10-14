import React, { useMemo, useState } from 'react';
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

// Import Modals and Forms for Quick Actions
import Modal from '../../components/common/Modal/Modal';
import EntryForm from '../../features/entries/form-components/EntryForm';
import PaymentForm from '../../features/payments/form-components/PaymentForm';
import PdfSummaryGenerator from '../../features/dashboard/PdfSummaryGenerator/PdfSummaryGenerator';

const DashboardPage = () => {
  const { practices } = usePractices();
  const { entries, addNewEntry } = useEntries();
  const { payments, addNewPayment } = usePayments();
  const { setActivePage } = useNavigation();
  
  // State management for all modals on the dashboard
  const [isEntryModalOpen, setEntryModalOpen] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isPdfModalOpen, setPdfModalOpen] = useState(false);
  
  // Centralized data calculation for YTD analytics
  const dashboardData = useMemo(() => {
    if (!practices || !entries || !payments) {
      return { ytdProduction: 0, ytdPayments: 0 };
    }
    const currentYear = new Date().getFullYear();
    
    const ytdProduction = entries
      .filter(e => {
        const dateStr = e.date || e.periodStartDate;
        if (!dateStr || e.entryType === 'attendanceRecord') return false;
        return new Date(`${dateStr}T00:00:00Z`).getUTCFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + (e.production || 0), 0);
      
    const ytdPayments = payments
      .filter(p => {
        if (!p.paymentDate) return false;
        return new Date(`${p.paymentDate}T00:00:00Z`).getUTCFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + p.amount, 0);

    return { ytdProduction, ytdPayments };
  }, [practices, entries, payments]);

  // --- Event Handlers ---
  const handleAddAttendance = () => {
      setActivePage('Entries');
  };

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
        <div className={styles.header}>
            <h2 className={styles.pageTitle}>Dashboard</h2>
        </div>
        <div className={styles.dashboardGrid}>
            <div className={styles.mainColumn}>
                <QuickActions 
                    onAddAttendance={handleAddAttendance}
                    onAddEntry={() => setEntryModalOpen(true)}
                    onAddPayment={() => setPaymentModalOpen(true)}
                    onCreatePdf={() => setPdfModalOpen(true)}
                />
                <SummaryInsights />
                <CoreOverview />
            </div>
            <div className={styles.sidebarColumn}>
                <YtdAnalytics 
                    ytdProduction={dashboardData.ytdProduction} 
                    ytdPayments={dashboardData.ytdPayments} 
                />
                <BalanceTracker />
            </div>
        </div>

        {/* --- Modals for Quick Actions --- */}
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

