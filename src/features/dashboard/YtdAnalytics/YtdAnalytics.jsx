import React, { useMemo } from 'react';
import styles from './YtdAnalytics.module.css';
import { useNavigation } from '../../../contexts/NavigationContext/NavigationContext';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';
import { usePayments } from '../../../contexts/PaymentContext/PaymentContext';
import { ExternalLink, TrendingUp, BarChart as BarChartIcon } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

// --- Chart Sub-Components ---
const ProductionTrendChart = ({ data }) => (
    <ResponsiveContainer width="100%" height={100}>
        <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <Tooltip
                cursor={false}
                contentStyle={{ background: 'var(--ui-background-secondary)', border: 'none', borderRadius: '8px' }}
                formatter={(value) => [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value), 'Production']}
            />
            <defs>
                <linearGradient id="colorProductionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--state-success)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--state-success)" stopOpacity={0}/>
                </linearGradient>
            </defs>
            <Area type="monotone" dataKey="production" stroke="var(--state-success)" strokeWidth={2} fill="url(#colorProductionGradient)" />
        </AreaChart>
    </ResponsiveContainer>
);

const PaymentsChart = ({ data }) => (
    <ResponsiveContainer width="100%" height={100}>
        <BarChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <Tooltip
                cursor={{ fill: 'var(--ui-background-tertiary)' }}
                contentStyle={{ background: 'var(--ui-background-secondary)', border: 'none', borderRadius: '8px' }}
                 formatter={(value) => [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value), 'Payments']}
            />
            <Bar dataKey="payments" fill="var(--brand-primary)" radius={[2, 2, 0, 0]} />
        </BarChart>
    </ResponsiveContainer>
);


// --- Main Component ---
const YtdAnalytics = ({ ytdProduction, ytdPayments }) => {
    const { entries } = useEntries();
    const { payments } = usePayments();
    const { setActivePage } = useNavigation();

    const { chartData, bestMonth } = useMemo(() => {
        if (!entries || !payments) return { chartData: [], bestMonth: null };

        const currentYear = new Date().getFullYear();
        let bestMonth = null;

        const chartData = Array(12).fill(null).map((_, i) => {
            const monthProduction = entries.filter(e => new Date(e.date || e.periodStartDate).getFullYear() === currentYear && new Date(e.date || e.periodStartDate).getMonth() === i && e.entryType !== 'attendanceRecord').reduce((sum, e) => sum + (e.production || 0), 0);
            const monthPayments = payments.filter(p => new Date(p.paymentDate).getFullYear() === currentYear && new Date(p.paymentDate).getMonth() === i).reduce((sum, p) => sum + p.amount, 0);
            
            if (!bestMonth || monthProduction > bestMonth.production) {
                bestMonth = { month: new Date(currentYear, i).toLocaleString('default', { month: 'long'}), production: monthProduction };
            }

            return {
                name: new Date(currentYear, i).toLocaleString('default', { month: 'short'}),
                production: monthProduction,
                payments: monthPayments,
            };
        });

        return { chartData, bestMonth };
    }, [entries, payments]);

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h3 className={styles.sectionTitle}>Year-to-Date Analytics</h3>
            </div>

            <div className={styles.ytdMetrics}>
                <div className={styles.metricItem}>
                    <span>Total Production</span>
                    <p>{formatCurrency(ytdProduction, true)}</p>
                </div>
                <div className={styles.metricItem}>
                    <span>Total Payments</span>
                    <p>{formatCurrency(ytdPayments, true)}</p>
                </div>
            </div>

            <div className={styles.chartsGrid}>
                <div className={styles.chartWrapper}>
                    <h4 className={styles.chartTitle}><TrendingUp size={14}/> Production Trend</h4>
                    <ProductionTrendChart data={chartData} />
                </div>
                <div className={styles.chartWrapper}>
                    <h4 className={styles.chartTitle}><BarChartIcon size={14}/> Monthly Payments</h4>
                    <PaymentsChart data={chartData} />
                </div>
            </div>
            
            <div className={styles.insights}>
                <p>Your best production month was <strong>{bestMonth?.month || 'N/A'}</strong> with <strong>{formatCurrency(bestMonth?.production)}</strong> billed.</p>
            </div>

             <button className={styles.viewAllButton} onClick={() => setActivePage('Reports')}>
                Generate Annual Report <ExternalLink size={14} />
            </button>
        </div>
    );
};

export default YtdAnalytics;

