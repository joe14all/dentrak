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
import { calculatePay } from '../../utils/calculations';
import { calculatePracticeMetrics } from '../../utils/practiceComparison';

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
   * @param {'payPeriodStatement' | 'annualSummary' | 'practiceComparison' | 'ytdIncome' | 'taxSummary'} params.type
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
        return relevantPractices.map(practice => {
          const practiceEntries = relevantEntries.filter(e => e.practiceId === practice.id);
          const practicePayments = relevantPayments.filter(p => p.practiceId === practice.id);
          
          const metrics = calculatePracticeMetrics(practice, practiceEntries, practicePayments);
          
          // Get period breakdown
          const periodStartDate = new Date(startDate);
          const periodEndDate = new Date(endDate);
          const year = periodStartDate.getFullYear();
          const month = periodStartDate.getMonth();
          
          const payCalc = calculatePay(practice, practiceEntries, year, month);

          return {
              name: `${practice.name} - Pay Period ${startDate} to ${endDate}`,
              type,
              createdAt: new Date().toISOString(),
              parameters: {...params, practiceIds: [practice.id]},
              data: {
                  practiceName: practice.name,
                  startDate,
                  endDate,
                  paymentType: practice.paymentType,
                  percentage: practice.percentage,
                  basePay: practice.basePay,
                  summary: { 
                      grossProduction: metrics.totalProduction, 
                      grossCollection: metrics.totalCollection,
                      totalAdjustments: practiceEntries.flatMap(e => e.adjustments || []).reduce((sum, adj) => sum + adj.amount, 0),
                      netProduction: metrics.totalProduction - (practiceEntries.flatMap(e => e.adjustments || []).reduce((sum, adj) => sum + adj.amount, 0)),
                      daysWorked: metrics.daysWorked,
                      calculatedPay: metrics.totalCalculatedPay,
                      totalPaymentsReceived: metrics.totalPaymentsReceived,
                      balanceDue: metrics.outstandingBalance,
                      avgProductionPerDay: metrics.avgProductionPerDay,
                      avgPayPerDay: metrics.avgPayPerDay,
                      effectiveRate: metrics.effectiveRate,
                      collectionRate: metrics.collectionRate,
                  },
                  lineItems: practiceEntries,
                  paymentItems: practicePayments,
                  payStructure: payCalc.payStructure,
                  payPeriods: payCalc.payPeriods,
              }
          };
        });
      }
      
      case 'annualSummary': {
        const year = new Date(startDate).getFullYear();
        const byPractice = relevantPractices.map(practice => {
            const practiceEntries = relevantEntries.filter(e => e.practiceId === practice.id);
            const practicePayments = relevantPayments.filter(p => p.practiceId === practice.id);
            const metrics = calculatePracticeMetrics(practice, practiceEntries, practicePayments);
            
            // Monthly breakdown
            const monthlyData = Array.from({ length: 12 }, (_, monthIndex) => {
              const monthEntries = practiceEntries.filter(e => {
                const date = new Date(e.date || e.periodStartDate);
                return date.getMonth() === monthIndex;
              });
              const monthPayments = practicePayments.filter(p => {
                const date = new Date(p.paymentDate);
                return date.getMonth() === monthIndex;
              });
              const monthMetrics = calculatePracticeMetrics(practice, monthEntries, monthPayments);
              
              return {
                month: new Date(year, monthIndex).toLocaleString('default', { month: 'long' }),
                production: monthMetrics.totalProduction,
                collection: monthMetrics.totalCollection,
                calculatedPay: monthMetrics.totalCalculatedPay,
                paymentsReceived: monthMetrics.totalPaymentsReceived,
                daysWorked: monthMetrics.daysWorked,
              };
            });
            
            return {
                practiceName: practice.name,
                paymentType: practice.paymentType,
                totalProduction: metrics.totalProduction,
                totalCollection: metrics.totalCollection,
                totalCalculatedPay: metrics.totalCalculatedPay,
                totalPaymentsReceived: metrics.totalPaymentsReceived,
                outstandingBalance: metrics.outstandingBalance,
                daysWorked: metrics.daysWorked,
                avgProductionPerDay: metrics.avgProductionPerDay,
                avgPayPerDay: metrics.avgPayPerDay,
                effectiveRate: metrics.effectiveRate,
                collectionRate: metrics.collectionRate,
                monthlyData,
            };
        });

        const overallTotals = byPractice.reduce((acc, curr) => {
            acc.totalProduction += curr.totalProduction;
            acc.totalCollection += curr.totalCollection;
            acc.totalCalculatedPay += curr.totalCalculatedPay;
            acc.totalPaymentsReceived += curr.totalPaymentsReceived;
            acc.outstandingBalance += curr.outstandingBalance;
            acc.daysWorked += curr.daysWorked;
            return acc;
        }, { totalProduction: 0, totalCollection: 0, totalCalculatedPay: 0, totalPaymentsReceived: 0, outstandingBalance: 0, daysWorked: 0 });

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
          const practicePayments = relevantPayments.filter(p => p.practiceId === practice.id);
          return calculatePracticeMetrics(practice, practiceEntries, practicePayments);
        });

        const totals = metrics.reduce((acc, m) => ({
          totalProduction: acc.totalProduction + m.totalProduction,
          totalCollection: acc.totalCollection + m.totalCollection,
          totalCalculatedPay: acc.totalCalculatedPay + m.totalCalculatedPay,
          totalPaymentsReceived: acc.totalPaymentsReceived + m.totalPaymentsReceived,
          daysWorked: acc.daysWorked + m.daysWorked,
        }), { totalProduction: 0, totalCollection: 0, totalCalculatedPay: 0, totalPaymentsReceived: 0, daysWorked: 0 });

        return [{
            name: `Practice Comparison ${startDate} to ${endDate}`,
            type,
            createdAt: new Date().toISOString(),
            parameters: params,
            data: { metrics, totals, startDate, endDate }
        }];
      }

      case 'ytdIncome': {
        const year = new Date(startDate).getFullYear();
        const currentMonth = new Date().getMonth();
        
        const practiceData = relevantPractices.map(practice => {
          const practiceEntries = relevantEntries.filter(e => e.practiceId === practice.id);
          const practicePayments = relevantPayments.filter(p => p.practiceId === practice.id);
          const metrics = calculatePracticeMetrics(practice, practiceEntries, practicePayments);
          
          return {
            practiceName: practice.name,
            totalCalculatedPay: metrics.totalCalculatedPay,
            totalPaymentsReceived: metrics.totalPaymentsReceived,
            outstandingBalance: metrics.outstandingBalance,
            daysWorked: metrics.daysWorked,
            avgPayPerDay: metrics.avgPayPerDay,
          };
        });

        const totals = practiceData.reduce((acc, p) => ({
          totalIncome: acc.totalIncome + p.totalCalculatedPay,
          totalReceived: acc.totalReceived + p.totalPaymentsReceived,
          totalOutstanding: acc.totalOutstanding + p.outstandingBalance,
          daysWorked: acc.daysWorked + p.daysWorked,
        }), { totalIncome: 0, totalReceived: 0, totalOutstanding: 0, daysWorked: 0 });

        return [{
          name: `YTD Income Report - ${year}`,
          type,
          createdAt: new Date().toISOString(),
          parameters: params,
          data: { year, currentMonth, practiceData, totals }
        }];
      }

      case 'taxSummary': {
        const year = new Date(startDate).getFullYear();
        
        const practiceData = relevantPractices.map(practice => {
          const practiceEntries = relevantEntries.filter(e => e.practiceId === practice.id);
          const practicePayments = relevantPayments.filter(p => p.practiceId === practice.id);
          
          // Quarterly breakdown
          const quarters = [
            { name: 'Q1', months: [0, 1, 2] },
            { name: 'Q2', months: [3, 4, 5] },
            { name: 'Q3', months: [6, 7, 8] },
            { name: 'Q4', months: [9, 10, 11] },
          ];

          const quarterlyData = quarters.map(q => {
            const qEntries = practiceEntries.filter(e => {
              const date = new Date(e.date || e.periodStartDate);
              return q.months.includes(date.getMonth());
            });
            const qPayments = practicePayments.filter(p => {
              const date = new Date(p.paymentDate);
              return q.months.includes(date.getMonth());
            });
            const qMetrics = calculatePracticeMetrics(practice, qEntries, qPayments);
            
            return {
              quarter: q.name,
              income: qMetrics.totalCalculatedPay,
              received: qMetrics.totalPaymentsReceived,
            };
          });

          const metrics = calculatePracticeMetrics(practice, practiceEntries, practicePayments);
          
          return {
            practiceName: practice.name,
            annualIncome: metrics.totalCalculatedPay,
            annualPaymentsReceived: metrics.totalPaymentsReceived,
            quarterlyData,
          };
        });

        const totals = practiceData.reduce((acc, p) => ({
          totalIncome: acc.totalIncome + p.annualIncome,
          totalReceived: acc.totalReceived + p.annualPaymentsReceived,
        }), { totalIncome: 0, totalReceived: 0 });

        return [{
          name: `Tax Summary - ${year}`,
          type,
          createdAt: new Date().toISOString(),
          parameters: params,
          data: { year, practiceData, totals }
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