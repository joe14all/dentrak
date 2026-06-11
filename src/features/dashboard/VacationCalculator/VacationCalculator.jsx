import React, { useState, useMemo } from 'react';
import styles from './VacationCalculator.module.css';
import { usePractices } from '../../../contexts/PracticeContext/PracticeContext';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';
import { Calendar, TrendingDown, DollarSign, Calculator, History, ChevronRight, BookOpen } from 'lucide-react';
import { useScheduleBlocks } from '../../../contexts/ScheduleBlockContext/ScheduleBlockContext';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Pure helper: counts which practice gets each weekday in a date range based on attendance patterns
const calcDaysByPractice = (startDateStr, endDateStr, activePractices, attendancePatterns) => {
  if (!startDateStr || !endDateStr || !activePractices.length || !Object.keys(attendancePatterns).length) return {};
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (end < start) return {};
  const daysByPractice = {};
  activePractices.forEach(p => { daysByPractice[p.id] = 0; });
  const MIN_OCCURRENCES = 3;
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      let maxAttendance = 0;
      let primaryPracticeId = null;
      Object.entries(attendancePatterns).forEach(([practiceId, pattern]) => {
        if (pattern[dayOfWeek] >= MIN_OCCURRENCES && pattern[dayOfWeek] > maxAttendance) {
          maxAttendance = pattern[dayOfWeek];
          primaryPracticeId = parseInt(practiceId);
        }
      });
      if (primaryPracticeId) {
        daysByPractice[primaryPracticeId] = (daysByPractice[primaryPracticeId] || 0) + 1;
      }
    }
    current.setDate(current.getDate() + 1);
  }
  return daysByPractice;
};

