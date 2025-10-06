import React from 'react';
import styles from './TransactionRow.module.css';
import { useNavigation } from '../../contexts/NavigationContext/NavigationContext';
import { Edit, Trash2, ArrowUpRight, Landmark, MousePointerClick, CreditCard, Wallet } from 'lucide-react';

const TransactionRow = ({ transaction, practice, onEdit, onDelete, onView }) => {
  const { setActivePage } = useNavigation();

  // --- Formatters ---
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Invalid Date';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }
  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const getMethodIcon = (method) => {
    switch (method) {
      case 'cheque': return <CreditCard size={14} />;
      case 'e-transfer': return <MousePointerClick size={14} />;
      case 'directDeposit': return <Landmark size={14} />;
      case 'cash': return <Wallet size={14} />;
      default: return null;
    }
  };

  // --- Robust Dynamic Data Extraction ---
  const { type, amount, status } = transaction;
  
  // This robustly finds the correct date field regardless of type.
  const date = transaction.dateReceived || transaction.paymentDate;

  // This robustly finds the correct reference field.
  const reference = transaction.chequeNumber || transaction.transactionId || transaction.confirmationNumber || transaction.referenceNumber || '—';
  
  // This robustly determines the method for styling and display.
  const method = type.replace(/s$/, ''); // Converts "cheques" to "cheque", etc.
  
  const isLinkable = (type === 'cheques' && transaction.linkedChequeId) ||
                     ((type === 'eTransfers' || type === 'directDeposits') && reference !== '—');

  // --- Click Handlers ---
  const handlePracticeClick = (e) => { e.stopPropagation(); setActivePage('Practices'); };
  const handleTransactionLinkClick = (e) => { e.stopPropagation(); setActivePage('Transactions'); };

  return (
    <tr className={styles.tableRow} onClick={onView}>
      {/* Column 1: Main Info */}
      <td className={styles.cellMain}>
        <div className={styles.mainInfo}>
            <a href="#" onClick={handlePracticeClick} className={styles.practiceLink}>{practice?.name || 'N/A'}</a>
            <div className={styles.subInfo}>
                <span>{formatDate(date)}</span>
                <span className={styles.separator}>•</span>
                <span className={`${styles.tag} ${styles[method]}`}>
                  {getMethodIcon(method)} {method.replace(/([A-Z])/g, ' $1')}
                </span>
                {status && <><span className={styles.separator}>•</span><span className={styles.statusTag}>{status}</span></>}
            </div>
        </div>
      </td>
      {/* Column 2: Amount */}
      <td className={styles.cellAmount}>{formatCurrency(amount)}</td>
      {/* Column 3: Reference */}
      <td className={styles.cellRef}>
        {isLinkable ? (
          <a href="#" onClick={handleTransactionLinkClick} className={styles.refLink}>{reference}<ArrowUpRight size={12} /></a>
        ) : (
          <span>{reference}</span>
        )}
      </td>
      {/* Column 4: Actions */}
      <td className={styles.cellActions}>
        <div className={styles.actions}>
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Edit"><Edit size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete"><Trash2 size={16} /></button>
        </div>
      </td>
    </tr>
  );
};

export default TransactionRow;

