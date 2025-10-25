import React from 'react';
// Reuse TransactionRow as it already handles different types
import TransactionRow from '../transactions/TransactionRow';
// Reuse existing styles
import styles from '../transactions/TransactionList.module.css';
import { FolderSearch, LoaderCircle } from 'lucide-react';

// Renamed props to be more generic (items instead of transactions)
const FinancialsList = ({ items, practices, isLoading, onEdit, onDelete, onView }) => {

  if (isLoading) {
    return (
      <div className={styles.infoState}>
        <LoaderCircle size={48} className={styles.spinnerIcon} />
        <h3>Loading Financial Items...</h3>
      </div>
    );
  }

  // Use generic headers as we show all types here
  const headers = ['Details', 'Amount', 'Reference', 'Actions'];

  return (
     <div className={styles.listContainer}>
      {(items || []).length > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              {headers.map(h => (
                <th key={h} className={['Amount', 'Reference', 'Actions'].includes(h) ? styles.thRight : ''}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Map over the generic 'items' prop */}
            {items.map((item) => (
              <TransactionRow // Reuse TransactionRow
                key={item.uniqueId} // Use the uniqueId created in FinancialsPage
                transaction={item} // Pass the item as the 'transaction' prop expected by TransactionRow
                practice={practices.find(p => p.id === item.practiceId)}
                onEdit={() => onEdit(item)}
                // Pass item id and type to onDelete
                onDelete={() => onDelete(item.id, item.type)}
                onView={() => onView(item)}
              />
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.infoState}>
          <FolderSearch size={48} />
          <h3 className={styles.infoStateTitle}>No Financial Items Found</h3>
          <p>No items match the current filter.</p>
        </div>
      )}
    </div>
  );
};

export default FinancialsList;