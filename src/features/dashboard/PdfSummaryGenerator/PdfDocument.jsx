import React from 'react';
import styles from './PdfDocument.module.css';
import { ArrowRight } from 'lucide-react';

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

const MiniCalendar = ({ startDate, endDate, attendedDates }) => {
  const attendedDayNumbers = new Set(
    attendedDates.map(dateStr => new Date(`${dateStr}T00:00:00Z`).getUTCDate())
  );

  const startDayOfMonth = startDate.getUTCDate(); // e.g., 1 or 16
  const endDayOfMonth = endDate.getUTCDate(); // e.g., 15 or 31
  const startingWeekday = startDate.getUTCDay(); // 0 = Sun, 1 = Mon...

  const days = [];

  // 1. Add padding for the first week
  for (let i = 0; i < startingWeekday; i++) { // <<< FIX: Added i++
    days.push(<td key={`pad-${i}`} className={styles.miniCalDay_pad}></td>);
  }

  // 2. Add the actual days of the period
  for (let day = startDayOfMonth; day <= endDayOfMonth; day++) { // <<< FIX: Added day++
    const isAttended = attendedDayNumbers.has(day);
    const className = `${styles.miniCalDay} ${isAttended ? styles.miniCalDay_attended : ''}`;
    days.push(<td key={day} className={className}>{day}</td>);
  }

  // 3. Chunk days into weeks (rows)
  const weeks = [];
  // --- THIS IS THE CORRECTED LOOP ---
  for (let i = 0; i < days.length; i += 7) { 
    weeks.push(days.slice(i, i + 7)); 
  }

  return (
    <table className={styles.miniCalendar}>
      <thead>
        <tr>{['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'].map(d => <th key={d}>{d}</th>)}</tr>
      </thead>
      <tbody>
        {weeks.map((week, i) => <tr key={i}>{week.map(day => day)}</tr>)}
      </tbody>
    </table>
  );
};

const PeriodCard = ({ periodData, practice }) => {
    const p = periodData;
    const isProductionPay = p.calculatedPay > p.basePayOwed;
    const explanation = isProductionPay 
        ? "Pay was determined by production percentage, which was higher than the base/daily guarantee for this period."
        : p.basePayOwed > 0 ? "Pay was determined by the base/daily guarantee as production pay did not exceed it." : "No base pay applicable for this period.";

    if (p.productionTotal <= 0 && p.basePayOwed <= 0) {
        return null;
    }

    return (
        <div className={styles.periodCard}>
            <div className={styles.periodHeader}>
                {formatDate(p.period.start)}
                <ArrowRight size={16} />
                {formatDate(p.period.end)}
                <span>({p.attendanceDays} Day{p.attendanceDays !== 1 ? 's' : ''})</span>
            </div>
            <div className={styles.periodContent}>
                <div className={styles.detailGrid}>
                    <div className={styles.detailItem}><span>Production in Period</span><span>{formatCurrency(p.productionTotal)}</span></div>
                    {p.totalAdjustments > 0 && (
                        <>
                            <div className={styles.detailItem}><span>Total Adjustments</span><span>-{formatCurrency(p.totalAdjustments)}</span></div>
                            <div className={styles.detailItem}><span>Net for Calculation</span><span>{formatCurrency(p.netBase)}</span></div>
                        </>
                    )}
                </div>
                <div className={styles.detailGrid}>
                    <div className={`${styles.detailItem} ${!isProductionPay && p.basePayOwed > 0 ? styles.activePay : ''}`}>
                        <span>Base / Guarantee</span>
                        <span>{formatCurrency(p.basePayOwed)}</span>
                    </div>
                    <div className={`${styles.detailItem} ${isProductionPay ? styles.activePay : ''}`}>
                        <span>Production Pay ({practice.percentage}%)</span>
                        <span>{formatCurrency(p.productionPayComponent)}</span>
                    </div>
                </div>
            </div>
            {p.attendedDates && p.attendedDates.length > 0 && (
                 <MiniCalendar startDate={p.period.start} endDate={p.period.end} attendedDates={p.attendedDates} />
           )}
             <div className={styles.explanation}>
                <p>{explanation}</p>
            </div>
            <div className={styles.finalPay}>
                <span>Period Pay Total</span>
                <span>{formatCurrency(p.calculatedPay)}</span>
            </div>
        </div>
    );
};


