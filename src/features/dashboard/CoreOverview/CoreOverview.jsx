import React, { useMemo } from 'react';
import styles from './CoreOverview.module.css';
import { usePractices } from '../../../contexts/PracticeContext/PracticeContext';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';
import { calculatePay } from '../../../utils/calculations';
import { filterPracticesForCurrent } from '../../../utils/practiceFilters';
import PracticePerfCard from './PracticePerfCard';

const CoreOverview = () => {
  const { practices } = usePractices();
  const { entries } = useEntries();

  // Calculate current month performance for each practice
  const practicePerformances = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter out archived practices that shouldn't appear in current month
    const activePractices = filterPracticesForCurrent(practices);

    return activePractices.map((practice) => {
      // Filter entries for current month and this practice
      const practiceEntries = entries.filter((entry) => entry.practiceId === practice.id);
      
      // Calculate pay using the utility function
      const payResult = calculatePay(practice, practiceEntries, currentYear, currentMonth);

      return {
        practice,
        productionTotal: payResult.productionTotal || 0,
        collectionTotal: payResult.collectionTotal || 0,
        calculatedPay: payResult.calculatedPay || 0,
        basePayOwed: payResult.basePayOwed || 0,
      };
    });
  }, [practices, entries]);

  return (
    <div className={styles.container}>
      <h3 className={styles.sectionTitle}>Practice Performance</h3>
      <div className={styles.grid}>
        {practicePerformances.map(({ practice, ...performance }) => (
          <PracticePerfCard key={practice.id} practice={practice} performance={performance} />
        ))}
      </div>
    </div>
  );
};

export default CoreOverview;
