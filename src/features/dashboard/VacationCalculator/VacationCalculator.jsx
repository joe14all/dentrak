import React, { useState, useMemo } from 'react';
import styles from './VacationCalculator.module.css';
import { usePractices } from '../../../contexts/PracticeContext/PracticeContext';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';
import { Calendar, TrendingDown, DollarSign, Calculator } from 'lucide-react';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const VacationCalculator = () => {
  const { practices } = usePractices();
  const { entries } = useEntries();

  // State for date range and calculation mode
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [calculationMode, setCalculationMode] = useState('simple'); // 'simple' or 'advanced'
  const [selectedPractices, setSelectedPractices] = useState([]);

  // Analyze attendance patterns by day of week for each practice
  const attendancePatterns = useMemo(() => {
    if (!practices || !entries) return {};

    const patterns = {};

    // Look at the last 6 months of attendance data
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    practices
      .filter(p => p.status === 'active')
      .forEach(practice => {
        const attendanceByDayOfWeek = {
          0: 0, // Sunday
          1: 0, // Monday
          2: 0, // Tuesday
          3: 0, // Wednesday
          4: 0, // Thursday
          5: 0, // Friday
          6: 0, // Saturday
        };

        // Get attendance records for this practice
        const practiceAttendance = entries.filter(e => {
          if (e.practiceId !== practice.id || e.entryType !== 'attendanceRecord' || !e.date) {
            return false;
          }
          
          const date = new Date(`${e.date}T00:00:00Z`);
          return date >= sixMonthsAgo && date <= now;
        });

        // Count attendance by day of week
        practiceAttendance.forEach(entry => {
          const date = new Date(`${entry.date}T00:00:00Z`);
          const dayOfWeek = date.getUTCDay();
          attendanceByDayOfWeek[dayOfWeek]++;
        });

        patterns[practice.id] = attendanceByDayOfWeek;
      });

    return patterns;
  }, [practices, entries]);

  // Calculate vacation days and map them to practices
  const vacationDaysByPractice = useMemo(() => {
    if (!startDate || !endDate || !practices || Object.keys(attendancePatterns).length === 0) {
      return {};
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) return {};
    
    const daysByPractice = {};
    const current = new Date(start);
    
    // Initialize counters
    practices
      .filter(p => p.status === 'active')
      .forEach(practice => {
        daysByPractice[practice.id] = 0;
      });
    
    // Minimum occurrences to be considered a regular working day
    const MIN_OCCURRENCES = 3;
    
    // Iterate through vacation period
    while (current <= end) {
      const dayOfWeek = current.getDay();
      
      // Skip weekends (unless user has worked them regularly)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Find which practice(s) the user typically works at on this day of week
        let maxAttendance = 0;
        let primaryPracticeId = null;

        Object.entries(attendancePatterns).forEach(([practiceId, pattern]) => {
          // Only consider days with regular attendance (minimum threshold)
          if (pattern[dayOfWeek] >= MIN_OCCURRENCES && pattern[dayOfWeek] > maxAttendance) {
            maxAttendance = pattern[dayOfWeek];
            primaryPracticeId = parseInt(practiceId);
          }
        });

        // If we found regular historical attendance for this day of week, count it
        if (primaryPracticeId && maxAttendance >= MIN_OCCURRENCES) {
          daysByPractice[primaryPracticeId] = (daysByPractice[primaryPracticeId] || 0) + 1;
        }
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    return daysByPractice;
  }, [startDate, endDate, practices, attendancePatterns]);

  // Total vacation days across all practices
  const totalVacationDays = useMemo(() => {
    return Object.values(vacationDaysByPractice).reduce((sum, days) => sum + days, 0);
  }, [vacationDaysByPractice]);

  // Calculate lost income for each practice
  const vacationLossData = useMemo(() => {
    if (!practices || !entries || totalVacationDays === 0) return [];

    const activePractices = practices.filter(p => p.status === 'active');
    
    return activePractices.map(practice => {
      // Get vacation days specifically for this practice based on attendance patterns
      const practiceVacationDays = vacationDaysByPractice[practice.id] || 0;
      
      // Skip practices with no scheduled vacation days
      if (practiceVacationDays === 0) {
        return null;
      }

      // Simple calculation: base pay × vacation days for THIS practice
      const basePay = practice.basePay || practice.dailyGuarantee || 0;
      const simpleLoss = basePay * practiceVacationDays;

      // Advanced calculation: average production per day × appropriate percentage
      let advancedLoss = 0;
      let avgDailyProduction = 0;
      let avgDailyPay = 0;
      let workingDaysCount = 0;

      if (calculationMode === 'advanced') {
        // Get last 3 months of data for accurate average
        const now = new Date();
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);

        // Filter entries for this practice in the last 3 months
        const recentEntries = entries.filter(e => {
          if (e.practiceId !== practice.id) return false;
          
          const dateStr = e.date || e.periodStartDate;
          if (!dateStr) return false;
          
          const date = new Date(`${dateStr}T00:00:00Z`);
          return date >= threeMonthsAgo && date <= now;
        });

        // Get attendance days
        const attendanceByDate = {};
        recentEntries
          .filter(e => e.entryType === 'attendanceRecord' && e.date)
          .forEach(entry => {
            const date = entry.date;
            let dayValue = 1;
            if (entry.attendanceType === 'half-day') {
              dayValue = 0.5;
            }
            attendanceByDate[date] = Math.max(attendanceByDate[date] || 0, dayValue);
          });

        workingDaysCount = Object.values(attendanceByDate).reduce(
          (sum, val) => sum + val,
          0
        );

        // Get production data
        const periodSummaries = recentEntries.filter(
          e => e.entryType === 'periodSummary'
        );

        let productionEntries;
        if (periodSummaries.length > 0) {
          productionEntries = periodSummaries;
        } else {
          productionEntries = recentEntries.filter(
            e => e.entryType === 'dailySummary' || e.entryType === 'individualProcedure'
          );
        }

        const totalProduction = productionEntries.reduce(
          (sum, e) => sum + (e.production || 0),
          0
        );

        const totalCollection = productionEntries.reduce(
          (sum, e) => sum + (e.collection || 0),
          0
        );

        if (workingDaysCount > 0) {
          avgDailyProduction = totalProduction / workingDaysCount;
          
          // Calculate expected pay based on practice payment structure
          if (practice.paymentType === 'percentage') {
            const calculationBase = practice.calculationBase === 'collection' 
              ? totalCollection 
              : totalProduction;
            const avgDailyBase = calculationBase / workingDaysCount;
            avgDailyPay = avgDailyBase * ((practice.percentage || 0) / 100);
            // Apply daily guarantee if applicable
            avgDailyPay = Math.max(avgDailyPay, basePay);
          } else {
            // Employment type - use base pay
            avgDailyPay = basePay;
          }

          advancedLoss = avgDailyPay * practiceVacationDays;
        }
      }

      return {
        practice,
        vacationDays: practiceVacationDays,
        simpleLoss,
        advancedLoss,
        avgDailyProduction,
        avgDailyPay,
        workingDaysCount,
      };
    }).filter(data => data !== null && data.vacationDays > 0) // Only show practices with vacation days
      .filter(data => {
        // Filter by selected practices if any are selected
        if (selectedPractices.length === 0) return true;
        return selectedPractices.includes(data.practice.id);
      });
  }, [practices, entries, totalVacationDays, vacationDaysByPractice, calculationMode, selectedPractices]);

  const totalLoss = vacationLossData.reduce(
    (sum, data) => sum + (calculationMode === 'advanced' ? data.advancedLoss : data.simpleLoss),
    0
  );

  const handlePracticeToggle = (practiceId) => {
    setSelectedPractices(prev => {
      if (prev.includes(practiceId)) {
        return prev.filter(id => id !== practiceId);
      } else {
        return [...prev, practiceId];
      }
    });
  };

  const activePractices = practices?.filter(p => p.status === 'active') || [];

  // Helper to get day of week name
  const getDayName = (dayNum) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayNum];
  };

  // Get typical working days for a practice (minimum 3 occurrences to be considered regular)
  const getWorkingDays = (practiceId) => {
    const pattern = attendancePatterns[practiceId];
    if (!pattern) return [];
    
    // Only show days where you've worked at least 3 times in the last 6 months
    // This filters out one-off or irregular days
    const MIN_OCCURRENCES = 3;
    
    return Object.entries(pattern)
      .filter(([day, count]) => count >= MIN_OCCURRENCES)
      .map(([day, count]) => ({ day: parseInt(day), count }))
      .sort((a, b) => a.day - b.day);
  };
  
  // Get attendance count for a specific day at a practice
  const getAttendanceCount = (practiceId, dayNum) => {
    const pattern = attendancePatterns[practiceId];
    return pattern?.[dayNum] || 0;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <Calendar className={styles.icon} size={20} />
          <h3 className={styles.title}>Vacation Income Loss Calculator</h3>
        </div>
        <p className={styles.subtitle}>
          Plan ahead and understand the financial impact of time off. 
          Calculations based on your attendance history patterns at each practice.
        </p>
      </div>

      <div className={styles.controls}>
        <div className={styles.dateInputs}>
          <div className={styles.inputGroup}>
            <label htmlFor="startDate">Start Date</label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="endDate">End Date</label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>
          <div className={styles.daysDisplay}>
            <span className={styles.daysLabel}>Working Days:</span>
            <span className={styles.daysValue}>{totalVacationDays}</span>
          </div>
        </div>

        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeButton} ${calculationMode === 'simple' ? styles.active : ''}`}
            onClick={() => setCalculationMode('simple')}
          >
            <DollarSign size={16} />
            <span>Simple (Base Pay)</span>
          </button>
          <button
            className={`${styles.modeButton} ${calculationMode === 'advanced' ? styles.active : ''}`}
            onClick={() => setCalculationMode('advanced')}
          >
            <Calculator size={16} />
            <span>Advanced (Avg Production)</span>
          </button>
        </div>

        {activePractices.length > 1 && (
          <div className={styles.practiceFilter}>
            <label>Filter Practices:</label>
            <div className={styles.practiceCheckboxes}>
              {activePractices.map(practice => (
                <label key={practice.id} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedPractices.length === 0 || selectedPractices.includes(practice.id)}
                    onChange={() => handlePracticeToggle(practice.id)}
                  />
                  <span>{practice.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {totalVacationDays > 0 && (
        <>
          <div className={styles.totalLoss}>
            <TrendingDown className={styles.lossIcon} size={24} />
            <div className={styles.totalContent}>
              <span className={styles.totalLabel}>
                {calculationMode === 'simple' ? 'Total Estimated Loss' : 'Total Projected Loss'}
              </span>
              <span className={styles.totalValue}>{formatCurrency(totalLoss)}</span>
            </div>
          </div>

          <div className={styles.breakdown}>
            <h4 className={styles.breakdownTitle}>Practice Breakdown</h4>
            <div className={styles.practiceList}>
              {vacationLossData.map(({ practice, simpleLoss, advancedLoss, avgDailyProduction, avgDailyPay, workingDaysCount, vacationDays }) => (
                <div key={practice.id} className={styles.practiceCard}>
                  <div className={styles.practiceHeader}>
                    <h5 className={styles.practiceName}>{practice.name}</h5>
                    <span className={styles.practiceTag}>
                      {practice.paymentType === 'percentage' ? 'Percentage' : 'Employment'}
                    </span>
                  </div>

                  <div className={styles.workingDaysPattern}>
                    <span className={styles.patternLabel}>Typical Schedule (last 6 months):</span>
                    <div className={styles.dayTags}>
                      {getWorkingDays(practice.id).map(({ day, count }) => (
                        <span key={day} className={styles.dayTag} title={`Worked ${count} times on ${getDayName(day)}s`}>
                          {getDayName(day)} <span className={styles.dayCount}>×{count}</span>
                        </span>
                      ))}
                      {getWorkingDays(practice.id).length === 0 && (
                        <span className={styles.noDays}>No regular pattern (need 3+ days)</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.practiceMetrics}>
                    {calculationMode === 'simple' ? (
                      <>
                        <div className={styles.metric}>
                          <span className={styles.metricLabel}>Base/Guarantee Pay</span>
                          <span className={styles.metricValue}>
                            {formatCurrency(practice.basePay || practice.dailyGuarantee || 0)}/day
                          </span>
                        </div>
                        <div className={styles.metric}>
                          <span className={styles.metricLabel}>Your Vacation Days Here</span>
                          <span className={styles.metricValue}>{vacationDays} days</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={styles.metric}>
                          <span className={styles.metricLabel}>Avg Daily Production</span>
                          <span className={styles.metricValue}>
                            {avgDailyProduction > 0 ? formatCurrency(avgDailyProduction) : 'N/A'}
                          </span>
                        </div>
                        <div className={styles.metric}>
                          <span className={styles.metricLabel}>Avg Daily Pay</span>
                          <span className={styles.metricValue}>
                            {avgDailyPay > 0 ? formatCurrency(avgDailyPay) : 'N/A'}
                          </span>
                        </div>
                        <div className={styles.metric}>
                          <span className={styles.metricLabel}>Your Vacation Days Here</span>
                          <span className={styles.metricValue}>{vacationDays} days</span>
                        </div>
                        <div className={styles.metric}>
                          <span className={styles.metricLabel}>Based on Last</span>
                          <span className={styles.metricValue}>
                            {workingDaysCount > 0 ? `${Math.round(workingDaysCount)} days` : 'No data'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className={styles.practiceLoss}>
                    <span className={styles.lossLabel}>Estimated Loss:</span>
                    <span className={styles.lossValue}>
                      {formatCurrency(calculationMode === 'advanced' ? advancedLoss : simpleLoss)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.infoNote}>
            <p>
              <strong>📊 Smart Pattern Analysis:</strong> This calculator analyzes your attendance history 
              from the last 6 months to determine which days of the week you typically work at each practice. 
              Only days with <strong>3+ attendances</strong> are considered regular working days (shown with ×count). 
              This filters out irregular or one-time schedule changes.
            </p>
            {calculationMode === 'advanced' && (
              <p style={{ marginTop: '0.75rem' }}>
                <strong>Advanced Mode:</strong> Uses your average daily production and compensation
                structure over the last 3 months for more accurate projections.
              </p>
            )}
          </div>
        </>
      )}

      {totalVacationDays === 0 && (startDate || endDate) && (
        <div className={styles.emptyState}>
          <Calendar size={48} className={styles.emptyIcon} />
          <p>Select a vacation period to calculate potential income loss</p>
          {startDate && endDate && (
            <p className={styles.emptyHint}>
              No working days found. Make sure you have attendance history for the selected period's days of the week.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default VacationCalculator;
