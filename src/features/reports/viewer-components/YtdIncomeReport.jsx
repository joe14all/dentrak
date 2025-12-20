import React from 'react';
import styles from './YtdIncomeReport.module.css';
import { TrendingUp, Calendar, DollarSign, Clock } from 'lucide-react';

const YtdIncomeReport = ({ data }) => {
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  const monthName = new Date(data.year, data.currentMonth).toLocaleString('default', { month: 'long' });
  const avgPayPerDay = data.totals.daysWorked > 0 ? data.totals.totalIncome / data.totals.daysWorked : 0;

  return (
    <div className={styles.report}>
      <header className={styles.reportHeader}>
        <div>
          <h1>Year-to-Date Income Report</h1>
          <h2>{data.year} - Through {monthName}</h2>
        </div>
        <div className={styles.headerIcon}>
          <TrendingUp size={32} />
        </div>
      </header>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.cardIcon}>
            <DollarSign size={20} />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Total Income (YTD)</span>
            <span className={styles.cardValue}>{formatCurrency(data.totals.totalIncome)}</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.cardIcon}>
            <DollarSign size={20} />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Payments Received</span>
            <span className={styles.cardValue}>{formatCurrency(data.totals.totalReceived)}</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.cardIcon}>
            <Calendar size={20} />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Total Days Worked</span>
            <span className={styles.cardValue}>{data.totals.daysWorked}</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.cardIcon}>
            <Clock size={20} />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Avg. Income / Day</span>
            <span className={styles.cardValue}>{formatCurrency(avgPayPerDay)}</span>
          </div>
        </div>
      </div>

      {/* Outstanding Balance Section */}
      {data.totals.totalOutstanding > 0 && (
        <div className={styles.outstandingSection}>
          <h3>Outstanding Balance</h3>
          <p className={styles.outstandingAmount}>{formatCurrency(data.totals.totalOutstanding)}</p>
          <p className={styles.outstandingNote}>
            This represents income earned but not yet received
          </p>
        </div>
      )}

      {/* Practice Breakdown */}
      <h3 className={styles.sectionTitle}>Income by Practice</h3>
      <table className={styles.practiceTable}>
        <thead>
          <tr>
            <th>Practice</th>
            <th className={styles.numberCell}>Days Worked</th>
            <th className={styles.numberCell}>Total Income</th>
            <th className={styles.numberCell}>Payments Received</th>
            <th className={styles.numberCell}>Outstanding</th>
            <th className={styles.numberCell}>Avg. Income / Day</th>
          </tr>
        </thead>
        <tbody>
          {data.practiceData.map((practice, idx) => (
            <tr key={idx}>
              <td className={styles.practiceName}>{practice.practiceName}</td>
              <td className={styles.numberCell}>{practice.daysWorked}</td>
              <td className={styles.numberCell}>{formatCurrency(practice.totalCalculatedPay)}</td>
              <td className={styles.numberCell}>{formatCurrency(practice.totalPaymentsReceived)}</td>
              <td className={styles.numberCell}>
                {practice.outstandingBalance > 0 ? (
                  <span className={styles.outstanding}>{formatCurrency(practice.outstandingBalance)}</span>
                ) : (
                  <span className={styles.paidFull}>Paid in Full</span>
                )}
              </td>
              <td className={styles.numberCell}>{formatCurrency(practice.avgPayPerDay)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className={styles.totalRow}>
            <td><strong>Total</strong></td>
            <td className={styles.numberCell}><strong>{data.totals.daysWorked}</strong></td>
            <td className={styles.numberCell}><strong>{formatCurrency(data.totals.totalIncome)}</strong></td>
            <td className={styles.numberCell}><strong>{formatCurrency(data.totals.totalReceived)}</strong></td>
            <td className={styles.numberCell}><strong>{formatCurrency(data.totals.totalOutstanding)}</strong></td>
            <td className={styles.numberCell}><strong>{formatCurrency(avgPayPerDay)}</strong></td>
          </tr>
        </tfoot>
      </table>

      <footer className={styles.reportFooter}>
        <p>Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p className={styles.disclaimer}>This report is for informational purposes only. Consult with your accountant for tax preparation.</p>
      </footer>
    </div>
  );
};

export default YtdIncomeReport;
