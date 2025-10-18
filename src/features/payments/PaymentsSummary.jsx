import React from 'react';
import styles from './PaymentsSummary.module.css';
import { PiggyBank, Receipt } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const PaymentsSummary = ({ summaryData }) => {
  return (
    <div className={styles.summaryContainer}>
      <div className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <PiggyBank size={16} className={`${styles.icon} ${styles.amountIcon}`} />
          <span className={styles.cardTitle}>Total Received</span>
        </div>
        <p className={styles.cardValue}>{formatCurrency(summaryData.totalAmount)}</p>
      </div>
      <div className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <Receipt size={16} className={`${styles.icon} ${styles.countIcon}`} />
          <span className={styles.cardTitle}>Total Payments</span>
        </div>
        <p className={styles.cardValue}>{summaryData.paymentCount}</p>
      </div>
    </div>
  );
};

export default PaymentsSummary;