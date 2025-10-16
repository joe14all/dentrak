import React, { useMemo, useState } from 'react';
import styles from './YtdAnalytics.module.css';
import { usePractices } from '../../../contexts/PracticeContext/PracticeContext';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';
import { calculatePay } from '../../../utils/calculations';
import { BarChart as BarChartIcon, Trophy, CalendarClock, Banknote, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const formatCurrency = (val, compact = false) => {
    const options = { style: 'currency', currency: 'USD' };
    if (compact) {
        options.notation = 'compact';
        options.maximumFractionDigits = 1;
    } else {
        options.minimumFractionDigits = 0;
        options.maximumFractionDigits = 0;
    }
    return new Intl.NumberFormat('en-US', options).format(val || 0);
};

const MonthlyBreakdownChart = ({ data }) => (
    <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--ui-text-tertiary)' }} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => formatCurrency(val, true)} tick={{ fontSize: 11, fill: 'var(--ui-text-tertiary)' }} />
            <Tooltip
                cursor={{ fill: 'var(--ui-background-tertiary)' }}
                contentStyle={{ background: 'var(--ui-background-secondary)', border: '1px solid var(--ui-border-secondary)', borderRadius: '8px' }}
                formatter={(value, name) => [formatCurrency(value), name.replace(/([A-Z])/g, ' $1').trim()]}
            />
            <Legend iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="production" name="Production" fill="var(--brand-secondary)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="calculatedPay" name="Calculated Pay" fill="var(--brand-primary)" radius={[2, 2, 0, 0]} />
        </BarChart>
    </ResponsiveContainer>
);

const HighlightCard = ({ icon, title, value, subtext }) => (
    <div className={styles.highlightCard}>
        <div className={styles.highlightIcon}>{icon}</div>
        <div className={styles.highlightText}>
            <span className={styles.highlightTitle}>{title}</span>
            <span className={styles.highlightValue}>{value}</span>
            <span className={styles.highlightSubtext}>{subtext}</span>
        </div>
    </div>
);

