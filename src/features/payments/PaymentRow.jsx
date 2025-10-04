import React from 'react';
import styles from './PaymentRow.module.css';
import { useNavigation } from '../../contexts/NavigationContext/NavigationContext';
import { Edit, Trash2, ChevronsRight, Landmark, MousePointerClick, CreditCard, Wallet } from 'lucide-react';

const PaymentRow = ({ payment, practice, onEdit, onDelete }) => {
  const { setActivePage } = useNavigation(); // Use the navigation context

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const isRecent = () => {
    const paymentDate = new Date(payment.paymentDate);
    const aWeekAgo = new Date();
    aWeekAgo.setDate(aWeekAgo.getDate() - 7);
    return paymentDate > aWeekAgo;
  };

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
      // In the future, you could also set a filter for this practice
      setActivePage('Practices');
  };

  const handleChequeClick = (e) => {
      e.preventDefault();
      // In the future, you could set a filter for this specific cheque ID
      setActivePage('Cheques');
  };

  return (
    <tr className={styles.tableRow}>
      <td className={styles.cellDate}>
        {isRecent() && <span className={styles.recentIndicator} title="Received in the last 7 days"></span>}
        {formatDate(payment.paymentDate)}
      </td>
      <td>
        <a href="#" onClick={handlePracticeClick} className={styles.practiceLink}>
            {practice?.name || 'N/A'}
        </a>
      </td>
      <td className={styles.cellAmount}>{formatCurrency(payment.amount)}</td>
      <td>
        <span className={`${styles.tag} ${styles[payment.paymentMethod]}`}>
          {getMethodIcon(payment.paymentMethod)}
          {payment.paymentMethod.replace(/([A-Z])/g, ' $1')}
        </span>
      </td>
      <td className={styles.cellRef}>{payment.referenceNumber || '—'}</td>
      <td className={styles.cellActions}>
        <div className={styles.actions}>
          <button onClick={onEdit} className={styles.actionButton} title="Edit Payment"><Edit size={16} /></button>
          <button onClick={onDelete} className={styles.actionButton} title="Delete Payment"><Trash2 size={16} /></button>
          {payment.linkedChequeId && (
            <button onClick={handleChequeClick} className={`${styles.actionButton} ${styles.linkButton}`} title="View Cheque Details">
                <ChevronsRight size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default PaymentRow;

