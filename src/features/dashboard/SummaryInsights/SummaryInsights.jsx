import React, { useMemo, useState } from 'react';
import styles from './SummaryInsights.module.css';
import { usePractices } from '../../../contexts/PracticeContext/PracticeContext';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';
import { useGoals } from '../../../contexts/GoalContext/GoalContext';
import { calculatePay } from '../../../utils/calculations';
import MetricCard from './MetricCard';
import { ChevronLeft, ChevronRight, Target, ArrowUp, ArrowDown } from 'lucide-react'; // Added Target, ArrowUp, ArrowDown
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// --- Helper, Chart, and Breakdown Components ---
const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val || 0);
const formatDateShort = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

// --- Chart and Breakdown Components (Keep existing) ---
const MonthlyComparisonChart = ({ data }) => (
    <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--ui-text-tertiary)' }} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} tick={{ fontSize: 11, fill: 'var(--ui-text-tertiary)' }} />
            <Tooltip
                cursor={{ fill: 'var(--ui-background-tertiary)' }}
                contentStyle={{ backgroundColor: 'var(--ui-background-secondary)', border: '1px solid var(--ui-border-secondary)', borderRadius: '8px' }}
                formatter={(value, name) => [formatCurrency(value), name]}
            />
            <Legend iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="base" stackId="a" name="Base Pay" fill="var(--brand-secondary)" barSize={25} />
            <Bar dataKey="production" stackId="a" name="Production Pay (Additional)" fill="var(--brand-primary)" radius={[4, 4, 0, 0]} barSize={25} />
        </BarChart>
    </ResponsiveContainer>
);

const PayBreakdownDetail = ({ breakdown }) => (
    <>
        {breakdown.map(p => (
            <div key={p.practiceName} className={styles.practiceBreakdown}>
                <div className={styles.practiceHeader}>
                    <span className={styles.practiceName}>{p.practiceName}</span>
                    <span className={styles.practiceSalary}>{formatCurrency(p.salary)}</span>
                </div>
                {p.payPeriods.filter(period => period.hasEntries).map((period, index) => (
                     <div key={index} className={styles.periodDetail}>
                         <span className={styles.periodDateRange}>{formatDateShort(period.start)} - {formatDateShort(period.end)}</span>
                         <div className={styles.payComponents}>
                             <div className={styles.payComponent} data-active={period.final === period.base && period.base > 0}>
                                 <span>Base:</span>
                                 <span>{formatCurrency(period.base)}</span>
                             </div>
                             <div className={styles.payComponent} data-active={period.final > period.base}>
                                 <span>Prod:</span>
                                 <span>{formatCurrency(period.prod)}</span>
                             </div>
                         </div>
                     </div>
                ))}
            </div>
        ))}
    </>
);


