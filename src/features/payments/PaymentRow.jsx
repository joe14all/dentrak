import React from 'react';
import styles from './PaymentRow.module.css';
import { useNavigation } from '../../contexts/NavigationContext/NavigationContext';
import { Edit, Trash2, ArrowUpRight, Landmark, MousePointerClick, CreditCard, Wallet } from 'lucide-react';

const PaymentRow = ({ payment, practice, onEdit, onDelete }) => {
  const { setActivePage } = useNavigation();

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
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
  
  const handlePracticeClick = (e) => {
      e.preventDefault();
      // In the future, we can add context to filter to this specific practice
      setActivePage('Practices');
  };

  const handleTransactionLinkClick = (e) => {
      e.preventDefault();
      // This function would navigate to the Cheques/Transactions page and
      // ideally filter by the payment's reference or linked ID.
      setActivePage('Transactions');
  };

  // A payment is "linkable" if it's a cheque, e-transfer, or direct deposit with a reference.
  const isLinkable = (payment.paymentMethod === 'cheque' && payment.linkedChequeId) ||
                     ((payment.paymentMethod === 'e-transfer' || payment.paymentMethod === 'directDeposit') && payment.referenceNumber);

  return (
    <tr className={styles.tableRow}>
      {/* Main Info Cell */}
      <td className={styles.cellMain}>
        <div className={styles.mainInfo}>
          <a href="#" onClick={handlePracticeClick} className={styles.practiceLink}>
            {practice?.name || 'N/A'}
          </a>
          <div className={styles.subInfo}>
            <span>{formatDate(payment.paymentDate)}</span>
            <span className={styles.separator}>•</span>
            <span className={`${styles.tag} ${styles[payment.paymentMethod]}`}>
              {getMethodIcon(payment.paymentMethod)}
              {payment.paymentMethod.replace(/([A-Z])/g, ' $1')}
            </span>
          </div>
        </div>
      </td>

      {/* Amount Cell */}
      <td className={styles.cellAmount}>{formatCurrency(payment.amount)}</td>

      {/* Reference Cell */}
      <td className={styles.cellRef}>
        {isLinkable ? (
          <a href="#" onClick={handleTransactionLinkClick} className={styles.refLink}>
            {payment.referenceNumber || '—'}
            <ArrowUpRight size={12} />
          </a>
        ) : (
          <span>{payment.referenceNumber || '—'}</span>
        )}
      </td>
      
      {/* Actions Cell */}
      <td className={styles.cellActions}>
        <div className={styles.actions}>
          <button onClick={onEdit} className={styles.actionButton} title="Edit Payment"><Edit size={16} /></button>
          <button onClick={onDelete} className={styles.actionButton} title="Delete Payment"><Trash2 size={16} /></button>
        </div>
      </td>
    </tr>
  );
};

export default PaymentRow;

