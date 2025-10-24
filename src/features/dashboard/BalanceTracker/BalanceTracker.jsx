// src/features/dashboard/BalanceTracker/BalanceTracker.jsx
import React, { useMemo ,useCallback} from 'react';
import styles from './BalanceTracker.module.css';
import { usePractices } from '../../../contexts/PracticeContext/PracticeContext';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';
import { usePayments } from '../../../contexts/PaymentContext/PaymentContext';
import { useTransactions } from '../../../contexts/TransactionContext/TransactionContext';
import { useNavigation } from '../../../contexts/NavigationContext/NavigationContext';
import { calculatePracticeBalances } from '../../../utils/balanceCalculations';
import { Link, AlertCircle, Clock, CheckCircle, ArrowRight, Info, TrendingUp, CircleDollarSign } from 'lucide-react'; // Added CircleDollarSign

// --- Helper Functions ---

// Preserves original formatting logic
const formatCurrency = (amount) => {
    const options = { style: 'currency', currency: 'USD' };
    if (amount === undefined || amount === null) return '$0';
    if (Math.abs(amount - Math.floor(amount)) > 0.001 || amount === 0) {
        options.minimumFractionDigits = 2;
        options.maximumFractionDigits = 2;
    } else {
        options.minimumFractionDigits = 0;
        options.maximumFractionDigits = 0;
    }
    return new Intl.NumberFormat('en-US', options).format(amount);
};

// Preserves original formatting logic
const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

// --- Child Component: BalanceItem ---
// Renders individual practice balance details with status badges and refined layout.
const BalanceItem = ({ item, getStatusInfo, calculatePendingPayments }) => {
    const { icon: statusIcon, text: statusText, className: statusClassName } = getStatusInfo(item);
    const pendingAmount = calculatePendingPayments(item.practiceId);

    // Determine the primary amount display based on status
    let primaryAmountDisplay = formatCurrency(item.balance);
    let amountClassName = styles.amountPrimary;
    if (item.status === 'W2 Discrepancy') {
        primaryAmountDisplay = `~${formatCurrency(item.balance)} Pre-Tax`;
        amountClassName += ` ${styles.w2Amount}`; // Add specific style for W2
    } else if (item.status === 'Paid Up') {
        primaryAmountDisplay = formatCurrency(0); // Show $0 clearly when paid up
    }

    // Only show if > $0.01 to avoid clutter
    const showCurrentEstimate = item.estimatedCurrentPeriodPay > 0.01;
    const showPendingPayment = pendingAmount > 0.01;

    // Define border class based on status for visual emphasis
    let itemBorderClass = '';
    if (item.isOverdue) itemBorderClass = styles.isOverdue;
    else if (item.status === 'W2 Discrepancy') itemBorderClass = styles.isW2;
    else if (showPendingPayment && item.status !== 'Paid Up') itemBorderClass = styles.isPendingClearance; // New state
    else if (item.status === 'Due Soon') itemBorderClass = styles.isDueSoon;

    return (
        <div key={item.practiceId} className={`${styles.balanceItem} ${itemBorderClass}`}>
            {/* Left Column: Practice Name and Status Badge */}
            <div className={styles.practiceInfo}>
                <span className={styles.practiceName}>{item.practiceName}</span>
                {item.status !== 'Paid Up' && ( // Don't show badge if Paid Up
                    <span className={`${styles.statusTag} ${statusClassName}`}>
                        <span className={styles.statusIcon}>{statusIcon}</span>
                        {statusText}
                    </span>
                 )}
            </div>
            {/* Right Column: Amounts and Secondary Info */}
            <div className={styles.amountInfo}>
                 {item.status !== 'Paid Up' && (
                     <span className={amountClassName} title={`Balance: ${formatCurrency(item.balance)}`}>
                         {primaryAmountDisplay}
                     </span>
                 )}
                 {/* Secondary info grouped together */}
                 <div className={styles.amountSecondaryGroup}>
                     {showPendingPayment && (
                         <span className={`${styles.amountSecondary} ${styles.pendingPaymentBadge}`} title={`Pending: ${formatCurrency(pendingAmount)}`}>
                             <CircleDollarSign /> {formatCurrency(pendingAmount)}
                         </span>
                     )}
                     {showCurrentEstimate && (
                        <span className={`${styles.amountSecondary} ${styles.currentEstimate}`} title={`Current Period Estimate: ${formatCurrency(item.estimatedCurrentPeriodPay)}`}>
                            <TrendingUp /> {formatCurrency(item.estimatedCurrentPeriodPay)}
                        </span>
                     )}
                 </div>
            </div>
        </div>
    );
};


