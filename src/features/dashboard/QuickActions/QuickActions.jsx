import React from 'react';
import styles from './QuickActions.module.css';
import { PlusCircle, Banknote, CalendarPlus, FileDown } from 'lucide-react'; 

// Re-usable ActionCard sub-component
const ActionCard = ({ icon, title, subtitle, onClick }) => (
    <button className={styles.actionCard} onClick={onClick}>
        <div className={styles.iconWrapper}>{icon}</div>
        <div className={styles.textWrapper}>
            <span className={styles.title}>{title}</span>
            <span className={styles.subtitle}>{subtitle}</span>
        </div>
    </button>
);

const QuickActions = ({ onAddEntry, onAddPayment, onAddAttendance, onCreatePdf }) => { // New prop

    const actions = [
        { icon: <PlusCircle />, title: "Add Performance", subtitle: "Log production & collection.", onClick: onAddEntry },
        { icon: <Banknote />, title: "Log Payment", subtitle: "Record a received payment.", onClick: onAddPayment },
        { icon: <CalendarPlus />, title: "Record Attendance", subtitle: "Mark days on the calendar.", onClick: onAddAttendance },
        // Replaced "New Practice" with "Create Summary"
        { icon: <FileDown />, title: "Create PDF Summary", subtitle: "Generate a pay period report.", onClick: onCreatePdf },
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

