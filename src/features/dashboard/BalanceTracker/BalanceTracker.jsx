import React, { useMemo } from 'react';
import styles from './BalanceTracker.module.css';
import { usePractices } from '../../../contexts/PracticeContext/PracticeContext';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';
import { usePayments } from '../../../contexts/PaymentContext/PaymentContext';
import { useTransactions } from '../../../contexts/TransactionContext/TransactionContext'; // Import useTransactions
import { useNavigation } from '../../../contexts/NavigationContext/NavigationContext';
import { calculatePracticeBalances } from '../../../utils/balanceCalculations';
import { Link, AlertCircle, Clock, CheckCircle, ArrowRight, TrendingUp, Info } from 'lucide-react';

const formatCurrency = (amount) => {
    // ... (Keep previous version) ...
     const options = { style: 'currency', currency: 'USD' }; if (amount === undefined || amount === null) return '$0'; if (Math.abs(amount - Math.floor(amount)) > 0.001 || amount === 0) { options.minimumFractionDigits = 2; options.maximumFractionDigits = 2; } else { options.minimumFractionDigits = 0; options.maximumFractionDigits = 0; } return new Intl.NumberFormat('en-US', options).format(amount);
};

const formatDate = (date) => {
    // ... (Keep previous version) ...
    if (!date) return null; return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

// Extracted component for rendering a single balance item
const BalanceItem = ({ item, getStatusInfo }) => {
    const { icon, text, className } = getStatusInfo(item);
    const showBalanceAmount = item.balance > 0.01 && item.status !== 'W2 Discrepancy';
    const showW2Info = item.status === 'W2 Discrepancy' && item.balance > 0.01;
    const showCurrentEstimate = item.estimatedCurrentPeriodPay > 0.01;

    return (
        <div key={item.practiceId} className={`${styles.balanceItem} ${item.isOverdue && item.status !== 'W2 Discrepancy' ? styles.overdueItem : ''}`}> {/* Only apply red border if truly Overdue status */}
            <div className={styles.practiceInfo}>
                <span className={styles.practiceName}>{item.practiceName}</span>
                <span className={`${styles.statusTag} ${className}`}>
                     <span className={styles.statusIcon}>{icon}</span>
                     {text}
                </span>
            </div>
            <div className={styles.amountInfo}>
                {showBalanceAmount && (
                    <span className={styles.amountOwed} title="Total outstanding balance">
                        {formatCurrency(item.balance)}
                    </span>
                )}
                 {showW2Info && (
                     <span className={styles.w2Info} title="Estimated balance before potential tax deductions">
                        (~{formatCurrency(item.balance)} Pre-Tax)
                     </span>
                 )}
                {showCurrentEstimate && (
                     <span className={styles.currentEstimate} title={`Est. pay for current period (${formatDate(item.currentPeriod?.start)} - ${formatDate(item.currentPeriod?.end)})`}>
                        +{formatCurrency(item.estimatedCurrentPeriodPay)} This Period
                     </span>
                )}
            </div>
        </div>
    );
};


const BalanceTracker = () => {
    const { practices } = usePractices();
    const { entries } = useEntries();
    const { payments } = usePayments(); // Keep generic payments for now
    const { cheques, directDeposits, eTransfers } = useTransactions(); // Get detailed transactions
    const { setActivePage } = useNavigation();

    // Pass detailed transactions to the calculation function
    const allBalances = useMemo(() => {
        console.log("[BalanceTracker] Recalculating balances...");
        return calculatePracticeBalances(
            practices,
            entries,
            payments, // Pass generic payments (might be unused in calc now)
            cheques,
            directDeposits,
            eTransfers
        );
    }, [practices, entries, payments, cheques, directDeposits, eTransfers]);

    // Split balances into owed and W2 discrepancies
    const owedBalances = useMemo(() => allBalances.filter(b => b.status !== 'W2 Discrepancy'), [allBalances]);
    const w2Discrepancies = useMemo(() => allBalances.filter(b => b.status === 'W2 Discrepancy'), [allBalances]);

    // Total owed remains based on non-W2 balances
    const totalOwed = useMemo(() => {
        return owedBalances.reduce((sum, item) => {
            if (['Overdue', 'Due Soon', 'Owed'].includes(item.status)) {
               return sum + item.balance;
           }
           return sum;
        }, 0);
    }, [owedBalances]);

     const getStatusInfo = (item) => {
        // Status text generation remains the same
        switch (item.status) {
            case 'Overdue': return { icon: <AlertCircle size={14} />, text: `Overdue (Since ${formatDate(item.displayDueDate)})`, className: styles.overdue };
            case 'Due Soon': return { icon: <Clock size={14} />, text: `Due ${formatDate(item.displayDueDate)}`, className: styles.pending };
            case 'Owed': return { icon: <AlertCircle size={14} />, text: 'Balance Owed', className: styles.overdue };
            case 'W2 Discrepancy':
                 const prefix = item.isOverdue ? 'Payment Late / ' : ''; // Indicate if timing is also off
                 // Don't show due date for W2 discrepancy status text itself
                return { icon: <Info size={14} />, text: `${prefix}W2 Discrepancy`, className: styles.pending };
            case 'Paid Up': return { icon: <CheckCircle size={14} />, text: 'Paid Up', className: styles.paid };
            default: return { icon: <Clock size={14} />, text: 'Pending', className: styles.pending };
        }
    };


    return (
        // *** MODIFIED Structure ***
        <div className={`${styles.card} ${allBalances.length === 0 ? styles.isEmpty : ''}`}>
            {/* --- Owed Section --- */}
            <div className={styles.heroSection}>
                <h4 className={styles.title}>Total Balance Owed</h4>
                <p className={styles.totalAmount}>{formatCurrency(totalOwed)}</p>
            </div>

            {owedBalances.length > 0 && (
                <div className={styles.balanceList}>
                    {owedBalances.slice(0, 3).map(item => (
                        <BalanceItem key={item.practiceId} item={item} getStatusInfo={getStatusInfo} />
                    ))}
                </div>
            )}

             {/* --- W2 Discrepancy Section (Optional) --- */}
            {w2Discrepancies.length > 0 && (
                <div className={styles.w2Section}> {/* Add a new CSS class for this section */}
                    <h5 className={styles.w2Title}>Potential W2 Discrepancies</h5> {/* Add a title */}
                    <div className={styles.balanceList}>
                         {w2Discrepancies.slice(0, 2).map(item => ( // Show maybe fewer W2 items
                            <BalanceItem key={item.practiceId} item={item} getStatusInfo={getStatusInfo} />
                         ))}
                    </div>
                </div>
            )}


            {/* --- Footer / Empty State --- */}
            {allBalances.length === 0 ? (
                 <div className={styles.emptyState}>
                     <CheckCircle size={48} />
                     <p>All Caught Up!</p>
                     <span>No outstanding balances or discrepancies detected.</span>
                </div>
            ) : (
                 // Show View All if there are more items than displayed in either section
                 (owedBalances.length > 3 || w2Discrepancies.length > 2) && (
                     <button className={styles.viewAllButton} onClick={() => setActivePage('Payments')}>
                        View All <ArrowRight size={16} />
                     </button>
                 )
            )}
        </div>
    );
};

export default BalanceTracker;