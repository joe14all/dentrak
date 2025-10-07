import React, { useMemo } from 'react';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';
import { usePayments } from '../../../contexts/PaymentContext/PaymentContext';
import { usePractices } from '../../../contexts/PracticeContext/PracticeContext';
import styles from './RecentActivityWidget.module.css';
import { LineChart, Banknote } from 'lucide-react';

const RecentActivityWidget = () => {
    const { entries } = useEntries();
    const { payments } = usePayments();
    const { practices } = usePractices();

    const recentActivity = useMemo(() => {
        const allActivity = [
            ...entries.filter(e => e.entryType !== 'attendanceRecord').map(e => ({ ...e, activityType: 'entry' })),
            ...payments.map(p => ({ ...p, activityType: 'payment' }))
        ].sort((a, b) => new Date(b.date || b.paymentDate) - new Date(a.date || a.paymentDate));
        return allActivity.slice(0, 5);
    }, [entries, payments]);
    
    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

    return (
        <div className={styles.activityList}>
            {recentActivity.map((item) => (
                <div key={`${item.activityType}-${item.id}`} className={styles.activityItem}>
                    <div className={`${styles.activityIcon} ${styles[item.activityType]}`}>
                        {item.activityType === 'entry' ? <LineChart size={16}/> : <Banknote size={16}/>}
                    </div>
                    <div className={styles.activityDetails}>
                        <span>{practices.find(p => p.id === item.practiceId)?.name || '...'}</span>
                        <small>{new Date(item.date || item.paymentDate).toLocaleDateString()}</small>
                    </div>
                    <span className={`${styles.activityAmount} ${item.activityType === 'entry' ? styles.production : styles.collection}`}>
                        {formatCurrency(item.production || item.amount)}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default RecentActivityWidget;
