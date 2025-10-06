import React from 'react';
import styles from './TransactionViewCard.module.css';
import { CreditCard, Landmark, MousePointerClick, Wallet, Edit, File } from 'lucide-react';

// Reusable Segmented Control for status changes
const StatusControl = ({ options, selectedValue, onChange }) => (
  <div className={styles.segmentedControl}>
    {options.map(option => (
      <button
        key={option}
        type="button"
        className={`${styles.segmentButton} ${selectedValue === option ? styles.active : ''}`}
        onClick={() => onChange(option)}
      >
        {option}
      </button>
    ))}
  </div>
);


const TransactionViewCard = ({ transaction, practice, onStatusChange, onEdit }) => {
  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const getMethodIcon = (type) => {
    const props = { size: 20, className: styles.icon };
    switch (type) {
      case 'cheques': return <CreditCard {...props} />;
      case 'eTransfers': return <MousePointerClick {...props} />;
      case 'directDeposits': return <Landmark {...props} />;
      case 'cash': return <Wallet {...props} />;
      default: return null;
    }
  };
  
  const chequeStatusOptions = ['Pending', 'Deposited', 'Cleared', 'Bounced'];
  
  // Correct, robust date extraction logic.
  const date = transaction.type === 'cheques' ? transaction.dateReceived : (transaction.paymentDate || transaction.transactionDate);
  const reference = transaction.chequeNumber || transaction.referenceNumber || transaction.transactionId || transaction.confirmationNumber || '—';

  return (
    <div className={styles.viewCard}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {getMethodIcon(transaction.type)}
          <div className={styles.headerText}>
            <span className={styles.amount}>{formatCurrency(transaction.amount)}</span>
            <span className={styles.method}>{transaction.type.replace(/([A-Z])/g, ' $1')}</span>
          </div>
        </div>
        <div className={styles.headerRight}>
            {transaction.type === 'cheques' && (
                <StatusControl 
                    options={chequeStatusOptions}
                    selectedValue={transaction.status}
                    onChange={onStatusChange}
                />
            )}
            <button onClick={onEdit} className={styles.editButton}>
                <Edit size={16} />
                <span>Edit</span>
            </button>
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <span className={styles.label}>Practice</span>
          <span className={styles.value}>{practice?.name || 'N/A'}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Date</span>
          <span className={styles.value}>{formatDate(date)}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.label}>Reference #</span>
          <span className={styles.value}>{reference}</span>
        </div>
        {transaction.senderEmail && <div className={styles.detailItem}><span className={styles.label}>Sender</span><span className={styles.value}>{transaction.senderEmail}</span></div>}
        {transaction.sourceBank && <div className={styles.detailItem}><span className={styles.label}>Source Bank</span><span className={styles.value}>{transaction.sourceBank}</span></div>}
      </div>
      
      {transaction.image && (
          <div className={styles.attachmentSection}>
              <h4 className={styles.sectionTitle}><File size={16}/> Attached Image</h4>
              <div className={styles.imagePreview}>
                  <iframe src={transaction.image} title="Transaction Attachment" />
              </div>
          </div>
      )}
      
      {transaction.notes && (
        <div className={styles.notesSection}>
          <span className={styles.label}>Notes</span>
          <p className={styles.notes}>{transaction.notes}</p>
        </div>
      )}
    </div>
  );
};

export default TransactionViewCard;

