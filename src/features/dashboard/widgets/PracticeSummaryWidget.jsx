import React, { useMemo } from 'react';
import { usePractices } from '../../../contexts/PracticeContext/PracticeContext';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';
import { useNavigation } from '../../../contexts/NavigationContext/NavigationContext';
import styles from './PracticeSummaryWidget.module.css';
import { ArrowRight, Clock } from 'lucide-react';

const PracticeSummaryWidget = () => {
    const { practices } = usePractices();
    const { entries } = useEntries();
    const { setActivePage } = useNavigation();

    const practiceDays = useMemo(() => {
        const now = new Date();
        const attendanceEntries = entries.filter(e => {
            const entryDate = new Date(e.date);
            return e.entryType === 'attendanceRecord' &&
                   entryDate.getFullYear() === now.getFullYear() &&
                   entryDate.getMonth() === now.getMonth();
        });

        return (practices || []).map(practice => {
            const count = attendanceEntries.filter(e => e.practiceId === practice.id).length;
            return { name: practice.name, count };
        }).sort((a, b) => b.count - a.count);
    }, [entries, practices]);

    return (
        <div className={styles.summaryContainer}>
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
    );
};

export default PracticeSummaryWidget;
