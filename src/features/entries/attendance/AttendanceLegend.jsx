import React, { useMemo, useState } from 'react';
import styles from './AttendanceLegend.module.css';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';

const AttendanceLegend = ({ practices, colorMap, attendanceEntries, currentDate, pendingChanges }) => {
  const [isGuideExpanded, setIsGuideExpanded] = useState(false);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount || 0);
  };
  
  const legendData = useMemo(() => {
    if (!practices) return [];

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Helper function for robust date checking
    const isDateInCurrentMonth = (dateStr) => {
        if (!dateStr) return false;
        // THE FIX: Parse date as UTC to prevent timezone shifts.
        const date = new Date(`${dateStr}T00:00:00Z`);
        return date.getUTCFullYear() === currentYear && date.getUTCMonth() === currentMonth;
    };

    return practices.map(practice => {
      const baseRate = practice.basePay || practice.dailyGuarantee || 0;

      // 1. Count existing entries using the robust date check, accounting for half-days
      const entriesInMonth = attendanceEntries.filter(e => 
        e.practiceId === practice.id && isDateInCurrentMonth(e.date)
      );
      
      const existingDayCount = entriesInMonth.reduce((total, entry) => {
        // Check if this entry has a pending update
        const pendingUpdate = pendingChanges.updates && pendingChanges.updates[entry.id];
        const attendanceType = pendingUpdate?.attendanceType || entry.attendanceType || 'full-day';
        
        // Check if entry is staged for removal
        if (pendingChanges.removals.has(entry.id)) {
          return total; // Don't count if being removed
        }
        
        return total + (attendanceType === 'half-day' ? 0.5 : 1);
      }, 0);

      // 2. Count staged additions using the robust date check, accounting for half-days
      const additionsDayCount = Object.values(pendingChanges.additions)
        .filter(add => add.practiceId === practice.id && isDateInCurrentMonth(add.date))
        .reduce((total, add) => {
          return total + (add.attendanceType === 'half-day' ? 0.5 : 1);
        }, 0);

      const finalDayCount = existingDayCount + additionsDayCount;
      const estimatedPay = finalDayCount * baseRate;

      return {
        ...practice,
        dayCount: finalDayCount,
        estimatedPay: estimatedPay
      };
    });
  }, [practices, attendanceEntries, currentDate, pendingChanges]);

  // Calculate totals
  const totals = useMemo(() => {
    return legendData.reduce(
      (acc, practice) => ({
        totalDays: acc.totalDays + practice.dayCount,
        totalPay: acc.totalPay + practice.estimatedPay
      }),
      { totalDays: 0, totalPay: 0 }
    );
  }, [legendData]);

  return (
    <div className={styles.legendContainer}>
      <h4 className={styles.title}>Monthly Summary</h4>
      
      {/* Collapsible Usage Guide */}
      <div className={styles.usageGuide}>
        <button 
          className={styles.guideHeader}
          onClick={() => setIsGuideExpanded(!isGuideExpanded)}
        >
          {isGuideExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Info size={14} />
          <span>How to track attendance:</span>
        </button>
        {isGuideExpanded && (
          <div className={styles.guideContent}>
            <div className={styles.guideItem}>
              <div className={styles.guideIndicator}>
                <div className={styles.emptyDot}></div>
              </div>
              <span>Click once: Add full day</span>
            </div>
            <div className={styles.guideItem}>
              <div className={styles.guideIndicator}>
                <div className={styles.halfDayDot}>½</div>
              </div>
              <span>Click twice: Change to half day</span>
            </div>
            <div className={styles.guideItem}>
              <div className={styles.guideIndicator}>
                <div className={styles.emptyDot}></div>
              </div>
              <span>Click third time: Remove</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Summary Table */}
      <div className={styles.summaryTable}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Practice</th>
              <th>Days</th>
              <th>Base Pay</th>
            </tr>
          </thead>
          <tbody>
            {(legendData || []).map(practice => (
              <tr key={practice.id}>
                <td>
                  <div className={styles.practiceCell}>
                    <span 
                      className={styles.colorSwatch} 
                      style={{ backgroundColor: colorMap[practice.id] }}
                    ></span>
                    <span className={styles.practiceName}>{practice.name}</span>
                  </div>
                </td>
                <td className={styles.centeredCell}>
                  {practice.dayCount % 1 === 0 ? practice.dayCount : practice.dayCount.toFixed(1)}
                </td>
                <td className={styles.rightAlignedCell}>
                  {formatCurrency(practice.estimatedPay)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className={styles.totalRow}>
              <td className={styles.totalLabel}>Total</td>
              <td className={styles.centeredCell}>
                {totals.totalDays % 1 === 0 ? totals.totalDays : totals.totalDays.toFixed(1)}
              </td>
              <td className={styles.rightAlignedCell}>
                {formatCurrency(totals.totalPay)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default AttendanceLegend;

