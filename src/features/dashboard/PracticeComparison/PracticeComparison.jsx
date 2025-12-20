import React, { useMemo, useState } from 'react';
import styles from './PracticeComparison.module.css';
import { usePractices } from '../../../contexts/PracticeContext/PracticeContext';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';
import { usePayments } from '../../../contexts/PaymentContext/PaymentContext';
import { useNavigation } from '../../../contexts/NavigationContext/NavigationContext';
import { comparePractices, calculateContributions } from '../../../utils/practiceComparison';
import { 
  TrendingUp, 
  Award, 
  BarChart3, 
  Calendar,
  DollarSign,
  Percent,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const formatPercent = (value) => `${value.toFixed(1)}%`;

const PracticeComparison = () => {
  const { practices, practicesVersion } = usePractices();
  const { entries } = useEntries();
  const { payments } = usePayments();
  const { setActivePage } = useNavigation();
  const [showDetails, setShowDetails] = useState(false);
  const [timeRange, setTimeRange] = useState('ytd'); // ytd, last3months, last6months, all

  // Calculate date range based on selected time range
  const dateRange = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    switch (timeRange) {
      case 'ytd':
        return {
          startDate: new Date(currentYear, 0, 1).toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0],
        };
      case 'last3months': {
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return {
          startDate: threeMonthsAgo.toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0],
        };
      }
      case 'last6months': {
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        return {
          startDate: sixMonthsAgo.toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0],
        };
      }
      case 'all':
      default:
        return {
          startDate: null,
          endDate: null,
        };
    }
  }, [timeRange]);

  // Compare practices
  const comparison = useMemo(() => {
    return comparePractices(practices, entries, payments, {
      ...dateRange,
      activeOnly: true,
    });
  }, [practices, entries, payments, dateRange, practicesVersion]);

  // Add contribution percentages
  const metricsWithContributions = useMemo(() => {
    return calculateContributions(comparison.metrics);
  }, [comparison.metrics]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return metricsWithContributions.map(m => ({
      name: m.practiceName.length > 15 ? m.practiceName.substring(0, 15) + '...' : m.practiceName,
      fullName: m.practiceName,
      totalPay: m.totalCalculatedPay,
      avgPerDay: m.avgPayPerDay,
      daysWorked: m.daysWorked,
    }));
  }, [metricsWithContributions]);

  // Pie chart data for income contribution
  const pieData = useMemo(() => {
    return metricsWithContributions.map(m => ({
      name: m.practiceName,
      value: m.totalCalculatedPay,
      percentage: m.payContribution,
    }));
  }, [metricsWithContributions]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

  if (comparison.metrics.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <BarChart3 size={20} />
          <h3>Practice Comparison</h3>
        </div>
        <div className={styles.emptyState}>
          <p>No practice data available for comparison</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <BarChart3 size={20} />
          <h3>Practice Comparison</h3>
        </div>
        <div className={styles.headerRight}>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className={styles.timeRangeSelect}
          >
            <option value="ytd">Year to Date</option>
            <option value="last3months">Last 3 Months</option>
            <option value="last6months">Last 6 Months</option>
            <option value="all">All Time</option>
          </select>
          <button 
            className={styles.viewDetailsButton}
            onClick={() => setActivePage('Practice Comparison')}
          >
            View Detailed Analysis
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Key Insights */}
      <div className={styles.insightsGrid}>
        {comparison.insights.slice(0, 3).map((insight, idx) => (
          <div key={idx} className={styles.insightCard}>
            <div className={styles.insightIcon}>
              {insight.type === 'top_earner' && <DollarSign size={20} />}
              {insight.type === 'best_daily_rate' && <TrendingUp size={20} />}
              {insight.type === 'most_efficient' && <Percent size={20} />}
              {insight.type === 'most_active' && <Calendar size={20} />}
            </div>
            <div className={styles.insightContent}>
              <span className={styles.insightLabel}>{insight.title}</span>
              <span className={styles.insightPractice}>{insight.practice}</span>
              <span className={styles.insightValue}>
                {insight.isPercentage 
                  ? `${insight.value.toFixed(1)}%` 
                  : typeof insight.value === 'number' && insight.value > 1000
                    ? formatCurrency(insight.value)
                    : insight.value
                }
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Chart */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Income by Practice</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              labelFormatter={(label) => {
                const item = chartData.find(d => d.name === label);
                return item?.fullName || label;
              }}
              contentStyle={{
                background: 'var(--ui-background-primary)',
                border: '1px solid var(--ui-border-primary)',
                borderRadius: '0.5rem',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="totalPay" name="Total Income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Income Distribution Pie Chart */}
      {pieData.length > 1 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Income Distribution</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ percentage }) => `${percentage.toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
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
                formatter={(value) => value.length > 20 ? value.substring(0, 20) + '...' : value}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Metrics Table */}
      <div className={styles.section}>
        <button
          className={styles.toggleButton}
          onClick={() => setShowDetails(!showDetails)}
        >
          <span>Detailed Metrics</span>
          {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {showDetails && (
          <div className={styles.tableContainer}>
            <table className={styles.comparisonTable}>
              <thead>
                <tr>
                  <th>Practice</th>
                  <th>Days</th>
                  <th>Total Pay</th>
                  <th>Avg/Day</th>
                  <th>Production</th>
                  <th>Effective Rate</th>
                </tr>
              </thead>
              <tbody>
                {metricsWithContributions
                  .sort((a, b) => b.totalCalculatedPay - a.totalCalculatedPay)
                  .map((metric) => (
                    <tr key={metric.practiceId}>
                      <td className={styles.practiceName}>{metric.practiceName}</td>
                      <td>{metric.daysWorked}</td>
                      <td className={styles.currency}>{formatCurrency(metric.totalCalculatedPay)}</td>
                      <td className={styles.currency}>{formatCurrency(metric.avgPayPerDay)}</td>
                      <td className={styles.currency}>{formatCurrency(metric.totalProduction)}</td>
                      <td className={styles.percentage}>{formatPercent(metric.effectiveRate)}</td>
                    </tr>
                  ))}
                <tr className={styles.totalRow}>
                  <td>Total</td>
                  <td>{comparison.totals.daysWorked}</td>
                  <td className={styles.currency}>{formatCurrency(comparison.totals.totalCalculatedPay)}</td>
                  <td>-</td>
                  <td className={styles.currency}>{formatCurrency(comparison.totals.totalProduction)}</td>
                  <td>-</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeComparison;