// --- Main Component: BalanceTracker ---
const BalanceTracker = () => {
    // Hooks (Unchanged)
    const { practices } = usePractices();
    const { entries } = useEntries();
    const { payments } = usePayments();
    const { cheques, directDeposits, eTransfers } = useTransactions();
    const { setActivePage } = useNavigation();

    // Balance Calculation Logic (Unchanged)
    const allBalances = useMemo(() => {
        return calculatePracticeBalances(
            practices, entries, payments, cheques, directDeposits, eTransfers
        );
    }, [practices, entries, payments, cheques, directDeposits, eTransfers]);

    // Calculate Total Owed (Unchanged)
    const totalOwed = useMemo(() => {
        return allBalances.reduce((sum, item) => {
           // Only sum balances that are explicitly 'Overdue', 'Due Soon', or 'Owed'
           // Excludes 'W2 Discrepancy' from the primary total.
           if (['Overdue', 'Due Soon', 'Owed'].includes(item.status)) {
               return sum + item.balance;
           }
           return sum;
        }, 0);
    }, [allBalances]);

    // **NEW**: Calculate Total Pending Payments (Uncleared Cheques/Pending Transfers)
    const totalPending = useMemo(() => {
        let pending = 0;
        cheques.forEach(c => { if (c.status === 'Pending' || c.status === 'Deposited') pending += c.amount; });
        eTransfers.forEach(t => { if (t.status === 'Pending') pending += t.amount; });
        return pending;
    }, [cheques, eTransfers]);

    // **NEW**: Helper to calculate pending payments for a specific practice
    const calculatePendingPayments = useCallback((practiceId) => {
        let pending = 0;
        cheques.forEach(c => { if (c.practiceId === practiceId && (c.status === 'Pending' || c.status === 'Deposited')) pending += c.amount; });
        eTransfers.forEach(t => { if (t.practiceId === practiceId && t.status === 'Pending') pending += t.amount; });
        return pending;
    }, [cheques, eTransfers]);

    // **REFINED**: getStatusInfo - returns icon, concise text, and style class for badges
    const getStatusInfo = (item) => {
        switch (item.status) {
            case 'Overdue': return { icon: <AlertCircle size={12} />, text: `Overdue ${formatDate(item.displayDueDate)}`, className: styles.statusOverdue };
            case 'Due Soon': return { icon: <Clock size={12} />, text: `Due ${formatDate(item.displayDueDate)}`, className: styles.statusDueSoon };
            case 'Owed': return { icon: <AlertCircle size={12} />, text: 'Owed', className: styles.statusOverdue }; // Reuse Overdue style for general 'Owed'
            case 'W2 Discrepancy':
                 { const prefix = item.isOverdue ? 'Late / ' : '';
                return { icon: <Info size={12} />, text: `${prefix}W2 Discrepancy`, className: styles.statusW2 }; }
             // No 'Paid Up' case needed here as we hide the badge
            default: // Fallback/Pending
                // Check if there are pending payments specifically
                { const pendingAmount = calculatePendingPayments(item.practiceId);
                if (pendingAmount > 0.01) {
                    return { icon: <CircleDollarSign size={12} />, text: 'Pending Clearance', className: styles.statusPendingClearance};
                }
                // Default if no specific status matches but balance > 0
                return { icon: <AlertCircle size={12} />, text: 'Balance Owed', className: styles.statusOverdue }; }
        }
    };


    return (
        // Added isEmpty class for conditional styling
        <div className={`${styles.card} ${allBalances.length === 0 ? styles.isEmpty : ''}`}>
            {/* --- Hero Section --- */}
            <div className={styles.heroSection}>
                <h4 className={styles.title}>Outstanding Balances</h4>
                <p className={styles.totalAmount}>{formatCurrency(totalOwed)}</p>
                {totalPending > 0.01 && ( // Show pending total if relevant
                    <span className={styles.totalSubtext}>
                         (+{formatCurrency(totalPending)} pending clearance)
                    </span>
                 )}
            </div>

            {/* --- Balance List --- */}
            {allBalances.length > 0 && (
                <div className={styles.balanceList}>
                    {/* Display all items, rely on CSS for scrolling if needed */}
                    {allBalances.map(item => (
                        <BalanceItem
                            key={item.practiceId}
                            item={item}
                            getStatusInfo={getStatusInfo}
                            calculatePendingPayments={calculatePendingPayments}
                        />
                    ))}
                </div>
            )}

            {/* --- Empty State --- */}
            {allBalances.length === 0 && (
                 <div className={styles.emptyState}>
                     <CheckCircle size={36} className={styles.emptyIcon} />
                     <p>All Caught Up</p>
                     <span>No outstanding balances found.</span>
                </div>
            )}

             {/* --- Footer / View All Button --- */}
             {allBalances.length > 0 && (
                 <button className={styles.viewAllButton} onClick={() => setActivePage('Payments')}>
                    View All Payment Details <ArrowRight size={14} />
                 </button>
             )}
        </div>
    );
};

export default BalanceTracker;