const SummaryInsights = () => {
    const { practices } = usePractices();
    const { entries } = useEntries();
    const { goals } = useGoals(); // Assuming useGoals context exists
    const [currentDate, setCurrentDate] = useState(new Date());

    const { summary, chartData } = useMemo(() => {
        // ... (Keep existing calculation logic including goal finding and progress) ...
        if (!practices || !entries || !goals) return { summary: {}, chartData: [] };

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const prevMonthDate = new Date(year, month - 1, 1);

        const getEntriesInPeriod = (targetYear, targetMonth) => entries.filter(e => {
            const dateStr = e.entryType === 'periodSummary' ? e.periodStartDate : e.date;
            if (!dateStr) return false;
            const date = new Date(`${dateStr}T00:00:00Z`);
            return date.getUTCFullYear() === targetYear && date.getUTCMonth() === targetMonth;
        });

        const entriesInCurrentMonth = getEntriesInPeriod(year, month);
        let totalProduction = 0, totalEstimatedPay = 0;
        const daysWorked = new Set(entriesInCurrentMonth.filter(e => e.entryType === 'attendanceRecord' || e.entryType === 'dailySummary').map(e => e.date)).size;
        const practiceBreakdown = practices.map(practice => {
            const practiceEntries = entriesInCurrentMonth.filter(e => e.practiceId === practice.id);
            const calcResult = calculatePay(practice, practiceEntries, year, month);
            totalProduction += calcResult.productionTotal;
            totalEstimatedPay += calcResult.calculatedPay;
            return { practiceName: practice.name, production: calcResult.productionTotal, salary: calcResult.calculatedPay, daysWorked: new Set(practiceEntries.map(e=>e.date)).size, payStructure: calcResult.payStructure, payPeriods: calcResult.payPeriods, basePayOwed: calcResult.basePayOwed, productionPayComponent: calcResult.productionPayComponent };
        }).filter(p => p.payPeriods.length > 0 && p.payPeriods.some(period => period.hasEntries));

        const entriesInPrevMonth = getEntriesInPeriod(prevMonthDate.getFullYear(), prevMonthDate.getMonth());
        const prevMonthProduction = entriesInPrevMonth.filter(e=>e.entryType !== 'attendanceRecord').reduce((s,e)=>s + (e.production || 0), 0);
        const prevMonthPay = practices.reduce((sum, p) => sum + calculatePay(p, entriesInPrevMonth.filter(e => e.practiceId === p.id), prevMonthDate.getFullYear(), prevMonthDate.getMonth()).calculatedPay, 0);

        const overallMonthlyProductionGoal = goals.find(g =>
            g.timePeriod === 'monthly' &&
            g.year === year &&
            g.month === month &&
            g.type === 'production' &&
            g.practiceId == null
        );
        const overallMonthlyIncomeGoal = goals.find(g =>
            g.timePeriod === 'monthly' &&
            g.year === year &&
            g.month === month &&
            g.type === 'income' &&
            g.practiceId == null
        );

        const productionGoalProgress = overallMonthlyProductionGoal?.targetAmount
            ? (totalProduction / overallMonthlyProductionGoal.targetAmount) * 100
            : null;

        const incomeGoalProgress = overallMonthlyIncomeGoal?.targetAmount
            ? (totalEstimatedPay / overallMonthlyIncomeGoal.targetAmount) * 100
            : null;

        const chartData = practiceBreakdown.map(p => ({
            name: p.practiceName,
            base: p.basePayOwed,
            production: Math.max(0, p.salary - p.basePayOwed),
        }));

        return {
            summary: {
                totalProduction,
                totalEstimatedPay,
                daysWorked,
                breakdown: practiceBreakdown,
                productionTrend: prevMonthProduction > 0 ? ((totalProduction - prevMonthProduction) / prevMonthProduction) * 100 : (totalProduction > 0 ? 100 : 0),
                payTrend: prevMonthPay > 0 ? ((totalEstimatedPay - prevMonthPay) / prevMonthPay) * 100 : (totalEstimatedPay > 0 ? 100 : 0),
                productionGoalTarget: overallMonthlyProductionGoal?.targetAmount,
                productionGoalProgress: productionGoalProgress,
                incomeGoalTarget: overallMonthlyIncomeGoal?.targetAmount,
                incomeGoalProgress: incomeGoalProgress,
            },
            chartData,
        };
    }, [practices, entries, goals, currentDate]);

    const handleMonthChange = (direction) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    const handleYearChange = (direction) => setCurrentDate(new Date(currentDate.getFullYear() + direction, currentDate.getMonth(), 1));

    // --- Helper to render goal info with status badge ---
    const renderGoalInfo = (target, progress) => {
        if (target == null || progress == null) return null; // No goal set

        const progressPercent = parseFloat(progress.toFixed(0));
        let status = 'onTrack';
        let statusText = `${progressPercent}%`;

        if (progressPercent < 50) { status = 'behind'; }
        else if (progressPercent < 90) { status = 'onTrack'; }
        else if (progressPercent < 100) { status = 'ahead'; }
        else { status = 'exceeded'; statusText = `+${(progressPercent - 100).toFixed(0)}%`; } // Show amount over 100%

        return (
            <div className={styles.goalInfo}>
                 <Target size={12} />
                 <span className={`${styles.goalStatusBadge} ${styles[status]}`}>
                     {statusText}
                 </span>
                 <span className={styles.goalTargetValue}>of {formatCurrency(target)}</span>
            </div>
        );
    };

    // --- NEW Helper to render trend info ---
    const renderTrendInfo = (trend, trendDirection) => {
        if (trend == null) return null; // No trend data

        const trendValue = `${trend.toFixed(0)}%`;
        const TrendIcon = trendDirection === 'positive' ? ArrowUp : ArrowDown;

        return (
             <div className={styles.trendInfo}>
                 <span className={`${styles.trendIndicator} ${styles[trendDirection]}`}>
                     <TrendIcon size={12} strokeWidth={3}/> {/* Bolder Icon */}
                     <span>{trendValue}</span>
                 </span>
                 <span className={styles.trendDescription}>vs last month</span>
            </div>
        );
    };


    return (
        <div className={styles.container}>
            <div className={styles.header}>
                 <h3 className={styles.sectionTitle}>Monthly Performance</h3>
                <div className={styles.navigators}>
                    <div className={styles.navigator}>
                        <button onClick={() => handleYearChange(-1)}><ChevronLeft size={16} /></button>
                        <span>{currentDate.getFullYear()}</span>
                        <button onClick={() => handleYearChange(1)}><ChevronRight size={16} /></button>
                    </div>
                    <div className={styles.navigator}>
                        <button onClick={() => handleMonthChange(-1)}><ChevronLeft size={16} /></button>
                        <span>{currentDate.toLocaleString('default', { month: 'long' })}</span>
                        <button onClick={() => handleMonthChange(1)}><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>

            <div className={styles.mainGrid}>
                {/* --- Production Card --- */}
                <MetricCard
                    title="Total Production"
                    value={formatCurrency(summary.totalProduction)}
                    // Pass rendered JSX elements for stacking
                    trendIndicator={renderTrendInfo(summary.productionTrend, summary.productionTrend >= 0 ? 'positive' : 'negative')}
                    goalIndicator={renderGoalInfo(summary.productionGoalTarget, summary.productionGoalProgress)}
                >
                   {(summary.breakdown || []).map(p => (
                       <div key={p.practiceName} className={styles.simpleBreakdownItem}>
                           <span>{p.practiceName}</span>
                           <span className={styles.breakdownValue}>{formatCurrency(p.production)}</span>
                       </div>
                    ))}
                </MetricCard>

                {/* --- Days Worked Card --- */}
                <MetricCard title="Days Worked" value={summary.daysWorked || 0}>
                   {(summary.breakdown || []).map(p => (
                       <div key={p.practiceName} className={styles.simpleBreakdownItem}>
                           <span>{p.practiceName}</span>
                           <span className={styles.breakdownValue}>{p.daysWorked} days</span>
                       </div>
                    ))}
                </MetricCard>

                {/* --- Calculated Pay Card --- */}
                <MetricCard
                    title="Calculated Pay"
                    value={formatCurrency(summary.totalEstimatedPay)}
                     // Pass rendered JSX elements for stacking
                    trendIndicator={renderTrendInfo(summary.payTrend, summary.payTrend >= 0 ? 'positive' : 'negative')}
                    goalIndicator={renderGoalInfo(summary.incomeGoalTarget, summary.incomeGoalProgress)}
                >
                   <PayBreakdownDetail breakdown={summary.breakdown || []} />
                </MetricCard>

                {/* --- Chart Card --- */}
                <div className={styles.chartCard}>
                   <h4 className={styles.chartTitle}>Pay Composition by Practice</h4>
                   <MonthlyComparisonChart data={chartData} />
               </div>
            </div>
        </div>
    );
};

export default SummaryInsights;