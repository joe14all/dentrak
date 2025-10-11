import React from 'react';
import styles from './QuickActions.module.css';
import { useNavigation } from '../../../contexts/NavigationContext/NavigationContext';
import { PlusCircle, Banknote, CalendarPlus, Building } from 'lucide-react';

// Re-usable ActionCard sub-component for consistency and clean code
const ActionCard = ({ icon, title, subtitle, onClick }) => (
    <button className={styles.actionCard} onClick={onClick}>
        <div className={styles.iconWrapper}>{icon}</div>
        <div className={styles.textWrapper}>
            <span className={styles.title}>{title}</span>
            <span className={styles.subtitle}>{subtitle}</span>
        </div>
    </button>
);

const QuickActions = ({ onAddEntry, onAddPayment, onAddAttendance }) => {
    const { setActivePage } = useNavigation();

    const actions = [
        {
            icon: <PlusCircle />,
            title: "Add Performance",
            subtitle: "Log production & collection.",
            onClick: onAddEntry,
        },
        {
            icon: <Banknote />,
            title: "Log Payment",
            subtitle: "Record a received payment.",
            onClick: onAddPayment,
        },
        {
            icon: <CalendarPlus />,
            title: "Record Attendance",
            subtitle: "Mark days worked on the calendar.",
            onClick: onAddAttendance,
        },
        {
            icon: <Building />,
            title: "New Practice",
            subtitle: "Set up a new work location.",
            onClick: () => setActivePage('Practices'),
        },
    ];

    return (
        <div className={styles.container}>
            {actions.map(action => (
                <ActionCard 
                    key={action.title}
                    icon={action.icon}
                    title={action.title}
                    subtitle={action.subtitle}
                    onClick={action.onClick}
                />
            ))}
        </div>
    );
};

export default QuickActions;