const PdfDocument = ({ practice, periods }) => {
    // Calculate overall totals
    const totalPay = periods.reduce((sum, p) => sum + p.calculatedPay, 0);
    const totalProduction = periods.reduce((sum, p) => sum + p.productionTotal, 0);
    const totalBase = periods.reduce((sum, p) => sum + p.basePayOwed, 0);
    const totalProdComponent = periods.reduce((sum, p) => sum + p.productionPayComponent, 0);
    const totalDaysWorked = periods.reduce((sum,p) => sum + p.attendanceDays, 0);

    const overallStartDate = periods.length > 0 ? periods[0].period.start : new Date();
    const overallEndDate = periods.length > 0 ? periods[periods.length - 1].period.end : new Date();

    // Paginate periods
    const firstPagePeriods = periods.slice(0, 2);
    const subsequentPeriods = periods.slice(2);
    const subsequentPages = [];
    for (let i = 0; i < subsequentPeriods.length; i += 3) {
        subsequentPages.push(subsequentPeriods.slice(i, i + 3));
    }

    return (
        <div id="pdf-document" className={styles.document}>
            {/* --- Page 1 --- */}
            <div className={styles.page}>
                <header className={styles.header}>
                    <h1>Pay Period Summary</h1>
                    <h2>{practice.name}</h2>
                    <p>
                        Covering periods from {formatDate(overallStartDate)} to {formatDate(overallEndDate)}
                        <br />
                        Report Generated on: {new Date().toLocaleDateString()}
                    </p>
                </header>

                <section className={styles.summarySection}>
                    <h3 className={styles.sectionTitle}>Overall Summary</h3>
                    <div className={styles.summaryGrid}>
                        <div className={styles.summaryItem}><span>Total Production</span><span>{formatCurrency(totalProduction)}</span></div>
                        <div className={styles.summaryItem}><span>Base / Guarantee (Per Day)</span><span>{formatCurrency(practice.basePay || practice.dailyGuarantee)}</span></div>
                        <div className={styles.summaryItem}><span>Total Base Earned</span><span>{formatCurrency(totalBase)}</span></div>
                        <div className={styles.summaryItem}><span>Total Production Pay</span><span>{formatCurrency(totalProdComponent)}</span></div>
                        <div className={styles.summaryItem}><span>Days Worked</span><span>{totalDaysWorked}</span></div>
                    </div>
                    <div className={styles.totalPay}>
                        <span>Total Calculated Pay</span>
                        <span>{formatCurrency(totalPay)}</span>
                    </div>
                </section>

                <section>
                    <h3 className={styles.sectionTitle}>Detailed Breakdown by Period</h3>
                    <div className={styles.periodsContainer}>
                        {firstPagePeriods.map((p, index) => (
                            <PeriodCard key={`first-${index}`} periodData={p} practice={practice} />
                        ))}
                    </div>
                </section>
            </div>

            {/* --- Subsequent Pages --- */}
            {subsequentPages.map((pagePeriods, pageIndex) => (
                <div key={`page-${pageIndex + 2}`} className={styles.page}>
                     <header className={styles.header}>
                        <h2>{practice.name} - Detailed Breakdown (Cont.)</h2>
                         <p>Page {pageIndex + 2}</p>
                    </header>
                    <section>
                         <div className={styles.periodsContainer}>
                            {pagePeriods.map((p, periodIndex) => (
                                <PeriodCard key={`sub-${pageIndex}-${periodIndex}`} periodData={p} practice={practice} />
                            ))}
                        </div>
                    </section>
                </div>
            ))}
        </div>
    );
};

export default PdfDocument;