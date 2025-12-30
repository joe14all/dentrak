import React from 'react';
import styles from './FinancialsSummary.module.css';
import { DollarSign, CreditCard, TrendingUp, Receipt } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const FinancialsSummary = ({ summaryData }) => {
  const { totalAmount, itemCount, completedAmount, pendingAmount } = summaryData;

  return (
    <div className={styles.summaryContainer}>
      <div className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <DollarSign size={16} className={`${styles.icon} ${styles.totalIcon}`} />
          <span className={styles.cardTitle}>Total Amount</span>
        </div>
        <p className={styles.cardValue}>{formatCurrency(totalAmount)}</p>
      </div>

      <div className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <Receipt size={16} className={`${styles.icon} ${styles.countIcon}`} />
          <span className={styles.cardTitle}>Total Items</span>
        </div>
        <p className={styles.cardValue}>{itemCount}</p>
      </div>

      <div className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <TrendingUp size={16} className={`${styles.icon} ${styles.completedIcon}`} />
          <span className={styles.cardTitle}>Completed</span>
        </div>
        <p className={styles.cardValue}>{formatCurrency(completedAmount)}</p>
        <span className={styles.subtext}>
          {totalAmount > 0 ? ((completedAmount / totalAmount) * 100).toFixed(0) : 0}% of total
        </span>
      </div>

      <div className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <CreditCard size={16} className={`${styles.icon} ${styles.pendingIcon}`} />
          <span className={styles.cardTitle}>Pending</span>
        </div>
        <p className={styles.cardValue}>{formatCurrency(pendingAmount)}</p>
        <span className={styles.subtext}>
          {totalAmount > 0 ? ((pendingAmount / totalAmount) * 100).toFixed(0) : 0}% of total
        </span>
      </div>
    </div>
  );
};

export default FinancialsSummary;
