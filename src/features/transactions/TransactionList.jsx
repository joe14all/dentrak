import React from 'react';
import TransactionRow from './TransactionRow';
import styles from './TransactionList.module.css';
import { FolderSearch, LoaderCircle } from 'lucide-react';

const TransactionList = ({ transactions, transactionType, practices, isLoading, onEdit, onDelete, onView }) => {


  if (isLoading) {
    return <div className={styles.infoState}><LoaderCircle size={48} className={styles.spinnerIcon} /><h3>Loading...</h3></div>;
  }
  
  // This is the key fix: Create a new array with only unique entries.
  // We use a Map to efficiently track which IDs we've already added.
  const uniqueTransactions = Array.from(new Map(transactions.map(tx => [tx.id, tx])).values());
  
  const headers = {
      cheques: ['Received', 'Practice', 'Amount', 'Cheque #', 'Status', 'Actions'],
      directDeposits: ['Date', 'Practice', 'Amount', 'Reference #', 'Source Bank', 'Actions'],
      eTransfers: ['Date', 'Practice', 'Amount', 'Reference #', 'Sender', 'Actions']
  };

  return (
     <div className={styles.listContainer}>
      {uniqueTransactions.length > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              {headers[transactionType].map(h => <th key={h} className={h === 'Actions' ? styles.thRight : ''}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {/* Render the de-duplicated array */}
            {uniqueTransactions.map((tx) => (
              <TransactionRow 
                key={tx.id} 
                transaction={tx}
                transactionType={transactionType}
                practice={practices.find(p => p.id === tx.practiceId)}
                onEdit={() => onEdit(tx)}
                onDelete={() => onDelete(tx.id)}
                onView={() => onView(tx)}
              />
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.infoState}>
          <FolderSearch size={48} />
          <h3 className={styles.infoStateTitle}>No Transactions Found</h3>
          <p>No {transactionType.replace(/([A-Z])/g, ' $1')} have been logged yet.</p>
        </div>
      )}
    </div>
  );
};

export default TransactionList;

