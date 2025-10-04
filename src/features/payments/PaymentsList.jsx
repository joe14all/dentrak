import React from 'react';
import PaymentRow from './PaymentRow';
import styles from './PaymentsList.module.css';
import { FolderSearch, LoaderCircle } from 'lucide-react';

const PaymentsList = ({ payments, practices, isLoading, onEditPayment, onDeletePayment }) => {
  if (isLoading) {
    return (
      <div className={styles.infoState}>
        <LoaderCircle size={48} className={styles.spinnerIcon} />
        <h3 className={styles.infoStateTitle}>Loading Payments...</h3>
      </div>
    );
  }

  return (
    <div className={styles.listContainer}>
      {payments.length > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Practice</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Reference #</th>
              <th className={styles.thRight}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <PaymentRow 
                key={payment.id} 
                payment={payment}
                practice={practices.find(p => p.id === payment.practiceId)}
                onEdit={() => onEditPayment(payment)}
                onDelete={() => onDeletePayment(payment.id)}
              />
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.infoState}>
          <FolderSearch size={48} />
          <h3 className={styles.infoStateTitle}>No Payments Found</h3>
          <p className={styles.infoStateText}>No payments match the current filter. Log a payment to get started!</p>
        </div>
      )}
    </div>
  );
};

export default PaymentsList;
