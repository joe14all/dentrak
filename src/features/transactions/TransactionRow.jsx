import React from 'react';
import styles from './TransactionRow.module.css';
import { Edit, Trash2 } from 'lucide-react';

const TransactionRow = ({ transaction, transactionType, practice, onEdit, onDelete, onView }) => {
  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const renderCells = () => {
    const commonCells = (
      <>
        <td>{practice?.name || 'N/A'}</td>
        <td className={styles.cellAmount}>{formatCurrency(transaction.amount)}</td>
      </>
    );

    switch (transactionType) {
      case 'cheques':
        return (
          <>
            <td>{formatDate(transaction.dateReceived)}</td>
            {commonCells}
            <td>{transaction.chequeNumber}</td>
            <td><span className={`${styles.tag} ${styles[transaction.status]}`}>{transaction.status}</span></td>
          </>
        );
      case 'directDeposits':
        return (
          <>
            <td>{formatDate(transaction.transactionDate)}</td>
            {commonCells}
            <td>{transaction.referenceNumber}</td>
            <td>{transaction.sourceBank}</td>
          </>
        );
      case 'eTransfers':
        return (
          <>
            <td>{formatDate(transaction.transactionDate)}</td>
            {commonCells}
            <td>{transaction.referenceNumber}</td>
            <td>{transaction.senderName}</td>
          </>
        );
      default: return null;
    }
  };

  return (
    <tr className={styles.tableRow} onClick={onView}>
      {renderCells()}
      <td className={styles.cellActions}>
        <div className={styles.actions}>
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }}><Edit size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 size={16} /></button>
        </div>
      </td>
    </tr>
  );
};

export default TransactionRow;
