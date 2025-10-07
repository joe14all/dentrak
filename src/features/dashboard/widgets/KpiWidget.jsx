import React, { useMemo } from 'react';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';
import { useTransactions } from '../../../contexts/TransactionContext/TransactionContext';
import { useNavigation } from '../../../contexts/NavigationContext/NavigationContext';
import styles from './KpiWidget.module.css';
import { LineChart, DollarSign, CalendarDays, Banknote, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';

const KpiWidget = ({ type }) => {
  const { entries } = useEntries();
  const { cheques } = useTransactions();
  const { setActivePage } = useNavigation();

  const { value, title, icon, trend, trendDirection, targetPage, explanation } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const isCurrentMonth = (dateStr) => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    };
    
    const isPrevMonth = (dateStr) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return date.getFullYear() === prevMonthYear && date.getMonth() === prevMonth;
    };
    
    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val || 0);

    let currentValue = 0;
    let previousValue = 0;
    let data = {};

    switch (type) {
      case 'production': {
        const perfEntries = entries.filter(e => e.entryType !== 'attendanceRecord');
        currentValue = perfEntries.filter(e => isCurrentMonth(e.date || e.periodStartDate)).reduce((sum, e) => sum + (e.production || 0), 0);
        previousValue = perfEntries.filter(e => isPrevMonth(e.date || e.periodStartDate)).reduce((sum, e) => sum + (e.production || 0), 0);
        data = { value: formatCurrency(currentValue), title: "Production", icon: <LineChart />, targetPage: 'Entries', explanation: "Total billed value this month." };
        break;
      }
      case 'collection': {
        const perfEntries = entries.filter(e => e.entryType !== 'attendanceRecord');
        currentValue = perfEntries.filter(e => isCurrentMonth(e.date || e.periodStartDate)).reduce((sum, e) => sum + (e.collection || 0), 0);
        previousValue = perfEntries.filter(e => isPrevMonth(e.date || e.periodStartDate)).reduce((sum, e) => sum + (e.collection || 0), 0);
        data = { value: formatCurrency(currentValue), title: "Collection", icon: <DollarSign />, targetPage: 'Entries', explanation: "Total payments collected this month." };
        break;
      }
      case 'days-worked': {
        currentValue = new Set(entries.filter(e => e.entryType === 'attendanceRecord' && isCurrentMonth(e.date)).map(e => e.date)).size;
        previousValue = new Set(entries.filter(e => e.entryType === 'attendanceRecord' && isPrevMonth(e.date)).map(e => e.date)).size;
        data = { value: `${currentValue} Days`, title: "Attendance", icon: <CalendarDays />, targetPage: 'Entries', explanation: "Total attendance records this month." };
        break;
      }
      case 'outstanding-cheques': {
        currentValue = cheques.filter(c => c.status === 'Pending' || c.status === 'Deposited').reduce((sum, c) => sum + c.amount, 0);
        previousValue = 0; 
        data = { value: formatCurrency(currentValue), title: "Outstanding", icon: <Banknote />, targetPage: 'Transactions', explanation: "Value of pending & deposited cheques." };
        break;
      }
      default:
        return {};
    }
    
    let trend = '';
    let trendDirection = 'neutral';
    if (previousValue > 0) {
        const percentChange = ((currentValue - previousValue) / previousValue) * 100;
        trendDirection = percentChange >= 0 ? 'positive' : 'negative';
        trend = `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(0)}%`;
    } else if (currentValue > 0) {
        trendDirection = 'positive';
        trend = '+100%';
    }

    return { ...data, trend, trendDirection };

  }, [type, entries, cheques]);

  return (
    <button onClick={() => setActivePage(targetPage)} className={styles.kpiCard} data-type={type}>
        <div className={styles.cardHeader}>
            <div className={styles.icon}>{icon}</div>
            <span className={styles.title}>{title}</span>
        </div>
      
        <div className={styles.mainContent}>
            <span className={styles.value}>{value}</span>
            {trend && type !== 'outstanding-cheques' && (
                 <div className={`${styles.trend} ${styles[trendDirection]}`}>
                    {trendDirection === 'positive' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    <span>{trend}</span>
                </div>
            )}
        </div>

        <p className={styles.explanation}>{explanation}</p>
        
        <div className={styles.footer}>
            <span>View Details</span>
            <ArrowRight size={14} />
        </div>
    </button>
  );
};

export default KpiWidget;

