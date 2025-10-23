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
    if (!practices || !entries) {
      return [];
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();


    return practices
      .filter(p => p.status === 'active')
      .map(practice => {
        const entriesInMonth = entries.filter(e => {
          const dateStr = e.date || e.periodStartDate;
          if (!dateStr) return false;
          // CORRECTED: Parse date as UTC to prevent timezone shifts.
          const date = new Date(`${dateStr}T00:00:00Z`);
          return e.practiceId === practice.id && 
                 date.getUTCFullYear() === currentYear && 
                 date.getUTCMonth() === currentMonth;
        });

        
        const performanceData = calculatePay(practice, entriesInMonth, currentYear, currentMonth);

        
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