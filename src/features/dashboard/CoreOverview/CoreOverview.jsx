import React, { useMemo } from 'react';
import styles from './CoreOverview.module.css';
import { usePractices } from '../../../contexts/PracticeContext/PracticeContext';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';
import { calculatePay } from '../../../utils/calculations';
import PracticePerfCard from './PracticePerfCard';

const CoreOverview = () => {
  const { practices, practicesVersion } = usePractices();
  const { entries } = useEntries();

  console.log('🎯 CoreOverview render - practices from context:', {
    practicesCount: practices?.length,
    version: practicesVersion,
    practice6: practices?.find(p => p.id === 6)
  });

  const practicePerformances = useMemo(() => {
    console.log('🔄 CoreOverview recalculating practicePerformances with version:', practicesVersion);
    
    if (!practices || !entries) {
      return [];
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    console.log('📊 CoreOverview calculation params:', {
      practicesCount: practices.length,
      currentYear,
      currentMonth,
      practicesVersion
    });

    return practices
      .filter(p => p.status === 'active')
      .map(practice => {
        console.log('🏥 Processing practice:', {
          id: practice.id,
          name: practice.name,
          payCycle: practice.payCycle,
          basePay: practice.basePay
        });

        const entriesInMonth = entries.filter(e => {
          const dateStr = e.date || e.periodStartDate;
          if (!dateStr) return false;
          // CORRECTED: Parse date as UTC to prevent timezone shifts.
          const date = new Date(`${dateStr}T00:00:00Z`);
          return e.practiceId === practice.id && 
                 date.getUTCFullYear() === currentYear && 
                 date.getUTCMonth() === currentMonth;
        });

        console.log('📝 Entries found for practice:', {
          practiceId: practice.id,
          entriesCount: entriesInMonth.length
        });
        
        const performanceData = calculatePay(practice, entriesInMonth, currentYear, currentMonth);

        console.log('💵 Performance calculated:', {
          practiceId: practice.id,
          practiceName: practice.name,
          calculatedPay: performanceData.calculatedPay,
          payStructure: performanceData.payStructure,
          periodsCount: performanceData.payPeriods?.length
        });

        
        return { practice, performance: performanceData };
      });
  }, [practices, entries, practicesVersion]);

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