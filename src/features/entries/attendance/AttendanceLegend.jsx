import React, { useMemo } from 'react';
import styles from './AttendanceLegend.module.css';
import { CalendarDays, DollarSign, Info } from 'lucide-react';

const AttendanceLegend = ({ practices, colorMap, attendanceEntries, currentDate, pendingChanges }) => {
  
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

  return (
    <div className={styles.legendContainer}>
      <h4 className={styles.title}>Monthly Summary</h4>
      
      {/* Usage Guide */}
      <div className={styles.usageGuide}>
        <div className={styles.guideHeader}>
          <Info size={14} />
          <span>How to track attendance:</span>
        </div>
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
      </div>
      
      <div className={styles.legendItems}>
        {(legendData || []).map(practice => (
          <div key={practice.id} className={styles.legendItem}>
            <div className={styles.itemHeader}>
              <span 
                className={styles.colorSwatch} 
                style={{ backgroundColor: colorMap[practice.id] }}
              ></span>
              <span className={styles.practiceName}>{practice.name}</span>
            </div>
            <div className={styles.itemStats}>
              <div className={styles.stat}>
                <CalendarDays size={14} />
                <span>{practice.dayCount % 1 === 0 ? practice.dayCount : practice.dayCount.toFixed(1)} day{practice.dayCount !== 1 ? 's' : ''} attended</span>
              </div>
              <div className={styles.stat}>
                <DollarSign size={14} />
                <span>Est. Base Pay: {formatCurrency(practice.estimatedPay)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceLegend;

