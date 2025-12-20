import React from 'react';
import styles from './AnnualSummary.module.css';
import { Calendar, TrendingUp, DollarSign, Activity } from 'lucide-react';

const AnnualSummary = ({ data }) => {
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  const formatPercent = (val) => `${val.toFixed(1)}%`;

  const avgPayPerDay = data.overallTotals.daysWorked > 0 
    ? data.overallTotals.totalCalculatedPay / data.overallTotals.daysWorked 
    : 0;

  return (
    <div className={styles.report}>
      <header className={styles.reportHeader}>
        <div>
          <h1>Annual Financial Summary</h1>
          <h2>Year {data.year}</h2>
        </div>
        <div className={styles.headerIcon}>
          <Calendar size={32} />
        </div>
      </header>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.cardIcon} style={{ backgroundColor: '#4CAF50' }}>
            <TrendingUp size={20} />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Total Production</span>
            <span className={styles.cardValue}>{formatCurrency(data.overallTotals.totalProduction)}</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.cardIcon} style={{ backgroundColor: '#2196F3' }}>
            <DollarSign size={20} />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Total Income</span>
            <span className={styles.cardValue}>{formatCurrency(data.overallTotals.totalCalculatedPay)}</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.cardIcon} style={{ backgroundColor: '#FF9800' }}>
            <Activity size={20} />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Days Worked</span>
            <span className={styles.cardValue}>{data.overallTotals.daysWorked}</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.cardIcon} style={{ backgroundColor: '#9C27B0' }}>
            <DollarSign size={20} />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Avg. Income / Day</span>
            <span className={styles.cardValue}>{formatCurrency(avgPayPerDay)}</span>
          </div>
        </div>
      </div>

      {/* Practice Breakdown */}
      <h3 className={styles.sectionTitle}>Performance by Practice</h3>
      <table className={styles.practiceTable}>
        <thead>
          <tr>
            <th>Practice</th>
            <th>Payment Type</th>
            <th className={styles.numberCell}>Days Worked</th>
            <th className={styles.numberCell}>Production</th>
            <th className={styles.numberCell}>Collection</th>
            <th className={styles.numberCell}>Income</th>
            <th className={styles.numberCell}>Payments Received</th>
            <th className={styles.numberCell}>Outstanding</th>
            <th className={styles.numberCell}>Effective Rate</th>
          </tr>
        </thead>
        <tbody>
          {data.byPractice.map((practice, idx) => (
            <tr key={idx}>
              <td className={styles.practiceName}>{practice.practiceName}</td>
              <td>{practice.paymentType}</td>
              <td className={styles.numberCell}>{practice.daysWorked}</td>
              <td className={styles.numberCell}>{formatCurrency(practice.totalProduction)}</td>
              <td className={styles.numberCell}>{formatCurrency(practice.totalCollection)}</td>
              <td className={styles.numberCell}>{formatCurrency(practice.totalCalculatedPay)}</td>
              <td className={styles.numberCell}>{formatCurrency(practice.totalPaymentsReceived)}</td>
              <td className={styles.numberCell}>
                {practice.outstandingBalance > 0 ? (
                  <span className={styles.outstanding}>{formatCurrency(practice.outstandingBalance)}</span>
                ) : (
                  <span className={styles.paidFull}>—</span>
                )}
              </td>
              <td className={styles.numberCell}>{formatPercent(practice.effectiveRate)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className={styles.totalRow}>
            <td><strong>Total</strong></td>
            <td>—</td>
            <td className={styles.numberCell}><strong>{data.overallTotals.daysWorked}</strong></td>
            <td className={styles.numberCell}><strong>{formatCurrency(data.overallTotals.totalProduction)}</strong></td>
            <td className={styles.numberCell}><strong>{formatCurrency(data.overallTotals.totalCollection)}</strong></td>
            <td className={styles.numberCell}><strong>{formatCurrency(data.overallTotals.totalCalculatedPay)}</strong></td>
            <td className={styles.numberCell}><strong>{formatCurrency(data.overallTotals.totalPaymentsReceived)}</strong></td>
            <td className={styles.numberCell}><strong>{formatCurrency(data.overallTotals.outstandingBalance)}</strong></td>
            <td className={styles.numberCell}>—</td>
          </tr>
        </tfoot>
      </table>

      {/* Monthly Breakdown for each practice */}
      {data.byPractice.map((practice, idx) => (
        <div key={idx} className={styles.monthlySection}>
          <h3 className={styles.sectionTitle}>{practice.practiceName} - Monthly Breakdown</h3>
          <table className={styles.monthlyTable}>
            <thead>
              <tr>
                <th>Month</th>
                <th className={styles.numberCell}>Days</th>
                <th className={styles.numberCell}>Production</th>
                <th className={styles.numberCell}>Collection</th>
                <th className={styles.numberCell}>Income</th>
                <th className={styles.numberCell}>Payments</th>
              </tr>
            </thead>
            <tbody>
              {practice.monthlyData.filter(m => m.production > 0 || m.daysWorked > 0).map((month, mIdx) => (
                <tr key={mIdx}>
                  <td>{month.month}</td>
                  <td className={styles.numberCell}>{month.daysWorked}</td>
                  <td className={styles.numberCell}>{formatCurrency(month.production)}</td>
                  <td className={styles.numberCell}>{formatCurrency(month.collection)}</td>
                  <td className={styles.numberCell}>{formatCurrency(month.calculatedPay)}</td>
                  <td className={styles.numberCell}>{formatCurrency(month.paymentsReceived)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <footer className={styles.reportFooter}>
        <p>Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </footer>
    </div>
  );
};

export default AnnualSummary;
