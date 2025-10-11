import React, { useMemo, useState } from 'react';
import styles from './DashboardPage.module.css';

// Import all contexts
import { usePractices } from '../../contexts/PracticeContext/PracticeContext';
import { useEntries } from '../../contexts/EntryContext/EntryContext';
import { usePayments } from '../../contexts/PaymentContext/PaymentContext';
import { useNavigation } from '../../contexts/NavigationContext/NavigationContext';

// Import all new modular components
import CoreOverview from '../../features/dashboard/CoreOverview/CoreOverview';
import QuickActions from '../../features/dashboard/QuickActions/QuickActions';
import YtdAnalytics from '../../features/dashboard/YtdAnalytics/YtdAnalytics';
import BalanceTracker from '../../features/dashboard/BalanceTracker/BalanceTracker';
import SummaryInsights from '../../features/dashboard/SummaryInsights/SummaryInsights';

// Import Modals and Forms for Quick Actions
import Modal from '../../components/common/Modal/Modal';
import EntryForm from '../../features/entries/form-components/EntryForm';
import PaymentForm from '../../features/payments/form-components/PaymentForm';

const DashboardPage = () => {
  const { practices } = usePractices();
  const { entries, addNewEntry } = useEntries();
  const { payments, addNewPayment } = usePayments();
  const { setActivePage } = useNavigation();
  
  const [isEntryModalOpen, setEntryModalOpen] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  
  // This hook now performs all complex calculations for the entire dashboard
  const dashboardData = useMemo(() => {
    if (!practices || !entries || !payments) {
      return { ytdProduction: 0, ytdPayments: 0, chartData: [], bestMonth: null };
    }
    
    const currentYear = new Date().getFullYear();
    let bestMonth = null;

    // --- Timezone-safe YTD calculations ---
    const ytdProduction = entries
      .filter(e => new Date(`${e.date || e.periodStartDate}T00:00:00Z`).getUTCFullYear() === currentYear && e.entryType !== 'attendanceRecord')
      .reduce((sum, e) => sum + (e.production || 0), 0);
      
    const ytdPayments = payments
      .filter(p => new Date(`${p.paymentDate}T00:00:00Z`).getUTCFullYear() === currentYear)
      .reduce((sum, p) => sum + p.amount, 0);

    // --- Timezone-safe chart data and best month calculation ---
    const chartData = Array(12).fill(null).map((_, i) => {
        const monthProduction = entries.filter(e => {
            const date = new Date(`${e.date || e.periodStartDate}T00:00:00Z`);
            return date.getUTCFullYear() === currentYear && date.getUTCMonth() === i && e.entryType !== 'attendanceRecord';
        }).reduce((sum, e) => sum + (e.production || 0), 0);

        const monthPayments = payments.filter(p => {
             const date = new Date(`${p.paymentDate}T00:00:00Z`);
             return date.getUTCFullYear() === currentYear && date.getUTCMonth() === i;
        }).reduce((sum, p) => sum + p.amount, 0);
        
        if (!bestMonth || monthProduction > bestMonth.production) {
            bestMonth = { month: new Date(currentYear, i).toLocaleString('default', { month: 'long'}), production: monthProduction };
        }

        return {
            name: new Date(currentYear, i).toLocaleString('default', { month: 'short'}),
            production: monthProduction,
            payments: monthPayments,
        };
    });

    return { ytdProduction, ytdPayments, chartData, bestMonth };
  }, [practices, entries, payments]);

  const handleAddAttendance = () => { setActivePage('Entries'); };
  const handleSaveEntry = (formData) => { addNewEntry(formData); setEntryModalOpen(false); };
  const handleSavePayment = (formData) => { addNewPayment(formData); setPaymentModalOpen(false); };

  return (
    <div className={styles.page}>
        <div className={styles.dashboardGrid}>
            <div className={styles.mainColumn}>
                <QuickActions 
                    onAddAttendance={handleAddAttendance}
                    onAddEntry={() => setEntryModalOpen(true)}
                    onAddPayment={() => setPaymentModalOpen(true)}
                />
                <SummaryInsights />
                <CoreOverview />
            </div>
            <div className={styles.sidebarColumn}>
                {/* Pass all calculated data down as props */}
                <YtdAnalytics 
                    ytdProduction={dashboardData.ytdProduction} 
                    ytdPayments={dashboardData.ytdPayments} 
                    chartData={dashboardData.chartData}
                    bestMonth={dashboardData.bestMonth}
                />
                <BalanceTracker />
            </div>
        </div>

        {/* --- Modals for Quick Actions --- */}
        <Modal isOpen={isEntryModalOpen} onClose={() => setEntryModalOpen(false)} title="Add New Performance Entry">
          <EntryForm practices={practices} initialEntryType="dailySummary" onSave={handleSaveEntry} onCancel={() => setEntryModalOpen(false)} />
        </Modal>
        <Modal isOpen={isPaymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Log New Payment">
          <PaymentForm practices={practices} onSave={handleSavePayment} onCancel={() => setPaymentModalOpen(false)} />
        </Modal>
    </div>
  );
};

export default DashboardPage;

