import React, { useMemo } from 'react';
import styles from './CoreOverview.module.css';
import { usePractices } from '../../../contexts/PracticeContext/PracticeContext';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';
import { calculatePay } from '../../../utils/calculations';
import PracticePerfCard from './PracticePerfCard';

const CoreOverview = () => {
  const { practices } = usePractices();
  const { entries } = useEntries();

  const practicePerformances = useMemo(() => {
    if (!practices || !entries) return [];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Calculate performance for each active practice
    return practices
      .filter(p => p.status === 'active')
      .map(practice => {
        const entriesInMonth = entries.filter(e => {
          const date = new Date(e.date || e.periodStartDate);
          return e.practiceId === practice.id && 
                 date.getFullYear() === currentYear && 
                 date.getMonth() === currentMonth;
        });

        const performanceData = calculatePay(practice, entriesInMonth);
        
        return { practice, performance: performanceData };
      });
  }, [practices, entries]);

  return (
    <div className={styles.container}>
      <h3 className={styles.sectionTitle}>This Month's Performance</h3>
      <div className={styles.grid}>
        {practicePerformances.map(({ practice, performance }) => (
          <PracticePerfCard 
            key={practice.id} 
            practice={practice} 
            performance={performance} 
          />
        ))}
      </div>
    </div>
  );
};

export default CoreOverview;
