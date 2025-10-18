import React from 'react';
import styles from './PerformanceSummary.module.css';
import { TrendingUp, TrendingDown, MinusCircle } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const PerformanceSummary = ({ summaryData }) => {
  return (
    <div className={styles.summaryContainer}>
      <div className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <TrendingUp size={16} className={`${styles.icon} ${styles.productionIcon}`} />
          <span className={styles.cardTitle}>Total Production</span>
        </div>
        <p className={styles.cardValue}>{formatCurrency(summaryData.totalProduction)}</p>
      </div>
      <div className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <TrendingDown size={16} className={`${styles.icon} ${styles.collectionIcon}`} />
          <span className={styles.cardTitle}>Total Collection</span>
        </div>
        <p className={styles.cardValue}>{formatCurrency(summaryData.totalCollection)}</p>
      </div>
      <div className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <MinusCircle size={16} className={`${styles.icon} ${styles.adjustmentsIcon}`} />
          <span className={styles.cardTitle}>Total Adjustments</span>
        </div>
        <p className={styles.cardValue}>-{formatCurrency(summaryData.totalAdjustments)}</p>
      </div>
    </div>
  );
};

export default PerformanceSummary;