// Merge schedule blocks that are within GAP_DAYS of each other into a single vacation period
const GAP_DAYS = 3; // bridges Fri→Mon weekends
const consolidateIntoPeriods = (blocks) => {
  if (!blocks.length) return [];
  const sorted = [...blocks].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const periods = [];
  let current = { startDate: sorted[0].startDate, endDate: sorted[0].endDate, blocks: [sorted[0]] };
  for (let i = 1; i < sorted.length; i++) {
    const block = sorted[i];
    const gapMs = new Date(`${block.startDate}T00:00:00Z`) - new Date(`${current.endDate}T00:00:00Z`);
    const gap = gapMs / 86400000;
    if (gap <= GAP_DAYS) {
      current.blocks.push(block);
      if (block.endDate > current.endDate) current.endDate = block.endDate;
    } else {
      periods.push(current);
      current = { startDate: block.startDate, endDate: block.endDate, blocks: [block] };
    }
  }
  periods.push(current);
  return periods;
};

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
  const { scheduleBlocks } = useScheduleBlocks();

  // State for date range and calculation mode
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [calculationMode, setCalculationMode] = useState('simple'); // 'simple' or 'advanced'
  const [selectedPractices, setSelectedPractices] = useState([]);
  const [isBlockTableExpanded, setIsBlockTableExpanded] = useState(false);
  const [expandedPeriods, setExpandedPeriods] = useState(new Set());

  const togglePeriod = (id) => setExpandedPeriods(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

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
    const activePractices = (practices || []).filter(p => p.status === 'active');
    return calcDaysByPractice(startDate, endDate, activePractices, attendancePatterns);
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

  // ── Schedule Block Analysis ──────────────────────────────────────────────
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Consolidate all blocks into vacation periods (nearby blocks merged), then compute income impact
  const consolidatedPeriods = useMemo(() => {
    if (!scheduleBlocks.length || !practices) return [];
    const active = practices.filter(p => p.status === 'active');
    const periods = consolidateIntoPeriods(scheduleBlocks);

    return periods.map((period, idx) => {
      // Category based on the period's span vs today
      let category = 'upcoming';
      if (period.endDate < todayStr) category = 'past';
      else if (period.startDate <= todayStr) category = 'current';

      // Income impact for the whole period span
      const periodDays = calcDaysByPractice(period.startDate, period.endDate, active, attendancePatterns);
      let totalDays = 0;
      let totalLoss = 0;
      const byPractice = [];
      Object.entries(periodDays).forEach(([practiceId, days]) => {
        if (days > 0) {
          const practice = active.find(p => p.id === parseInt(practiceId));
          if (practice) {
            const basePay = practice.basePay || practice.dailyGuarantee || 0;
            const loss = basePay * days;
            totalDays += days;
            totalLoss += loss;
            byPractice.push({ practice, days, loss });
          }
        }
      });

      // Per-block summaries (for expanded view)
      const blockDetails = period.blocks.map(block => {
        const bDays = calcDaysByPractice(block.startDate, block.endDate, active, attendancePatterns);
        let bTotalDays = 0; let bTotalLoss = 0;
        const bByPractice = [];
        Object.entries(bDays).forEach(([pid, d]) => {
          if (d > 0) {
            const p = active.find(x => x.id === parseInt(pid));
            if (p) { const bp = p.basePay || p.dailyGuarantee || 0; bTotalDays += d; bTotalLoss += bp * d; bByPractice.push({ practice: p, days: d, loss: bp * d }); }
          }
        });
        return { block, totalDays: bTotalDays, totalLoss: bTotalLoss, byPractice: bByPractice };
      });

      return { id: `period-${idx}`, startDate: period.startDate, endDate: period.endDate, blocks: period.blocks, blockDetails, category, totalDays, totalLoss, byPractice };
    });
  }, [scheduleBlocks, practices, attendancePatterns, todayStr]);

  // Aggregate chips for the header
  const blockAggregates = useMemo(() => {
    const calc = (cat) => consolidatedPeriods.filter(p => p.category === cat).reduce(
      (acc, p) => ({ count: acc.count + 1, days: acc.days + p.totalDays, loss: acc.loss + p.totalLoss }),
      { count: 0, days: 0, loss: 0 }
    );
    return { current: calc('current'), upcoming: calc('upcoming'), past: calc('past') };
  }, [consolidatedPeriods]);

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

      {/* ── Schedule Block Analysis ── */}
      <div className={styles.blockAnalysis}>

        {/* Summary header row — always visible */}
        <div className={styles.blockAnalysisHeader}>
          <History size={16} className={styles.blockAnalysisIcon} />
          <h4 className={styles.blockAnalysisTitle}>Schedule Blocks</h4>

          {scheduleBlocks.length > 0 && (
            <div className={styles.blockSummaryStats}>
              {blockAggregates.current.count > 0 && (
                <span className={styles.blockStatChip} data-type="current">
                  Now · {blockAggregates.current.days}d · {formatCurrency(blockAggregates.current.loss)}
                </span>
              )}
              {blockAggregates.upcoming.count > 0 && (
                <span className={styles.blockStatChip} data-type="upcoming">
                  {blockAggregates.upcoming.count} upcoming · {blockAggregates.upcoming.days}d · {formatCurrency(blockAggregates.upcoming.loss)}
                </span>
              )}
              {blockAggregates.past.count > 0 && (
                <span className={styles.blockStatChip} data-type="past">
                  {blockAggregates.past.count} past · {formatCurrency(blockAggregates.past.loss)}
                </span>
              )}
            </div>
          )}

          {scheduleBlocks.length > 0 && (
            <button
              className={styles.blockToggleBtn}
              onClick={() => setIsBlockTableExpanded(v => !v)}
            >
              {isBlockTableExpanded ? 'Hide periods' : 'Show all periods'}
            </button>
          )}
        </div>

        {/* Consolidated vacation periods — toggled */}
        {scheduleBlocks.length === 0 ? (
          <div className={styles.noBlocks}>
            <BookOpen size={16} />
            <span>No blocks yet — add them in the Attendance Tracker to see their impact here.</span>
          </div>
        ) : isBlockTableExpanded && (
          <div className={styles.blockTable}>
            {[
              { label: 'Current',  cat: 'current',  rowClass: styles.rowCurrent },
              { label: 'Upcoming', cat: 'upcoming', rowClass: styles.rowFuture  },
              { label: 'Past',     cat: 'past',     rowClass: styles.rowPast    },
            ].map(({ label, cat, rowClass }) => {
              const periods = consolidatedPeriods.filter(p => p.category === cat);
              if (!periods.length) return null;
              return (
                <React.Fragment key={cat}>
                  <div className={styles.blockGroupHeader}>{label}</div>
                  {periods.map(period => {
                    const isExpanded = expandedPeriods.has(period.id);
                    const hasMultiple = period.blocks.length > 1;
                    return (
                      <React.Fragment key={period.id}>
                        {/* Period row */}
                        <div
                          className={`${styles.blockRow} ${styles.periodRow} ${rowClass} ${hasMultiple ? styles.periodRowClickable : ''}`}
                          onClick={() => hasMultiple && togglePeriod(period.id)}
                        >
                          <div className={styles.blockRowLeft}>
                            {hasMultiple && (
                              <span className={styles.periodChevron}>{isExpanded ? '▾' : '▸'}</span>
                            )}
                            <div className={styles.periodRowDates}>
                              <span className={styles.blockRowDates}>
                                {formatDate(period.startDate)}
                                {period.startDate !== period.endDate && <> — {formatDate(period.endDate)}</>}
                              </span>
                              {hasMultiple && (
                                <span className={styles.periodBlockCount}>{period.blocks.length} blocks</span>
                              )}
                              {!hasMultiple && period.blocks[0]?.reason && (
                                <span className={styles.blockRowReason}>{period.blocks[0].reason}</span>
                              )}
                            </div>
                          </div>

                          <div className={styles.blockRowMeta}>
                            <span className={styles.blockRowDays}>{period.totalDays}d</span>
                            {period.byPractice.map(({ practice, days, loss }) => (
                              <span key={practice.id} className={styles.blockPracticePill} title={practice.name}>
                                {practice.name.split(' ')[0]} {days}d&nbsp;·&nbsp;{formatCurrency(loss)}
                              </span>
                            ))}
                            {period.totalDays === 0 && <span className={styles.blockNoPill}>no working days</span>}
                          </div>

                          <div className={styles.blockRowRight}>
                            <span className={styles.blockRowLoss}>{formatCurrency(period.totalLoss)}</span>
                            <button
                              className={styles.loadBlockBtn}
                              title="Load full period into Calculator"
                              onClick={(e) => {
                                e.stopPropagation();
                                setStartDate(period.startDate);
                                setEndDate(period.endDate);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                            >↗</button>
                          </div>
                        </div>

                        {/* Expanded: individual blocks within the period */}
                        {isExpanded && period.blockDetails.map(({ block, totalDays: bDays, totalLoss: bLoss, byPractice: bByPractice }) => (
                          <div key={block.id} className={`${styles.blockRow} ${styles.blockSubRow} ${rowClass}`}>
                            <div className={styles.blockRowLeft}>
                              <span className={styles.blockSubIndent} />
                              <div className={styles.periodRowDates}>
                                <span className={styles.blockRowDates}>
                                  {formatDate(block.startDate)}
                                  {block.startDate !== block.endDate && <> — {formatDate(block.endDate)}</>}
                                </span>
                                {block.reason && <span className={styles.blockRowReason}>{block.reason}</span>}
                              </div>
                            </div>
                            <div className={styles.blockRowMeta}>
                              <span className={styles.blockRowDays}>{bDays}d</span>
                              {bByPractice.map(({ practice, days, loss }) => (
                                <span key={practice.id} className={styles.blockPracticePill} title={practice.name}>
                                  {practice.name.split(' ')[0]} {days}d&nbsp;·&nbsp;{formatCurrency(loss)}
                                </span>
                              ))}
                            </div>
                            <div className={styles.blockRowRight}>
                              <span className={styles.blockRowLoss}>{formatCurrency(bLoss)}</span>
                              <button
                                className={styles.loadBlockBtn}
                                title="Load this block into Calculator"
                                onClick={() => { setStartDate(block.startDate); setEndDate(block.endDate); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                              >↗</button>
                            </div>
                          </div>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VacationCalculator;
