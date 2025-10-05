import React from 'react';
import styles from './TransactionsToolbar.module.css';
import { PlusCircle } from 'lucide-react';

const TransactionsToolbar = ({ views, activeView, setActiveView, onAddTransaction }) => {
  return (
    <div className={styles.header}>
      <div className={styles.leftSection}>
        <h2 className={styles.title}>Transactions</h2>
        <div className={styles.tabContainer}>
          {views.map(view => (
            <button
              key={view.id}
              className={`${styles.tabButton} ${activeView === view.id ? styles.active : ''}`}
              onClick={() => setActiveView(view.id)}
            >
              <view.icon size={16} />
              <span>{view.label}</span>
            </button>
          ))}
        </div>
      </div>
      <button className={styles.addButton} onClick={onAddTransaction}>
        <PlusCircle size={16} />
        <span>Log Transaction</span>
      </button>
    </div>
  );
};

export default TransactionsToolbar;
