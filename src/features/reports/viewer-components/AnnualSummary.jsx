import React from 'react';
import styles from './PayPeriodStatement.module.css'; // Reuse styles

const AnnualSummary = ({ data }) => {
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  return (
    <div className={styles.statement}>
      <div className={styles.statementHeader}>
        <h1>{data.year} Annual Summary</h1>
        <h2>A high-level overview of your financial performance.</h2>
      </div>

      <h3 className={styles.sectionTitle}>Overall Totals</h3>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}><span>Total Production</span><span>{formatCurrency(data.overallTotals.totalProduction)}</span></div>
        <div className={`${styles.summaryItem} ${styles.total}`}><span>Total Calculated Pay</span><span>{formatCurrency(data.overallTotals.totalCalculatedPay)}</span></div>
      </div>
      
      <h3 className={styles.sectionTitle}>Breakdown by Practice</h3>
      <table className={styles.lineItemTable}>
        <thead>
          <tr>
            <th>Practice</th>
            <th className={styles.currencyCell}>Total Production</th>
            <th className={styles.currencyCell}>Total Pay (Est.)</th>
          </tr>
        </thead>
        <tbody>
          {data.byPractice.map(item => (
            <tr key={item.practiceName}>
              <td>{item.practiceName}</td>
              <td className={styles.currencyCell}>{formatCurrency(item.totalProduction)}</td>
              <td className={styles.currencyCell}>{formatCurrency(item.totalCalculatedPay)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AnnualSummary;
