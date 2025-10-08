import React from 'react';
import styles from './PayPeriodStatement.module.css'; // Reuse styles

const PracticeComparison = ({ data }) => {
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  return (
    <div className={styles.statement}>
       <div className={styles.statementHeader}>
        <h1>Practice Comparison</h1>
        <h2>A side-by-side analysis of key performance metrics.</h2>
      </div>

      <h3 className={styles.sectionTitle}>Performance Metrics</h3>
       <table className={styles.lineItemTable}>
        <thead>
          <tr>
            <th>Practice</th>
            <th className={styles.currencyCell}>Total Production</th>
            <th className={styles.currencyCell}>Total Collection</th>
            <th className={styles.currencyCell}>Days Worked</th>
            <th className={styles.currencyCell}>Avg. Production / Day</th>
          </tr>
        </thead>
        <tbody>
          {data.metrics.map(item => (
            <tr key={item.practiceName}>
              <td>{item.practiceName}</td>
              <td className={styles.currencyCell}>{formatCurrency(item.totalProduction)}</td>
              <td className={styles.currencyCell}>{formatCurrency(item.totalCollection)}</td>
              <td className={styles.currencyCell}>{item.daysWorked}</td>
              <td className={styles.currencyCell}>{formatCurrency(item.avgProductionPerDay)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PracticeComparison;
