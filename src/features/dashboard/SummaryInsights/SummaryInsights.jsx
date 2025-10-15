import React, { useMemo, useState } from 'react';
import styles from './SummaryInsights.module.css';
import { usePractices } from '../../../contexts/PracticeContext/PracticeContext';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';
import { calculatePay } from '../../../utils/calculations';
import MetricCard from './MetricCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// --- Helper, Chart, and Breakdown Components (Unchanged) ---
const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val || 0);
const formatDateShort = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

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
    const [currentDate, setCurrentDate] = useState(new Date());

    const { summary, chartData } = useMemo(() => {
        // ... (Calculation logic remains completely unchanged)
        if (!practices || !entries) return { summary: {}, chartData: [] };
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
        const chartData = practiceBreakdown.map(p => ({
            name: p.practiceName,
            base: p.basePayOwed,
            production: Math.max(0, p.salary - p.basePayOwed),
        }));
        return {
            summary: { totalProduction, totalEstimatedPay, daysWorked, breakdown: practiceBreakdown, productionTrend: prevMonthProduction > 0 ? ((totalProduction - prevMonthProduction) / prevMonthProduction) * 100 : (totalProduction > 0 ? 100 : 0), payTrend: prevMonthPay > 0 ? ((totalEstimatedPay - prevMonthPay) / prevMonthPay) * 100 : (totalEstimatedPay > 0 ? 100 : 0) },
            chartData,
        };
    }, [practices, entries, currentDate]);

    // ** REWORK: Restored separate handlers for month and year **
    const handleMonthChange = (direction) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    const handleYearChange = (direction) => setCurrentDate(new Date(currentDate.getFullYear() + direction, currentDate.getMonth(), 1));
    
    return (
        <div className={styles.container}>
            {/* ** REWORK: Header is now a separate, full-width element ** */}
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

            {/* ** REWORK: Main content is a 2x2 grid for symmetry ** */}
            <div className={styles.mainGrid}>
                {/* --- Row 1 --- */}
                <MetricCard 
                    title="Total Production" 
                    value={formatCurrency(summary.totalProduction)}
                    trend={`${summary.productionTrend?.toFixed(0)}%`}
                    trendDirection={summary.productionTrend >= 0 ? 'positive' : 'negative'}
                >
                   {(summary.breakdown || []).map(p => (
                       <div key={p.practiceName} className={styles.simpleBreakdownItem}>
                           <span>{p.practiceName}</span>
                           <span className={styles.breakdownValue}>{formatCurrency(p.production)}</span>
                       </div>
                    ))}
                </MetricCard>

                <MetricCard title="Days Worked" value={summary.daysWorked || 0}>
                   {(summary.breakdown || []).map(p => (
                       <div key={p.practiceName} className={styles.simpleBreakdownItem}>
                           <span>{p.practiceName}</span>
                           <span className={styles.breakdownValue}>{p.daysWorked} days</span>
                       </div>
                    ))}
                </MetricCard>

                {/* --- Row 2 --- */}
                <MetricCard 
                    title="Calculated Pay" 
                    value={formatCurrency(summary.totalEstimatedPay)}
                    trend={`${summary.payTrend?.toFixed(0)}%`}
                    trendDirection={summary.payTrend >= 0 ? 'positive' : 'negative'}
                >
                   <PayBreakdownDetail breakdown={summary.breakdown || []} />
                </MetricCard>

                <div className={styles.chartCard}>
                   <h4 className={styles.chartTitle}>Pay Composition by Practice</h4>
                   <MonthlyComparisonChart data={chartData} />
               </div>
            </div>
        </div>
    );
};

export default SummaryInsights;