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

      // 1. Count existing entries using the robust date check
      const entriesInMonth = attendanceEntries.filter(e => 
        e.practiceId === practice.id && isDateInCurrentMonth(e.date)
      );

      // 2. Count staged additions using the robust date check
      const additionsInMonth = Object.values(pendingChanges.additions).filter(add => 
        add.practiceId === practice.id && isDateInCurrentMonth(add.date)
      ).length;

      // 3. Count staged removals using the robust date check
      const removalsInMonth = Array.from(pendingChanges.removals).filter(removalId => {
          const entry = attendanceEntries.find(e => e.id === removalId);
          return entry && entry.practiceId === practice.id && isDateInCurrentMonth(entry.date);
      }).length;

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

