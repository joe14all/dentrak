import React, { useMemo, useState } from 'react';
import styles from './TaxPlanning.module.css';
import { useExpenses } from '../../../contexts/ExpenseContext/ExpenseContext';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';
import { usePractices } from '../../../contexts/PracticeContext/PracticeContext';
import { calculatePay } from '../../../utils/calculations';
import { 
  calculateQuarterlyEstimates,
  projectYearEndTaxes 
} from '../../../utils/taxCalculations';
import { 
  Receipt, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  AlertCircle,
  PieChart,
  Calculator,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const formatPercent = (value) => `${value.toFixed(1)}%`;

const TaxPlanning = () => {
  const { expenses } = useExpenses();
  const { entries } = useEntries();
  const { practices, practicesVersion } = usePractices();
  const [showDetails, setShowDetails] = useState(false);
  const [filingStatus, setFilingStatus] = useState('single');

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Calculate year-to-date income using the same method as YtdAnalytics
  // This uses calculated pay based on production/collection, not just payments
  const incomeYTD = useMemo(() => {
    if (!entries || !practices || entries.length === 0 || practices.length === 0) {
      return 0;
    }

    let ytdCalculatedPayTotal = 0;

    // Loop through each month of the year up to current month
    for (let monthIndex = 0; monthIndex <= currentMonth - 1; monthIndex++) {
      const monthEntries = entries.filter(e => {
        const dateStr = e.entryType === 'periodSummary' ? e.periodStartDate : e.date;
        if (!dateStr) return false;
        const date = new Date(`${dateStr}T00:00:00Z`);
        return date.getUTCFullYear() === currentYear && date.getUTCMonth() === monthIndex;
      });

      // Calculate pay for each practice for this month
      const monthCalculatedPay = practices.reduce((sum, practice) => {
        const practiceEntries = monthEntries.filter(e => e.practiceId === practice.id);
        if (practiceEntries.length === 0) return sum;

        const payResult = calculatePay(practice, practiceEntries, currentYear, monthIndex);
        return sum + payResult.calculatedPay;
      }, 0);

      ytdCalculatedPayTotal += monthCalculatedPay;
    }

    return ytdCalculatedPayTotal;
  }, [entries, practices, currentYear, currentMonth, practicesVersion]);

  // Calculate year-to-date expenses
  const expensesYTD = useMemo(() => {
    return expenses
      .filter(e => {
        const expenseYear = new Date(e.date).getFullYear();
        return expenseYear === currentYear && e.taxDeductible !== false;
      })
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [expenses, currentYear]);

  // Calculate expense breakdown by category
  const expensesByCategory = useMemo(() => {
    const categoryTotals = {};
    
    expenses
      .filter(e => {
        const expenseYear = new Date(e.date).getFullYear();
        return expenseYear === currentYear && e.taxDeductible !== false;
      })
      .forEach(expense => {
        const category = expense.category || 'Other';
        categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
      });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 categories
  }, [expenses, currentYear]);

  // Project year-end taxes
  const taxProjection = useMemo(() => {
    return projectYearEndTaxes({
      incomeYTD,
      expensesYTD,
      monthsElapsed: currentMonth,
      filingStatus,
    });
  }, [incomeYTD, expensesYTD, currentMonth, filingStatus]);

  // Calculate quarterly estimates
  const quarterlyEstimates = useMemo(() => {
    return calculateQuarterlyEstimates(taxProjection.totalTax);
  }, [taxProjection.totalTax]);

  // Determine which quarter we're in
  const currentQuarter = Math.ceil(currentMonth / 3);

  // Chart colors
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Calculator size={20} />
          <h3>Tax Planning</h3>
        </div>
        <select
          value={filingStatus}
          onChange={(e) => setFilingStatus(e.target.value)}
          className={styles.filingSelect}
        >
          <option value="single">Single</option>
          <option value="married">Married</option>
        </select>
      </div>

      {/* YTD Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.cardIcon} style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
            <DollarSign size={20} style={{ color: '#3b82f6' }} />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Income YTD</span>
            <span className={styles.cardValue}>{formatCurrency(incomeYTD)}</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardIcon} style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <Receipt size={20} style={{ color: '#10b981' }} />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Deductions YTD</span>
            <span className={styles.cardValue}>{formatCurrency(expensesYTD)}</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardIcon} style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
            <TrendingUp size={20} style={{ color: '#ef4444' }} />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Est. Tax Liability</span>
            <span className={styles.cardValue}>{formatCurrency(taxProjection.totalTax)}</span>
            <span className={styles.cardSubtext}>
              {formatPercent(taxProjection.effectiveTaxRate)} effective rate
            </span>
          </div>
        </div>
      </div>

      {/* Quarterly Estimates */}
      {quarterlyEstimates.shouldPayQuarterly && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Calendar size={16} />
            <h4>Quarterly Estimated Payments</h4>
          </div>
          <div className={styles.quarterlyGrid}>
            {quarterlyEstimates.quarters.map((q, idx) => {
              const isPast = idx + 1 < currentQuarter;
              const isCurrent = idx + 1 === currentQuarter;
              
              return (
                <div 
                  key={q.quarter} 
                  className={`${styles.quarterCard} ${isPast ? styles.past : ''} ${isCurrent ? styles.current : ''}`}
                >
                  <div className={styles.quarterHeader}>
                    <span className={styles.quarterLabel}>{q.quarter}</span>
                    {isCurrent && <span className={styles.currentBadge}>Current</span>}
                  </div>
                  <div className={styles.quarterAmount}>{formatCurrency(q.payment)}</div>
                  <div className={styles.quarterDue}>Due: {q.dueDate}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expense Breakdown */}
      {expensesByCategory.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <PieChart size={16} />
            <h4>Top Deduction Categories YTD</h4>
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPie>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    background: 'var(--ui-background-primary)',
                    border: '1px solid var(--ui-border-primary)',
                    borderRadius: '0.5rem',
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value, entry) => `${value}: ${formatCurrency(entry.payload.value)}`}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tax Breakdown Details */}
      <div className={styles.section}>
        <button
          className={styles.toggleButton}
          onClick={() => setShowDetails(!showDetails)}
        >
          <span>Tax Calculation Details</span>
          {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {showDetails && (
          <div className={styles.detailsGrid}>
            <div className={styles.detailRow}>
              <span>Projected Annual Income</span>
              <span className={styles.detailValue}>{formatCurrency(taxProjection.projectedAnnualIncome)}</span>
            </div>
            <div className={styles.detailRow}>
              <span>Business Expenses</span>
              <span className={styles.detailValue}>-{formatCurrency(taxProjection.businessExpenses)}</span>
            </div>
            <div className={styles.detailRow}>
              <span>Self-Employment Tax</span>
              <span className={styles.detailValue}>{formatCurrency(taxProjection.selfEmploymentTax)}</span>
            </div>
            <div className={styles.detailRow}>
              <span>SE Tax Deduction</span>
              <span className={styles.detailValue}>-{formatCurrency(taxProjection.selfEmploymentTaxDeduction)}</span>
            </div>
            <div className={styles.detailRow}>
              <span>Adjusted Gross Income</span>
              <span className={styles.detailValue}>{formatCurrency(taxProjection.agi)}</span>
            </div>
            <div className={styles.detailRow}>
              <span>Standard Deduction</span>
              <span className={styles.detailValue}>-{formatCurrency(taxProjection.standardDeduction)}</span>
            </div>
            <div className={styles.detailRow}>
              <span>Taxable Income</span>
              <span className={styles.detailValue}>{formatCurrency(taxProjection.taxableIncome)}</span>
            </div>
            <div className={`${styles.detailRow} ${styles.highlight}`}>
              <span>Federal Income Tax</span>
              <span className={styles.detailValue}>{formatCurrency(taxProjection.federalIncomeTax)}</span>
            </div>
            <div className={`${styles.detailRow} ${styles.total}`}>
              <span>Total Tax Liability</span>
              <span className={styles.detailValue}>{formatCurrency(taxProjection.totalTax)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className={styles.disclaimer}>
        <AlertCircle size={14} />
        <span>
          This is an estimate based on {currentYear} tax rates. Consult a tax professional for personalized advice.
        </span>
      </div>
    </div>
  );
};

export default TaxPlanning;
