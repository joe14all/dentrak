import React from 'react';
import TransactionRow from './TransactionRow';
import styles from './TransactionList.module.css';
import { FolderSearch, LoaderCircle } from 'lucide-react';

const TransactionList = ({ transactions, transactionType, practices, isLoading, onEdit, onDelete, onView }) => {

  if (isLoading) {
    return <div className={styles.infoState}><LoaderCircle size={48} className={styles.spinnerIcon} /><h3>Loading...</h3></div>;
  }
  
  // Re-introduce dynamic headers for clarity in each view.
  const headers = {
      all: ['Transaction Details', 'Amount', 'Reference', 'Actions'],
      cheques: ['Cheque Details', 'Amount', 'Cheque #', 'Actions'],
      directDeposits: ['Deposit Details', 'Amount', 'Transaction ID', 'Actions'],
      eTransfers: ['Transfer Details', 'Amount', 'Confirmation #', 'Actions']
  };

  const currentHeaders = headers[transactionType] || headers.all;

  return (
     <div className={styles.listContainer}>
      {(transactions || []).length > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              {currentHeaders.map(h => (
                <th key={h} className={['Amount', 'Reference', 'Actions'].some(label => h.includes(label)) ? styles.thRight : ''}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <TransactionRow 
                key={tx.uniqueId || tx.id} 
                transaction={tx}
                practice={practices.find(p => p.id === tx.practiceId)}
                onEdit={() => onEdit(tx)}
                onDelete={() => onDelete(tx.id, tx.type)}
                onView={() => onView(tx)}
              />
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.infoState}>
          <FolderSearch size={48} />
          <h3 className={styles.infoStateTitle}>No Transactions Found</h3>
          <p>No transactions match the current view.</p>
        </div>
      )}
    </div>
  );
};

export default TransactionList;

