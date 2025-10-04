import React, { useMemo } from 'react';
import styles from './AttendanceLegend.module.css';
import { CalendarDays, DollarSign } from 'lucide-react';

const AttendanceLegend = ({ practices, colorMap, attendanceEntries, currentDate, pendingChanges }) => {
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount || 0);
  };
  
  // This memoized calculation derives all necessary stats for the legend
  const legendData = useMemo(() => {
    if (!practices) return [];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    return practices.map(practice => {
      // Determine the base pay rate for this practice
      const baseRate = practice.basePay || practice.dailyGuarantee || 0;

      // 1. Count existing entries for this practice in the current month
      const entriesInMonth = attendanceEntries.filter(e => {
        const entryDate = new Date(e.date);
        return e.practiceId === practice.id &&
               entryDate.getFullYear() === year &&
               entryDate.getMonth() === month;
      });

      // 2. Count staged additions for this practice in the current month
      const additionsInMonth = Object.values(pendingChanges.additions).filter(add => {
          const addDate = new Date(add.date);
          return add.practiceId === practice.id &&
                 addDate.getFullYear() === year &&
                 addDate.getMonth() === month;
      }).length;

      // 3. Count staged removals for this practice in the current month
      const removalsInMonth = Array.from(pendingChanges.removals).filter(removalId => {
          const entry = attendanceEntries.find(e => e.id === removalId);
          if (!entry) return false;
          const removeDate = new Date(entry.date);
          return entry.practiceId === practice.id &&
                 removeDate.getFullYear() === year &&
                 removeDate.getMonth() === month;
      }).length;

      // 4. Calculate the final day count and estimated pay
      const finalDayCount = entriesInMonth.length + additionsInMonth - removalsInMonth;
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
                <span>{practice.dayCount} day{practice.dayCount !== 1 ? 's' : ''} attended</span>
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

