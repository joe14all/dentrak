import React from 'react';
import styles from './PdfDocument.module.css';
import { ArrowRight } from 'lucide-react';

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

const PdfDocument = ({ practice, periods }) => {
    const totalPay = periods.reduce((sum, p) => sum + p.calculatedPay, 0);

    return (
        <div id="pdf-document" className={styles.document}>
            <header className={styles.header}>
                <h1>Payment Summary</h1>
                <h2>{practice.name}</h2>
                <p>Report Generated on: {new Date().toLocaleDateString()}</p>
            </header>

            <div className={styles.totalSummary}>
                <span>Total Calculated Pay</span>
                <span>{formatCurrency(totalPay)}</span>
            </div>

            <h3 className={styles.sectionTitle}>Breakdown by Pay Period</h3>

            <div className={styles.periodsContainer}>
                {periods.map((p, index) => {
                    const isProductionPay = p.calculatedPay > p.basePayOwed;
                    const explanation = isProductionPay 
                        ? "Pay was determined by production percentage, which was higher than the base guarantee."
                        : "Pay was determined by the base/daily guarantee.";
                        
                    return (
                        <div key={index} className={styles.periodCard}>
                            <h4>{formatDate(p.period.start)} - {formatDate(p.period.end)}</h4>
                            <div className={styles.detailGrid}>
                                <div className={styles.detailItem}><span>Production Total for Period</span><span>{formatCurrency(p.productionTotal)}</span></div>
                                <div className={`${styles.detailItem} ${!isProductionPay ? styles.activePay : ''}`}>
                                    <span>Base Pay Earned</span>
                                    <span>{formatCurrency(p.basePayOwed)}</span>
                                </div>
                                <div className={`${styles.detailItem} ${isProductionPay ? styles.activePay : ''}`}>
                                    <span>Production Pay Component</span>
                                    <span>{formatCurrency(p.productionPayComponent)}</span>
                                </div>
                                <div className={styles.explanation}>
                                    <p>{explanation}</p>
                                </div>
                                <div className={styles.finalPay}>
                                    <span>Period Pay <ArrowRight size={14} /></span>
                                    <span>{formatCurrency(p.calculatedPay)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PdfDocument;