const YtdAnalytics = () => {
    const { entries } = useEntries();
    const { practices } = usePractices();
    const [activeTab, setActiveTab] = useState('overview');

    const analyticsData = useMemo(() => {
        if (!entries || !practices || entries.length === 0 || practices.length === 0) {
            return { ytdProduction: 0, ytdCalculatedPay: 0, chartData: [], bestProductionMonth: null, mostDaysWorkedMonth: null, bestPayMonth: null, bestAvgProdDay: null };
        }

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        let ytdProductionTotal = 0;
        let ytdCalculatedPayTotal = 0;

        let bestProductionMonth = { month: 'N/A', production: -Infinity };
        let mostDaysWorkedMonth = { month: 'N/A', days: -Infinity };
        let bestPayMonth = { month: 'N/A', pay: -Infinity };
        let bestAvgProdDay = { month: 'N/A', avg: -Infinity };

        const monthlyData = Array.from({ length: currentMonth + 1 }, (_, i) => {
            const monthName = new Date(currentYear, i).toLocaleString('default', { month: 'long'});
            
            // CORRECTED: This filter now correctly handles dates for all entry types.
            const monthEntries = entries.filter(e => {
                const dateStr = e.entryType === 'periodSummary' ? e.periodStartDate : e.date;
                if (!dateStr) return false;
                const date = new Date(`${dateStr}T00:00:00Z`);
                return date.getUTCFullYear() === currentYear && date.getUTCMonth() === i;
            });

            const financialEntries = monthEntries.filter(e => e.entryType !== 'attendanceRecord');
            const monthProduction = financialEntries.reduce((sum, e) => sum + (e.production || 0), 0);
            
            const daysWorked = new Set(monthEntries.filter(e => e.entryType === 'attendanceRecord' || e.entryType === 'dailySummary').map(e => e.date)).size;
            
            const monthCalculatedPay = practices.reduce((sum, p) => {
                const practiceEntries = monthEntries.filter(e => e.practiceId === p.id);
                if(practiceEntries.length === 0) return sum;

                const payResult = calculatePay(p, practiceEntries, currentYear, i);
                return sum + payResult.calculatedPay;
            }, 0);
            
            const avgProdPerDay = daysWorked > 0 ? monthProduction / daysWorked : 0;

            ytdProductionTotal += monthProduction;
            ytdCalculatedPayTotal += monthCalculatedPay;
            
            if (monthProduction > bestProductionMonth.production) {
                bestProductionMonth = { month: monthName, production: monthProduction };
            }
            if (daysWorked > mostDaysWorkedMonth.days) {
                mostDaysWorkedMonth = { month: monthName, days: daysWorked };
            }
            if (monthCalculatedPay > bestPayMonth.pay) {
                bestPayMonth = { month: monthName, pay: monthCalculatedPay };
            }
            if (avgProdPerDay > bestAvgProdDay.avg) {
                bestAvgProdDay = { month: monthName, avg: avgProdPerDay };
            }

            return { 
                name: new Date(currentYear, i).toLocaleString('default', { month: 'short'}), 
                production: monthProduction, 
                calculatedPay: monthCalculatedPay, 
                daysWorked: daysWorked 
            };
        });
        
        return { 
            ytdProduction: ytdProductionTotal, 
            ytdCalculatedPay: ytdCalculatedPayTotal, 
            chartData: monthlyData, 
            bestProductionMonth, 
            mostDaysWorkedMonth, 
            bestPayMonth, 
            bestAvgProdDay 
        };
    }, [entries, practices]);

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h3 className={styles.sectionTitle}>YTD Analytics</h3>
                <div className={styles.tabControls}>
                    <button onClick={() => setActiveTab('overview')} className={activeTab === 'overview' ? styles.active : ''}>Overview</button>
                    <button onClick={() => setActiveTab('breakdown')} className={activeTab === 'breakdown' ? styles.active : ''}>Monthly Breakdown</button>
                </div>
            </div>

            <div className={styles.tabContent}>
                {activeTab === 'overview' && (
                    <div className={styles.overviewGrid}>
                        <div className={styles.kpiItem}>
                            <span>YTD Total Production</span>
                            <p>{formatCurrency(analyticsData.ytdProduction, true)}</p>
                        </div>
                        <div className={styles.kpiItem}>
                            <span>YTD Total Calculated Pay</span>
                            <p>{formatCurrency(analyticsData.ytdCalculatedPay, true)}</p>
                        </div>
                        <div className={styles.highlights}>
                            <HighlightCard 
                                icon={<Trophy />} 
                                title="Highest Production" 
                                value={formatCurrency(analyticsData.bestProductionMonth?.production)} 
                                subtext={`in ${analyticsData.bestProductionMonth?.month}`}
                            />
                             <HighlightCard 
                                icon={<Banknote />} 
                                title="Highest Pay" 
                                value={formatCurrency(analyticsData.bestPayMonth?.pay)} 
                                subtext={`in ${analyticsData.bestPayMonth?.month}`}
                            />
                            <HighlightCard 
                                icon={<CalendarClock />} 
                                title="Most Days Worked" 
                                value={`${analyticsData.mostDaysWorkedMonth?.days} days`}
                                subtext={`in ${analyticsData.mostDaysWorkedMonth?.month}`}
                            />
                             <HighlightCard 
                                icon={<Activity />} 
                                title="Avg. Prod / Day" 
                                value={formatCurrency(analyticsData.bestAvgProdDay?.avg)}
                                subtext={`in ${analyticsData.bestAvgProdDay?.month}`}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'breakdown' && (
                    <div className={styles.breakdownContainer}>
                         <h4 className={styles.chartTitle}><BarChartIcon size={14}/> Production vs. Calculated Pay</h4>
                         <MonthlyBreakdownChart data={analyticsData.chartData} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default YtdAnalytics;