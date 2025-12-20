import React from 'react';
import styles from './PayPeriodStatement.module.css';

const PayPeriodStatement = ({ data }) => {
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }
  const formatPercent = (val) => `${val.toFixed(1)}%`;

  // Helper to calculate total adjustments for a single entry
  const getLineItemAdjustmentsTotal = (item) => {
    return (item.adjustments || []).reduce((sum, adj) => sum + adj.amount, 0);
  };

  return (
    <div className={styles.statement}>
      <header className={styles.statementHeader}>
        <h1>Pay Period Statement</h1>
        <h2>{data.practiceName}</h2>
        <p className={styles.periodRange}>{formatDate(data.startDate)} - {formatDate(data.endDate)}</p>
      </header>
      
      {/* Practice Info */}
      <div className={styles.practiceInfo}>
        <div className={styles.infoItem}>
          <span>Payment Type:</span>
          <strong>{data.paymentType}</strong>
        </div>
        {data.paymentType === 'percentage' && (
          <div className={styles.infoItem}>
            <span>Percentage Rate:</span>
            <strong>{data.percentage}%</strong>
          </div>
        )}
        {data.paymentType === 'dailyRate' && (
          <div className={styles.infoItem}>
            <span>Daily Rate:</span>
            <strong>{formatCurrency(data.basePay)}</strong>
          </div>
        )}
      </div>

      <h3 className={styles.sectionTitle}>Summary</h3>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}><span>Gross Production</span><span>{formatCurrency(data.summary.grossProduction)}</span></div>
        <div className={styles.summaryItem}><span>Gross Collection</span><span>{formatCurrency(data.summary.grossCollection)}</span></div>
        <div className={styles.summaryItem}><span>Collection Rate</span><span>{formatPercent(data.summary.collectionRate)}</span></div>
        <div className={styles.summaryItem}><span>Total Adjustments</span><span>-{formatCurrency(data.summary.totalAdjustments)}</span></div>
        <div className={styles.summaryItem}><span>Days Worked</span><span>{data.summary.daysWorked}</span></div>
        <div className={styles.summaryItem}><span>Avg. Production / Day</span><span>{formatCurrency(data.summary.avgProductionPerDay)}</span></div>
        <div className={styles.summaryItem}><span>Calculated Pay</span><span>{formatCurrency(data.summary.calculatedPay)}</span></div>
        <div className={styles.summaryItem}><span>Avg. Pay / Day</span><span>{formatCurrency(data.summary.avgPayPerDay)}</span></div>
        <div className={styles.summaryItem}><span>Effective Rate</span><span>{formatPercent(data.summary.effectiveRate)}</span></div>
        <div className={styles.summaryItem}><span>Payments Received</span><span>{formatCurrency(data.summary.totalPaymentsReceived)}</span></div>
        <div className={`${styles.summaryItem} ${styles.total}`}>
            <span>Balance Due</span>
            <span>{formatCurrency(data.summary.balanceDue)}</span>
        </div>
      </div>

      <h3 className={styles.sectionTitle}>Performance Entries</h3>
      <table className={styles.lineItemTable}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th className={styles.currencyCell}>Production</th>
            <th className={styles.currencyCell}>Collection</th>
            <th className={styles.currencyCell}>Adjustments</th>
          </tr>
        </thead>
        <tbody>
          {data.lineItems.map(item => (
            <tr key={`entry-${item.id}`}>
              <td>{formatDate(item.date || item.periodStartDate)}</td>
              <td>{item.entryType.replace(/([A-Z])/g, ' $1')}</td>
              <td className={styles.currencyCell}>{formatCurrency(item.production)}</td>
              <td className={styles.currencyCell}>{formatCurrency(item.collection)}</td>
              <td className={styles.currencyCell}>-{formatCurrency(getLineItemAdjustmentsTotal(item))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.paymentItems && data.paymentItems.length > 0 && (
        <>
            <h3 className={styles.sectionTitle}>Payments Received in Period</h3>
            <table className={styles.lineItemTable}>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Method</th>
                        <th>Reference #</th>
                        <th className={styles.currencyCell}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {data.paymentItems.map(item => (
                        <tr key={`payment-${item.id}`}>
                            <td>{formatDate(item.paymentDate)}</td>
                            <td>{item.paymentMethod}</td>
                            <td>{item.referenceNumber || '—'}</td>
                            <td className={styles.currencyCell}>{formatCurrency(item.amount)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
      )}
    </div>
  );
};

export default PayPeriodStatement;

