import React from 'react';
import styles from './PdfDocument.module.css';
import { ArrowRight } from 'lucide-react';

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/**
 * Convert a patient name or ID to initials for HIPAA compliance
 * Examples: "John Doe" -> "JD", "Jane Smith-Jones" -> "JSJ", "123456" -> "123456"
 */
const getInitials = (patientId) => {
  if (!patientId || patientId === 'N/A') return 'N/A';
  
  // If it's purely numeric (patient ID number), return as is
  if (/^\d+$/.test(patientId.trim())) return patientId;
  
  // Extract initials from name
  const words = patientId.trim().split(/[\s-]+/); // Split by spaces or hyphens
  const initials = words
    .filter(word => word.length > 0)
    .map(word => word[0].toUpperCase())
    .join('');
  
  return initials || patientId;
};

const MiniCalendar = ({ startDate, endDate, attendedDates, attendanceEntries }) => {
  // Create a map of day numbers to attendance types
  const attendanceByDay = {};
  
  if (attendanceEntries && attendanceEntries.length > 0) {
    attendanceEntries.forEach(entry => {
      if (entry.date) {
        const entryDate = new Date(`${entry.date}T00:00:00Z`);
        const dayNum = entryDate.getUTCDate();
        const attendanceType = entry.attendanceType || 'full-day';
        // If we have multiple entries for same day, take the max (full-day > half-day)
        if (!attendanceByDay[dayNum] || attendanceType === 'full-day') {
          attendanceByDay[dayNum] = attendanceType;
        }
      }
    });
  } else {
    // Fallback: if no entries provided, use attendedDates as full days
    attendedDates.forEach(dateStr => {
      const dayNum = new Date(`${dateStr}T00:00:00Z`).getUTCDate();
      attendanceByDay[dayNum] = 'full-day';
    });
  }

  const startDayOfMonth = startDate.getUTCDate(); // e.g., 1 or 16
  const endDayOfMonth = endDate.getUTCDate(); // e.g., 15 or 31
  const startingWeekday = startDate.getUTCDay(); // 0 = Sun, 1 = Mon...

  const days = [];

  // 1. Add padding for the first week
  for (let i = 0; i < startingWeekday; i++) {
    days.push(<td key={`pad-${i}`} className={styles.miniCalDay_pad}></td>);
  }

  // 2. Add the actual days of the period
  for (let day = startDayOfMonth; day <= endDayOfMonth; day++) {
    const attendanceType = attendanceByDay[day];
    const isAttended = !!attendanceType;
    const isHalfDay = attendanceType === 'half-day';
    
    const className = `${styles.miniCalDay} ${
      isAttended ? (isHalfDay ? styles.miniCalDay_halfDay : styles.miniCalDay_attended) : ''
    }`;
    
    days.push(
      <td key={day} className={className}>
        {day}
      </td>
    );
  }

  // 3. Chunk days into weeks (rows)
  const weeks = [];
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
    
    // Format days worked to show decimal if needed
    const daysDisplay = p.attendanceDays % 1 === 0 ? p.attendanceDays : p.attendanceDays.toFixed(1);

    return (
        <div className={styles.periodCard}>
            <div className={styles.periodHeader}>
                {formatDate(p.period.start)}
                <ArrowRight size={16} />
                {formatDate(p.period.end)}
                <span>({daysDisplay} Day{p.attendanceDays !== 1 ? 's' : ''})</span>
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
                 <MiniCalendar 
                   startDate={p.period.start} 
                   endDate={p.period.end} 
                   attendedDates={p.attendedDates}
                   attendanceEntries={p.attendanceEntries}
                 />
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


const PdfDocument = ({ practice, periods, procedureEntries = [], hipaaCompliant = true }) => {
    // Calculate overall totals
    const totalPay = periods.reduce((sum, p) => sum + p.calculatedPay, 0);
    const totalProduction = periods.reduce((sum, p) => sum + p.productionTotal, 0);
    const totalBase = periods.reduce((sum, p) => sum + p.basePayOwed, 0);
    const totalProdComponent = periods.reduce((sum, p) => sum + p.productionPayComponent, 0);
    const totalDaysWorked = periods.reduce((sum,p) => sum + p.attendanceDays, 0);
    
    // Format total days worked to show decimal if needed
    const totalDaysDisplay = totalDaysWorked % 1 === 0 ? totalDaysWorked : totalDaysWorked.toFixed(1);

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
            <div className={styles.page} data-pdf-page="1">
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
                        <div className={styles.summaryItem}><span>Days Worked</span><span>{totalDaysDisplay}</span></div>
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
                <div key={`page-${pageIndex + 2}`} className={styles.page} data-pdf-page={pageIndex + 2}>
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
            
            {/* --- Procedure Details Pages (Paginated) --- */}
            {procedureEntries.length > 0 && (() => {
                // Paginate procedures: 15 rows per page
                const PROCEDURES_PER_PAGE = 15;
                const procedurePages = [];
                for (let i = 0; i < procedureEntries.length; i += PROCEDURES_PER_PAGE) {
                    procedurePages.push(procedureEntries.slice(i, i + PROCEDURES_PER_PAGE));
                }
                
                const totalProcedureProduction = procedureEntries.reduce((sum, e) => sum + (e.production || 0), 0);
                const basePageNumber = subsequentPages.length + 2;
                
                return procedurePages.map((pageProcedures, pageIndex) => {
                    const isLastPage = pageIndex === procedurePages.length - 1;
                    const pageNumber = basePageNumber + pageIndex;
                    const startIndex = pageIndex * PROCEDURES_PER_PAGE + 1;
                    const endIndex = Math.min((pageIndex + 1) * PROCEDURES_PER_PAGE, procedureEntries.length);
                    
                    return (
                        <div key={`procedures-page-${pageIndex}`} className={styles.page} data-pdf-page={pageNumber}>
                            <header className={styles.header}>
                                <h2>{practice.name} - Procedure Details {procedurePages.length > 1 ? `(Page ${pageIndex + 1} of ${procedurePages.length})` : ''}</h2>
                                <p>Page {pageNumber}</p>
                            </header>
                            <section>
                                <h3 className={styles.sectionTitle}>
                                    Individual Procedures ({procedureEntries.length} Total)
                                    {procedurePages.length > 1 && ` - Showing ${startIndex}-${endIndex}`}
                                </h3>
                                <table className={styles.procedureTable}>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Procedure Code</th>
                                            <th>Patient {hipaaCompliant ? 'Initials' : 'ID'}</th>
                                            <th>Production</th>
                                            <th>Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pageProcedures.map((entry, index) => (
                                            <tr key={index}>
                                                <td>{formatDate(new Date(`${entry.date}T00:00:00Z`))}</td>
                                                <td>{entry.procedureCode || 'N/A'}</td>
                                                <td>{hipaaCompliant ? getInitials(entry.patientId) : (entry.patientId || 'N/A')}</td>
                                                <td className={styles.currency}>{formatCurrency(entry.production)}</td>
                                                <td className={styles.notes}>{entry.notes || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {isLastPage && (
                                        <tfoot>
                                            <tr>
                                                <td colSpan="3" className={styles.totalLabel}>Total Procedure Production</td>
                                                <td className={styles.currency}>
                                                    <strong>{formatCurrency(totalProcedureProduction)}</strong>
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </section>
                        </div>
                    );
                });
            })()}
        </div>
    );
};

export default PdfDocument;