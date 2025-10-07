import React from 'react';
import { useNavigation } from '../../../contexts/NavigationContext/NavigationContext';
import styles from './QuickActionsWidget.module.css';
import { PlusCircle, Banknote, CalendarPlus, Building } from 'lucide-react';

const QuickActionsWidget = () => {
    const { setActivePage } = useNavigation();

    return (
        <div className={styles.actionButtons}>
            <button onClick={() => setActivePage('Entries')}><PlusCircle size={16}/> Add Performance Entry</button>
            <button onClick={() => setActivePage('Payments')}><Banknote size={16}/> Log a Payment</button>
            <button onClick={() => setActivePage('Entries')}><CalendarPlus size={16}/> Record Attendance</button>
            <button onClick={() => setActivePage('Practices')}><Building size={16}/> Add New Practice</button>
        </div>
    );
};

export default QuickActionsWidget;
