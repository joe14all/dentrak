import React, { useMemo, useState } from 'react';
import styles from './CashFlowForecast.module.css';
import { usePractices } from '../../../contexts/PracticeContext/PracticeContext';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';
import {
  projectFutureIncome,
  aggregateMonthlyProjections,
  simulateScenario,
} from '../../../utils/cashFlowForecasting';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  AlertTriangle,
  ChevronRight,
  Info,
} from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const formatMonthYear = (month, year) => {
  return new Date(year, month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

// Sub-component: Upcoming Payment Timeline
const UpcomingPayments = ({ projections }) => {
  const upcomingPayments = projections
    .slice(0, 5)
    .filter(p => p.estimatedPay > 0);

  if (upcomingPayments.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Info size={32} />
        <p>No upcoming payments projected</p>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className={styles.paymentTimeline}>
      {upcomingPayments.map((payment, index) => {
        const daysUntil = Math.ceil((payment.dueDate - today) / (1000 * 60 * 60 * 24));
        const isOverdue = daysUntil < 0;
        const isNearTerm = daysUntil >= 0 && daysUntil <= 7;

        return (
          <div
            key={index}
            className={`${styles.paymentItem} ${isOverdue ? styles.overdue : ''} ${
              isNearTerm ? styles.nearTerm : ''
            }`}
          >
            <div className={styles.paymentDate}>
              <Calendar size={16} />
              <div>
                <div className={styles.dateText}>{formatDate(payment.dueDate)}</div>
                <div className={styles.daysText}>
                  {isOverdue
                    ? `${Math.abs(daysUntil)} days ago`
                    : daysUntil === 0
                    ? 'Today'
                    : `in ${daysUntil} days`}
                </div>
              </div>
            </div>
            <div className={styles.paymentAmount}>
              <div className={styles.amount}>{formatCurrency(payment.estimatedPay)}</div>
              <div className={styles.confidence}>
                {payment.confidence === 'high' ? '●' : '◐'} {payment.confidence}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Sub-component: Monthly Projections Chart
const MonthlyProjections = ({ monthlyData }) => {
  if (!monthlyData || monthlyData.length === 0) {
    return (
      <div className={styles.emptyState}>
        <TrendingUp size={32} />
        <p>No projection data available</p>
      </div>
    );
  }

  const maxAmount = Math.max(...monthlyData.map(m => m.totalProjected));

  return (
    <div className={styles.chartContainer}>
      {monthlyData.slice(0, 6).map((monthData, index) => {
        const heightPercent = (monthData.totalProjected / maxAmount) * 100;

        return (
          <div key={index} className={styles.barWrapper}>
            <div className={styles.bar}>
              <div
                className={styles.barFill}
                style={{ height: `${heightPercent}%` }}
                title={formatCurrency(monthData.totalProjected)}
              >
                <span className={styles.barLabel}>
                  {formatCurrency(monthData.totalProjected)}
                </span>
              </div>
            </div>
            <div className={styles.barLabel}>
              {formatMonthYear(monthData.month, monthData.year).split(' ')[0]}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Sub-component: What-If Scenario
const WhatIfScenario = ({ practice, historicalEntries }) => {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 34)).toISOString().split('T')[0]
  );
  const [showResults, setShowResults] = useState(false);

  const scenario = useMemo(() => {
    if (!showResults) return null;
    
    return simulateScenario(
      practice,
      historicalEntries,
      {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
      3
    );
  }, [practice, historicalEntries, startDate, endDate, showResults]);

  const handleCalculate = () => {
    setShowResults(true);
  };

  return (
    <div className={styles.whatIfContainer}>
      <h4>What-If Scenario</h4>
      <p className={styles.whatIfDescription}>
        See how time off affects your projected income
      </p>

      <div className={styles.whatIfInputs}>
        <div className={styles.inputGroup}>
          <label>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => {
              setStartDate(e.target.value);
              setShowResults(false);
            }}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={e => {
              setEndDate(e.target.value);
              setShowResults(false);
            }}
          />
        </div>
      </div>

      <button onClick={handleCalculate} className={styles.calculateButton}>
        Calculate Impact
      </button>

      {showResults && scenario && (
        <div className={styles.scenarioResults}>
          <div className={styles.scenarioRow}>
            <span>Baseline (3 months):</span>
            <strong>{formatCurrency(scenario.summary.baselineTotal)}</strong>
          </div>
          <div className={styles.scenarioRow}>
            <span>With time off:</span>
            <strong>{formatCurrency(scenario.summary.scenarioTotal)}</strong>
          </div>
          <div className={`${styles.scenarioRow} ${styles.impact}`}>
            <span>Impact:</span>
            <strong className={styles.impactAmount}>
              -{formatCurrency(scenario.summary.difference)}
              <span className={styles.impactPercent}>
                ({scenario.summary.percentageImpact}%)
              </span>
            </strong>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Component
const CashFlowForecast = () => {
  const { practices, practicesVersion } = usePractices();
  const { entries } = useEntries();
  const [selectedPracticeId, setSelectedPracticeId] = useState('all');
  const [forecastMonths, setForecastMonths] = useState(3);

  const activePractices = useMemo(() => {
    return (practices || []).filter(p => p.status === 'active');
  }, [practices, practicesVersion]);

  const entriesByPractice = useMemo(() => {
    const grouped = {};
    activePractices.forEach(practice => {
      grouped[practice.id] = (entries || []).filter(e => e.practiceId === practice.id);
    });
    return grouped;
  }, [activePractices, entries]);

  const selectedPractice = useMemo(() => {
    if (selectedPracticeId === 'all') return null;
    return activePractices.find(p => p.id === parseInt(selectedPracticeId, 10));
  }, [selectedPracticeId, activePractices]);

  const projections = useMemo(() => {
    if (selectedPractice) {
      return projectFutureIncome(
        selectedPractice,
        entriesByPractice[selectedPractice.id] || [],
        [],
        new Date(),
        forecastMonths
      );
    }
    return [];
  }, [selectedPractice, entriesByPractice, forecastMonths]);

  // Calculate historical stats for the selected practice
  const historicalStats = useMemo(() => {
    if (!selectedPractice) return null;
    
    const entries = entriesByPractice[selectedPractice.id] || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    
    const recentEntries = entries.filter(e => {
      const dateStr = e.date || e.periodStartDate;
      if (!dateStr) return false;
      const entryDate = new Date(`${dateStr}T00:00:00Z`);
      return entryDate >= cutoffDate;
    });
    
    const workDates = new Set();
    recentEntries.forEach(e => {
      const dateStr = e.date || e.periodStartDate;
      if (dateStr) workDates.add(dateStr);
    });
    
    const financialEntries = recentEntries.filter(e =>
      e.entryType === 'dailySummary' ||
      e.entryType === 'periodSummary' ||
      e.entryType === 'individualProcedure'
    );
    
    const totalProduction = financialEntries.reduce((sum, e) => sum + (e.production || 0), 0);
    const totalCollection = financialEntries.reduce((sum, e) => sum + (e.collection || 0), 0);
    const daysWorked = workDates.size;
    
    return {
      daysWorked,
      avgProduction: daysWorked > 0 ? totalProduction / daysWorked : 0,
      avgCollection: daysWorked > 0 ? totalCollection / daysWorked : 0,
      avgDaysPerWeek: daysWorked > 0 ? (daysWorked / 12.86) : 0, // 90 days ≈ 12.86 weeks
    };
  }, [selectedPractice, entriesByPractice]);

  const monthlyData = useMemo(() => {
    return aggregateMonthlyProjections(activePractices, entriesByPractice, forecastMonths);
  }, [activePractices, entriesByPractice, forecastMonths]);

  const totalProjected = useMemo(() => {
    return monthlyData.reduce((sum, m) => sum + m.totalProjected, 0);
  }, [monthlyData]);

  if (!activePractices || activePractices.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <TrendingUp size={24} />
            <h3>Cash Flow Forecast</h3>
          </div>
        </div>
        <div className={styles.emptyState}>
          <AlertTriangle size={48} />
          <p>No active practices found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <TrendingUp size={24} />
          <h3>Cash Flow Forecast</h3>
        </div>
        <div className={styles.controls}>
          <select
            value={selectedPracticeId}
            onChange={e => setSelectedPracticeId(e.target.value)}
            className={styles.practiceSelect}
          >
            <option value="all">All Practices</option>
            {activePractices.map(practice => (
              <option key={practice.id} value={practice.id}>
                {practice.name}
              </option>
            ))}
          </select>
          <select
            value={forecastMonths}
            onChange={e => setForecastMonths(parseInt(e.target.value, 10))}
            className={styles.periodSelect}
          >
            <option value={1}>1 Month</option>
            <option value={3}>3 Months</option>
            <option value={6}>6 Months</option>
            <option value={12}>12 Months</option>
          </select>
        </div>
      </div>

      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <DollarSign size={20} />
          <div>
            <div className={styles.cardLabel}>Total Projected</div>
            <div className={styles.cardValue}>{formatCurrency(totalProjected)}</div>
            <div className={styles.cardSubtext}>Next {forecastMonths} months</div>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <Calendar size={20} />
          <div>
            <div className={styles.cardLabel}>Upcoming Payments</div>
            <div className={styles.cardValue}>{projections.filter(p => p.estimatedPay > 0).length}</div>
            <div className={styles.cardSubtext}>
              {selectedPracticeId === 'all' ? 'All practices' : 'Selected practice'}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h4>Monthly Income Projection</h4>
          <MonthlyProjections monthlyData={monthlyData} />
        </div>

        {selectedPractice && (
          <>
            <div className={styles.section}>
              <h4>Upcoming Payments - {selectedPractice.name}</h4>
              {historicalStats && historicalStats.daysWorked > 0 && (
                <div className={styles.forecastBasis}>
                  <Info size={14} />
                  <span>
                    Based on last 90 days: {historicalStats.daysWorked} days worked 
                    ({historicalStats.avgDaysPerWeek.toFixed(1)} days/week avg) · 
                    Avg Production: {formatCurrency(historicalStats.avgProduction)}/day
                  </span>
                </div>
              )}
              <UpcomingPayments projections={projections} />
            </div>

            <div className={styles.section}>
              <WhatIfScenario
                practice={selectedPractice}
                historicalEntries={entriesByPractice[selectedPractice.id] || []}
              />
            </div>
          </>
        )}

        {selectedPracticeId === 'all' && (
          <div className={styles.infoBox}>
            <Info size={16} />
            <p>Select a specific practice to see detailed payment timeline and what-if scenarios</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashFlowForecast;
