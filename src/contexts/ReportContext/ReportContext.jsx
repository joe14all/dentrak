/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { 
  getAllReports,
  addReport as dbAddReport,
  deleteReport as dbDeleteReport,
  populateReports 
} from '../../database/reports';

// Import other contexts to access their data for calculations
import { usePractices } from '../PracticeContext/PracticeContext';
import { useEntries } from '../EntryContext/EntryContext';
import { usePayments } from '../PaymentContext/PaymentContext';

const ReportContext = createContext();

let hasInitialized = false;

export const ReportProvider = ({ children }) => {
  const [savedReports, setSavedReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get data from other contexts
  const { practices } = usePractices();
  const { entries } = useEntries();
  const { payments } = usePayments();

  const refreshReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const reportsFromDb = await getAllReports();
      setSavedReports(reportsFromDb);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeDB = async () => {
      if (!hasInitialized) {
        hasInitialized = true;
        await populateReports();
        await refreshReports();
      }
    };
    initializeDB();
  }, [refreshReports]);

  /**
   * Generates a new report based on specified parameters without saving it.
   * @param {Object} params - The parameters for the report.
   * @param {'payPeriodStatement' | 'annualSummary' | 'practiceComparison'} params.type
   * @param {string} params.startDate
   * @param {string} params.endDate
   * @param {number[]} params.practiceIds
   */
  const generateReport = useCallback((params) => {
    const { type, startDate, endDate, practiceIds } = params;
    
    // Filter data based on parameters
    const relevantPractices = practices.filter(p => practiceIds.includes(p.id));
    const relevantEntries = entries.filter(e => {
        const entryDate = new Date(e.date || e.periodStartDate);
        return practiceIds.includes(e.practiceId) &&
               entryDate >= new Date(startDate) &&
               entryDate <= new Date(endDate);
    });
     const relevantPayments = payments.filter(p => {
        const paymentDate = new Date(p.paymentDate);
        return practiceIds.includes(p.practiceId) &&
               paymentDate >= new Date(startDate) &&
               paymentDate <= new Date(endDate);
    });


    // --- Logic for different report types ---
    switch(type) {
      case 'payPeriodStatement': {
        // This can now generate a statement for each selected practice.
        return relevantPractices.map(practice => {
          const practiceEntries = relevantEntries.filter(e => e.practiceId === practice.id);
          const practicePayments = relevantPayments.filter(p => p.practiceId === practice.id);
          
          const grossProduction = practiceEntries.reduce((sum, e) => sum + (e.production || 0), 0);
          const grossCollection = practiceEntries.reduce((sum, e) => sum + (e.collection || 0), 0);
          const totalAdjustments = practiceEntries.flatMap(e => e.adjustments || []).reduce((sum, adj) => sum + adj.amount, 0);
          
          // --- Complex Pay Calculation ---
          let calculatedPay = 0;
          if (practice.basePay > 0) { // Daily Rate / Employment Model
              const daysWorked = new Set(practiceEntries.filter(e => e.entryType === 'attendanceRecord' || e.entryType === 'dailySummary').map(e => e.date)).size;
              calculatedPay = daysWorked * practice.basePay;
              // Add bonus logic if it exists
          } else { // Percentage Model
              const calculationBase = practice.calculationBase === 'collection' ? grossCollection : grossProduction;
              // This is a simplified calculation. A real one would handle deductions timing.
              const netBase = calculationBase - totalAdjustments;
              calculatedPay = netBase * (practice.percentage / 100);
          }

          const totalPaymentsReceived = practicePayments.reduce((sum, p) => sum + p.amount, 0);

          return {
              name: `${practice.name} - Pay Period ${startDate} to ${endDate}`,
              type,
              createdAt: new Date().toISOString(),
              parameters: {...params, practiceIds: [practice.id]},
              data: {
                  practiceName: practice.name,
                  summary: { 
                      grossProduction, 
                      grossCollection,
                      totalAdjustments,
                      netProduction: grossProduction - totalAdjustments,
                      calculatedPay,
                      totalPaymentsReceived,
                      balanceDue: calculatedPay - totalPaymentsReceived
                  },
                  lineItems: practiceEntries,
                  paymentItems: practicePayments,
              }
          };
        });
      }
      
      case 'annualSummary': {
        const year = new Date(startDate).getFullYear();
        const byPractice = relevantPractices.map(practice => {
            const practiceEntries = relevantEntries.filter(e => e.practiceId === practice.id);
            const totalProduction = practiceEntries.reduce((sum, e) => sum + (e.production || 0), 0);
            // Add more summary calculations here...
            return {
                practiceName: practice.name,
                totalProduction,
                totalCalculatedPay: 0, // Placeholder for complex annual pay calculation
            };
        });

        const overallTotals = byPractice.reduce((acc, curr) => {
            acc.totalProduction += curr.totalProduction;
            acc.totalCalculatedPay += curr.totalCalculatedPay;
            return acc;
        }, { totalProduction: 0, totalCalculatedPay: 0 });

        return [{
            name: `${year} Annual Financial Summary`,
            type,
            createdAt: new Date().toISOString(),
            parameters: params,
            data: { year, overallTotals, byPractice }
        }];
      }

      case 'practiceComparison': {
        const metrics = relevantPractices.map(practice => {
          const practiceEntries = relevantEntries.filter(e => e.practiceId === practice.id);
          const attendance = practiceEntries.filter(e => e.entryType === 'attendanceRecord' || e.entryType === 'dailySummary');
          const daysWorked = new Set(attendance.map(e => e.date)).size;
          const totalProduction = practiceEntries.reduce((sum, e) => sum + (e.production || 0), 0);
          
          return {
              practiceName: practice.name,
              totalProduction,
              totalCollection: practiceEntries.reduce((sum, e) => sum + (e.collection || 0), 0),
              daysWorked,
              avgProductionPerDay: daysWorked > 0 ? totalProduction / daysWorked : 0,
          };
        });

        return [{
            name: `Practice Comparison ${startDate} to ${endDate}`,
            type,
            createdAt: new Date().toISOString(),
            parameters: params,
            data: { metrics }
        }];
      }

      default:
        return null;
    }

  }, [practices, entries, payments]);

  const saveGeneratedReport = async (reportData) => {
    await dbAddReport(reportData);
    await refreshReports();
  };
  
  const deleteSavedReport = async (reportId) => {
    await dbDeleteReport(reportId);
    await refreshReports();
  };


  const value = {
    savedReports,
    isLoading,
    generateReport,
    saveGeneratedReport,
    deleteSavedReport,
  };

  return (
    <ReportContext.Provider value={value}>
      {children}
    </ReportContext.Provider>
  );
};

export const useReports = () => {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
};