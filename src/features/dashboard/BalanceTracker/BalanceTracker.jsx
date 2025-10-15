import React, { useMemo } from 'react';
import styles from './BalanceTracker.module.css';
import { usePractices } from '../../../contexts/PracticeContext/PracticeContext';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';
import { usePayments } from '../../../contexts/PaymentContext/PaymentContext';
import { useNavigation } from '../../../contexts/NavigationContext/NavigationContext';
import { calculatePay } from '../../../utils/calculations';
// Import new icons for status and navigation
import { ExternalLink, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

// A small helper to get the right icon for each status
const getStatusIcon = (status) => {
    switch (status) {
        case 'Overdue':
            return <AlertCircle size={14} className={styles.statusIcon} />;
        case 'Pending':
            return <Clock size={14} className={styles.statusIcon} />;
        default:
            return null;
    }
};

const BalanceTracker = () => {
    const { practices } = usePractices();
    const { entries } = useEntries();
    const { payments } = usePayments();
    const { setActivePage } = useNavigation();

    const employerBalances = useMemo(() => {
        // ... (Calculation logic remains completely unchanged)
        if (!practices || !entries || !payments) return [];

        return practices.map(practice => {
            const allTimeEntries = entries.filter(e => e.practiceId === practice.id);
            const totalPayOwed = calculatePay(practice, allTimeEntries).calculatedPay;
            const practicePayments = payments.filter(p => p.practiceId === practice.id);
            const totalPaid = practicePayments.reduce((sum, p) => sum + p.amount, 0);
            const amountOwed = totalPayOwed - totalPaid;
            const lastPayment = practicePayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0];
            let status = 'Up to Date';
            let daysOverdue = 0;
            if (amountOwed > 1 && lastPayment) {
                const daysSinceLastPay = (new Date() - new Date(lastPayment.paymentDate)) / (1000 * 60 * 60 * 24);
                if (daysSinceLastPay > 45) {
                    status = 'Overdue';
                    daysOverdue = Math.floor(daysSinceLastPay - 30);
                } else if (daysSinceLastPay > 30) {
                    status = 'Pending';
                }
            } else if (amountOwed > 1 && !lastPayment) {
                status = 'Pending';
            }
            return { practice, amountOwed, status, daysOverdue };
        }).filter(item => item.amountOwed > 1);

    }, [practices, entries, payments]);

    const totalOwed = employerBalances.reduce((sum, item) => sum + item.amountOwed, 0);

    return (
        // The main card now has a class to identify if it's empty or not
        <div className={`${styles.card} ${employerBalances.length === 0 ? styles.isEmpty : ''}`}>
            {/* ** REWORK: The total amount is now the primary "hero" element ** */}
            <div className={styles.heroSection}>
                <h4 className={styles.title}>Total Owed to Me</h4>
                <p className={styles.totalAmount}>{formatCurrency(totalOwed)}</p>
            </div>

            <div className={styles.balanceList}>
                {employerBalances.length > 0 ? employerBalances.map(item => (
                    // The item itself gets a class for overdue status to make it stand out
                    <div key={item.practice.id} className={`${styles.balanceItem} ${item.status === 'Overdue' ? styles.overdueItem : ''}`}>
                        <div className={styles.practiceInfo}>
                            <span className={styles.practiceName}>{item.practice.name}</span>
                            <small className={`${styles.statusTag} ${styles[item.status.toLowerCase().replace(' ', '')]}`}>
                                {getStatusIcon(item.status)}
                                {item.status === 'Overdue' ? `${item.daysOverdue} days overdue` : item.status}
                            </small>
                        </div>
                        <span className={styles.amountOwed}>{formatCurrency(item.amountOwed)}</span>
                    </div>
                )) : (
                    // ** REWORK: A more engaging empty state **
                    <div className={styles.emptyState}>
                        <CheckCircle2 size={32} />
                        <p>All caught up!</p>
                        <span>No outstanding balances found.</span>
                    </div>
                )}
            </div>
             
             {/* The button is only shown if there are balances to view */}
             {employerBalances.length > 0 && (
                <button className={styles.viewAllButton} onClick={() => setActivePage('Payments')}>
                    View Payment Details <ExternalLink size={14} />
                </button>
             )}
        </div>
    );
};

export default BalanceTracker;