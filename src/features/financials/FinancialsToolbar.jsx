import React from 'react';
// Reuse existing styles for consistency
import styles from '../transactions/TransactionsToolbar.module.css';
import { PlusCircle, Sparkles } from 'lucide-react';

const FinancialsToolbar = ({ views, activeView, setActiveView, onAddTransaction, onOpenImporter }) => {
  return (
    <div className={styles.header}>
      <div className={styles.leftSection}>
        <h2 className={styles.title}>Financials</h2>
        <div className={styles.tabContainer}>
          {/* Render tabs based on the views passed from FinancialsPage */}
          {views.map(view => (
            <button
              key={view.id}
              className={`${styles.tabButton} ${activeView === view.id ? styles.active : ''}`}
              onClick={() => setActiveView(view.id)}
            >
              {/* Ensure view.icon exists before rendering */}
              {view.icon && <view.icon size={16} />}
              <span>{view.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={styles.actions}>
        <button className={styles.importButton} onClick={onOpenImporter}>
          <Sparkles size={16} />
          <span>Import with AI</span>
        </button>
        <button className={styles.addButton} onClick={onAddTransaction}>
          <PlusCircle size={16} />
          <span>Log Manually</span>
        </button>
      </div>
    </div>
  );
};

export default FinancialsToolbar;