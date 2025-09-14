import React from 'react';
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
  return (
    <div className={styles.dashboardGrid}>
      <div className={styles.statCard}>
        <h3>Total Production</h3>
        <p>$0.00</p>
      </div>
      <div className={styles.statCard}>
        <h3>Outstanding Cheques</h3>
        <p>$0.00</p>
      </div>
      <div className={styles.statCard}>
        <h3>Next Payout</h3>
        <p>N/A</p>
      </div>
       <div className={styles.mainChart}>
        <p>Performance Chart</p>
      </div>
    </div>
  );
};

export default DashboardPage;

