import React from 'react';
import styles from './QuickActions.module.css';
import { PlusCircle, Banknote, CalendarPlus, FileDown } from 'lucide-react'; 

// Secondary actions are simple icon + title buttons
const SecondaryAction = ({ icon, title, onClick }) => (
    <button className={styles.secondaryButton} onClick={onClick}>
        {icon}
        <span>{title}</span>
    </button>
);

const QuickActions = ({ onAddEntry, onAddPayment, onAddAttendance, onCreatePdf }) => {

    return (
        <div className={styles.container}>
            <h4 className={styles.title}>Quick Actions</h4>
            <div className={styles.actionsGrid}>
                {/* The Primary Action is styled to be prominent but compact */}
                <button className={styles.primaryAction} onClick={onAddEntry}>
                    <div className={styles.iconWrapper}>
                        <PlusCircle strokeWidth={2} />
                    </div>
                    <div className={styles.textWrapper}>
                        <span className={styles.primaryTitle}>Add Performance</span>
                        <span className={styles.primarySubtitle}>Log daily production.</span>
                    </div>
                </button>

                {/* The Secondary Actions are in a tight 3-column grid */}
                <div className={styles.secondaryActions}>
                    <SecondaryAction icon={<Banknote />} title="Log Payment" onClick={onAddPayment} />
                    <SecondaryAction icon={<CalendarPlus />} title="Record Day" onClick={onAddAttendance} />
                    <SecondaryAction icon={<FileDown />} title="Create PDF" onClick={onCreatePdf} />
                </div>
            </div>
        </div>
    );
};

export default QuickActions;