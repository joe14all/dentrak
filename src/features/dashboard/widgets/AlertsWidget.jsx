import React, { useMemo } from 'react';
import { useTransactions } from '../../../contexts/TransactionContext/TransactionContext';
import { useNavigation } from '../../../contexts/NavigationContext/NavigationContext';
import styles from './AlertsWidget.module.css';
import { AlertTriangle, CheckCircle, Bell, ArrowRight } from 'lucide-react';

const AlertsWidget = () => {
    const { cheques } = useTransactions();
    const { setActivePage } = useNavigation();

    const alerts = useMemo(() => {
        const pending = cheques.filter(c => c.status === 'Pending');
        const bounced = cheques.filter(c => c.status === 'Bounced');
        let alerts = [];

        if (bounced.length > 0) {
            alerts.push({ 
                type: 'danger', 
                message: `You have ${bounced.length} bounced cheque(s) requiring attention.`,
                action: () => setActivePage('Transactions')
            });
        }
        if (pending.length > 0) {
            alerts.push({ 
                type: 'warning', 
                message: `You have ${pending.length} pending cheque(s) to deposit.`,
                action: () => setActivePage('Transactions')
            });
        }
        if (alerts.length === 0) {
            alerts.push({ 
                type: 'success', 
                message: `All transactions are up to date. No immediate actions required.`,
                action: null
            });
        }
        return alerts;
    }, [cheques, setActivePage]);

    return (
        <div className={styles.alertList}>
            {alerts.map((alert, index) => (
                <div 
                    key={index} 
                    className={`${styles.alert} ${styles[alert.type]} ${alert.action ? styles.actionable : ''}`}
                    onClick={alert.action}
                >
                    <div className={styles.iconWrapper}>
                        {alert.type === 'warning' && <Bell />}
                        {alert.type === 'danger' && <AlertTriangle />}
                        {alert.type === 'success' && <CheckCircle />}
                    </div>
                    <span className={styles.message}>{alert.message}</span>
                    {alert.action && <ArrowRight className={styles.arrowIcon} size={16} />}
                </div>
            ))}
        </div>
    );
};

export default AlertsWidget;

