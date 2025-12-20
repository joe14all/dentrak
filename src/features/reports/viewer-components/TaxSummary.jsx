import React from 'react';
import styles from './TaxSummary.module.css';
import { FileText, BarChart3 } from 'lucide-react';

const TaxSummary = ({ data }) => {
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  return (
    <div className={styles.report}>
      <header className={styles.reportHeader}>
        <div>
          <h1>Tax Summary Report</h1>
          <h2>Year {data.year}</h2>
        </div>
        <div className={styles.headerIcon}>
          <FileText size={32} />
        </div>
      </header>

      {/* Annual Totals */}
      <div className={styles.annualTotals}>
        <div className={styles.totalCard}>
          <span className={styles.totalLabel}>Total Annual Income</span>
          <span className={styles.totalValue}>{formatCurrency(data.totals.totalIncome)}</span>
        </div>
        <div className={styles.totalCard}>
          <span className={styles.totalLabel}>Total Payments Received</span>
          <span className={styles.totalValue}>{formatCurrency(data.totals.totalReceived)}</span>
        </div>
        <div className={styles.totalCard}>
          <span className={styles.totalLabel}>Cash Basis Reporting</span>
          <span className={styles.totalValue}>{formatCurrency(data.totals.totalReceived)}</span>
          <span className={styles.totalNote}>For Tax Purposes</span>
        </div>
      </div>

      {/* Practice-by-Practice Breakdown */}
      <h3 className={styles.sectionTitle}><BarChart3 size={18} /> Income by Practice</h3>
      
      {data.practiceData.map((practice, idx) => (
        <div key={idx} className={styles.practiceSection}>
          <div className={styles.practiceHeader}>
            <h4>{practice.practiceName}</h4>
            <div className={styles.practiceTotal}>{formatCurrency(practice.annualIncome)}</div>
          </div>

          <table className={styles.quarterlyTable}>
            <thead>
              <tr>
                <th>Quarter</th>
                <th className={styles.numberCell}>Income Earned</th>
                <th className={styles.numberCell}>Payments Received</th>
              </tr>
            </thead>
            <tbody>
              {practice.quarterlyData.map((quarter, qIdx) => (
                <tr key={qIdx}>
                  <td className={styles.quarterName}>{quarter.quarter}</td>
                  <td className={styles.numberCell}>{formatCurrency(quarter.income)}</td>
                  <td className={styles.numberCell}>{formatCurrency(quarter.received)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={styles.totalRow}>
                <td><strong>Annual Total</strong></td>
                <td className={styles.numberCell}><strong>{formatCurrency(practice.annualIncome)}</strong></td>
                <td className={styles.numberCell}><strong>{formatCurrency(practice.annualPaymentsReceived)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ))}

      {/* Combined Summary */}
      <div className={styles.combinedSummary}>
        <h3 className={styles.sectionTitle}>Combined Quarterly Summary</h3>
        <table className={styles.quarterlyTable}>
          <thead>
            <tr>
              <th>Quarter</th>
              {data.practiceData.map((practice, idx) => (
                <th key={idx} className={styles.numberCell}>{practice.practiceName}</th>
              ))}
              <th className={styles.numberCell}><strong>Total</strong></th>
            </tr>
          </thead>
          <tbody>
            {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter, qIdx) => (
              <tr key={quarter}>
                <td className={styles.quarterName}>{quarter}</td>
                {data.practiceData.map((practice, pIdx) => (
                  <td key={pIdx} className={styles.numberCell}>
                    {formatCurrency(practice.quarterlyData[qIdx].received)}
                  </td>
                ))}
                <td className={styles.numberCell}>
                  <strong>
                    {formatCurrency(
                      data.practiceData.reduce((sum, p) => sum + p.quarterlyData[qIdx].received, 0)
                    )}
                  </strong>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className={styles.totalRow}>
              <td><strong>Annual Total</strong></td>
              {data.practiceData.map((practice, idx) => (
                <td key={idx} className={styles.numberCell}>
                  <strong>{formatCurrency(practice.annualPaymentsReceived)}</strong>
                </td>
              ))}
              <td className={styles.numberCell}>
                <strong>{formatCurrency(data.totals.totalReceived)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Tax Notes */}
      <div className={styles.taxNotes}>
        <h3>Important Tax Information</h3>
        <ul>
          <li>This summary uses <strong>cash basis accounting</strong> - income is reported when payments are received, not when earned.</li>
          <li>Quarterly figures show actual payments received in each quarter, which may differ from income earned.</li>
          <li>For accurate tax filing, always consult with a qualified tax professional or accountant.</li>
          <li>Keep all payment receipts, invoices, and supporting documentation for at least 7 years.</li>
        </ul>
      </div>

      <footer className={styles.reportFooter}>
        <p>Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p className={styles.disclaimer}>This report is for informational purposes only and does not constitute tax advice.</p>
      </footer>
    </div>
  );
};

export default TaxSummary;
