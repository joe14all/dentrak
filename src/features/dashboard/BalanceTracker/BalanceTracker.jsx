import React, { useMemo } from 'react';
import styles from './BalanceTracker.module.css';
import { usePractices } from '../../../contexts/PracticeContext/PracticeContext';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';
import { usePayments } from '../../../contexts/PaymentContext/PaymentContext';
import { useNavigation } from '../../../contexts/NavigationContext/NavigationContext';
import { calculatePay } from '../../../utils/calculations';
import { ExternalLink } from 'lucide-react';

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

const BalanceTracker = () => {
    const { practices } = usePractices();
    const { entries } = useEntries();
    const { payments } = usePayments();
    const { setActivePage } = useNavigation();

    const employerBalances = useMemo(() => {
        if (!practices || !entries || !payments) return [];

        return practices.map(practice => {
            const allTimeEntries = entries.filter(e => e.practiceId === practice.id);
            const totalPayOwed = calculatePay(practice, allTimeEntries).calculatedPay;
            
            const practicePayments = payments.filter(p => p.practiceId === practice.id);
            const totalPaid = practicePayments.reduce((sum, p) => sum + p.amount, 0);
            
            const amountOwed = totalPayOwed - totalPaid;

            // Overdue logic (simplified for demonstration)
            const lastPayment = practicePayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0];
            let status = 'Up to Date';
            let daysOverdue = 0;

            if (amountOwed > 1 && lastPayment) {
                const daysSinceLastPay = (new Date() - new Date(lastPayment.paymentDate)) / (1000 * 60 * 60 * 24);
                // This logic can be refined based on practice.payCycle
                if (daysSinceLastPay > 45) { // Assuming monthly net 15
                    status = 'Overdue';
                    daysOverdue = Math.floor(daysSinceLastPay - 30);
                } else if (daysSinceLastPay > 30) {
                    status = 'Pending';
                }
            } else if (amountOwed > 1 && !lastPayment) {
                status = 'Pending';
            }

            return { practice, amountOwed, status, daysOverdue };
        }).filter(item => item.amountOwed > 1); // Only show practices with a balance

    }, [practices, entries, payments]);

    const totalOwed = employerBalances.reduce((sum, item) => sum + item.amountOwed, 0);

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h3 className={styles.sectionTitle}>Employer Balances Due</h3>
                <span className={styles.totalOwed}>Total Owed to Me: {formatCurrency(totalOwed)}</span>
            </div>
            <div className={styles.balanceList}>
                {employerBalances.length > 0 ? employerBalances.map(item => (
                    <div key={item.practice.id} className={styles.balanceItem}>
                        <div className={styles.practiceInfo}>
                            <span className={styles.practiceName}>{item.practice.name}</span>
                            <small className={`${styles.statusTag} ${styles[item.status.toLowerCase().replace(' ', '')]}`}>
                                {item.status === 'Overdue' ? `${item.daysOverdue} days overdue` : item.status}
                            </small>
                        </div>
                        <span className={styles.amountOwed}>{formatCurrency(item.amountOwed)}</span>
                    </div>
                )) : (
                    <p className={styles.emptyText}>All employer balances are up to date.</p>
                )}
            </div>
             <button className={styles.viewAllButton} onClick={() => setActivePage('Payments')}>
                View All Payments <ExternalLink size={14} />
            </button>
        </div>
    );
};

export default BalanceTracker;
