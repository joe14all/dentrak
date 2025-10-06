import React, { useMemo } from 'react';
import styles from './DashboardPage.module.css';
import { usePractices } from '../../contexts/PracticeContext/PracticeContext';
import { useEntries } from '../../contexts/EntryContext/EntryContext';
import { usePayments } from '../../contexts/PaymentContext/PaymentContext';
import { useTransactions } from '../../contexts/TransactionContext/TransactionContext';
import { useNavigation } from '../../contexts/NavigationContext/NavigationContext';
import {
  DollarSign, LineChart, Banknote, CalendarDays, AlertTriangle, CheckCircle,
  PlusCircle, CalendarPlus, Building, ArrowRight, Clock
} from 'lucide-react';

// --- Reusable Stat Card Component ---
const StatCard = ({ icon, title, value, color }) => (
  <div className={styles.statCard} style={{ '--card-color': color }}>
    <div className={styles.cardIcon}>{icon}</div>
    <div className={styles.cardContent}>
      <span className={styles.cardTitle}>{title}</span>
      <span className={styles.cardValue}>{value}</span>
    </div>
  </div>
);

// --- Main Dashboard Component ---
const DashboardPage = () => {
  const { practices } = usePractices();
  const { entries } = useEntries();
  const { payments } = usePayments();
  const { cheques } = useTransactions();
  const { setActivePage } = useNavigation();

  const { monthlyProduction, monthlyCollection, daysWorked, outstandingCheques, recentActivity, practiceDays } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const isCurrentMonth = (dateStr) => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    };

    // --- Calculations ---
    const performanceEntries = entries.filter(e => e.entryType !== 'attendanceRecord' && (isCurrentMonth(e.date) || isCurrentMonth(e.periodStartDate)));
    const attendanceEntries = entries.filter(e => e.entryType === 'attendanceRecord' && isCurrentMonth(e.date));

    const monthlyProduction = performanceEntries.reduce((sum, e) => sum + (e.production || 0), 0);
    const monthlyCollection = performanceEntries.reduce((sum, e) => sum + (e.collection || 0), 0);
    const daysWorked = new Set(attendanceEntries.map(e => e.date)).size;
    const outstandingCheques = cheques.filter(c => c.status === 'Pending' || c.status === 'Deposited').reduce((sum, c) => sum + c.amount, 0);

    // --- Recent Activity ---
    const allActivity = [
        ...entries.map(e => ({ ...e, activityType: 'entry' })),
        ...payments.map(p => ({ ...p, activityType: 'payment' }))
    ].sort((a, b) => new Date(b.date || b.paymentDate) - new Date(a.date || a.paymentDate));
    
    // --- Practice Day Count ---
    const practiceDays = (practices || []).map(practice => {
        const count = attendanceEntries.filter(e => e.practiceId === practice.id).length;
        return { name: practice.name, count };
    }).sort((a, b) => b.count - a.count);


    return {
      monthlyProduction,
      monthlyCollection,
      daysWorked,
      outstandingCheques,
      recentActivity: allActivity.slice(0, 5),
      practiceDays,
    };
  }, [entries, payments, cheques, practices]);
  
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const alerts = useMemo(() => {
      const pending = cheques.filter(c => c.status === 'Pending');
      const bounced = cheques.filter(c => c.status === 'Bounced');
      let alerts = [];
      if (pending.length > 0) alerts.push({ type: 'warning', message: `You have ${pending.length} pending cheque(s) to deposit.` });
      if (bounced.length > 0) alerts.push({ type: 'danger', message: `You have ${bounced.length} bounced cheque(s) that require attention.` });
      if (alerts.length === 0) alerts.push({ type: 'success', message: `All transactions are up to date.` });
      return alerts;
  }, [cheques]);

  return (
    <div className={styles.dashboardGrid}>
      {/* --- Header Stats --- */}
      <div className={styles.statsHeader}>
        <StatCard icon={<LineChart />} title="Production This Month" value={formatCurrency(monthlyProduction)} color="var(--state-success)" />
        <StatCard icon={<DollarSign />} title="Collection This Month" value={formatCurrency(monthlyCollection)} color="var(--brand-primary)" />
        <StatCard icon={<CalendarDays />} title="Days Worked This Month" value={daysWorked} color="#8B5CF6" />
        <StatCard icon={<Banknote />} title="Outstanding Cheques" value={formatCurrency(outstandingCheques)} color="var(--state-warning)" />
      </div>

      {/* --- Quick Actions --- */}
      <div className={styles.quickActions}>
          <h3 className={styles.sectionTitle}>Quick Actions</h3>
          <div className={styles.actionButtons}>
            <button onClick={() => setActivePage('Entries')}><PlusCircle size={16}/> Add Performance Entry</button>
            <button onClick={() => setActivePage('Payments')}><Banknote size={16}/> Log a Payment</button>
            <button onClick={() => setActivePage('Entries')}><CalendarPlus size={16}/> Record Attendance</button>
            <button onClick={() => setActivePage('Practices')}><Building size={16}/> Add New Practice</button>
          </div>
      </div>
      
      {/* --- Alerts --- */}
      <div className={styles.alerts}>
        <h3 className={styles.sectionTitle}>Alerts & Notifications</h3>
        <div className={styles.alertList}>
            {alerts.map((alert, index) => (
                <div key={index} className={`${styles.alert} ${styles[alert.type]}`}>
                    {alert.type === 'warning' && <AlertTriangle />}
                    {alert.type === 'danger' && <AlertTriangle />}
                    {alert.type === 'success' && <CheckCircle />}
                    <span>{alert.message}</span>
                </div>
            ))}
        </div>
      </div>

      {/* --- Recent Activity --- */}
      <div className={styles.recentActivity}>
          <h3 className={styles.sectionTitle}>Recent Activity</h3>
          <div className={styles.activityList}>
              {recentActivity.map((item) => (
                  <div key={`${item.activityType}-${item.id}`} className={styles.activityItem}>
                      <div className={`${styles.activityIcon} ${styles[item.activityType]}`}>
                          {item.activityType === 'entry' ? <LineChart size={16}/> : <Banknote size={16}/>}
                      </div>
                      <div className={styles.activityDetails}>
                          <span>{practices.find(p => p.id === item.practiceId)?.name || 'Unknown Practice'}</span>
                          <small>{new Date(item.date || item.paymentDate).toLocaleDateString()}</small>
                      </div>
                      <span className={`${styles.activityAmount} ${item.activityType === 'entry' ? styles.production : styles.collection}`}>
                          {formatCurrency(item.production || item.amount)}
                      </span>
                  </div>
              ))}
          </div>
      </div>
      
      {/* --- Practice Summary --- */}
      <div className={styles.practiceSummary}>
        <h3 className={styles.sectionTitle}>Attendance by Practice (This Month)</h3>
        <div className={styles.practiceList}>
            {practiceDays.filter(p => p.count > 0).map(p => (
                <div key={p.name} className={styles.practiceItem}>
                    <span>{p.name}</span>
                    <div className={styles.dayCount}>
                        <Clock size={14}/>
                        <span>{p.count} day{p.count !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            ))}
        </div>
        <button className={styles.viewAllButton} onClick={() => setActivePage('Entries')}>
            View Full Calendar <ArrowRight size={16}/>
        </button>
      </div>

    </div>
  );
};

export default DashboardPage;

