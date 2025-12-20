import React, { useState, useEffect, useMemo } from 'react';
import styles from './PdfSummaryGenerator.module.css';
import { usePractices } from '../../../contexts/PracticeContext/PracticeContext';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';
import { calculatePay, calculateSinglePeriod } from '../../../utils/calculations';
import PdfDocument from './PdfDocument';
import { ChevronDown, Download, LoaderCircle } from 'lucide-react';

const generateYearlyPayPeriods = (practice, year, entries) => {
    if (!practice) return [];
    const periods = [];

    for (let month = 0; month < 12; month++) {
        // Get entries for this month
        const entriesForMonth = entries.filter(e => {
            if (e.practiceId !== practice.id) return false;
            const dateStr = e.entryType === 'periodSummary' ? e.periodStartDate : e.date;
            if (!dateStr) return false;
            const entryDate = new Date(`${dateStr}T00:00:00Z`);
            return entryDate.getUTCFullYear() === year && entryDate.getUTCMonth() === month;
        });

        // Use calculatePay to get the actual periods with the same logic
        const monthCalcResult = calculatePay(practice, entriesForMonth, year, month);
        
        // Only show periods that have entries
        const periodsWithEntries = monthCalcResult.payPeriods
            .filter(p => p.hasEntries)
            .map(p => ({ start: p.start, end: p.end }));

        if (periodsWithEntries.length > 0) {
            periods.push({ month: month, periods: periodsWithEntries });
        }
    }
    return periods.reverse();
};

const PdfSummaryGenerator = ({ onCancel }) => {
    const { practices, practicesVersion } = usePractices();
    const { entries } = useEntries();

    const [selectedPracticeId, setSelectedPracticeId] = useState(practices?.[0]?.id || '');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedPeriods, setSelectedPeriods] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const availablePeriodsByMonth = useMemo(() => {
        const practice = practices.find(p => p.id === selectedPracticeId);
        return generateYearlyPayPeriods(practice, selectedYear, entries);
    }, [selectedPracticeId, selectedYear, practices, entries, practicesVersion]);
    
    useEffect(() => {
        setSelectedPeriods([]);
    }, [selectedPracticeId, selectedYear]);

    /**
     * DESIGNER'S NOTE:
     * This handler is updated to enforce a maximum of 2 selections.
     * - Clicking a selected period deselects it.
     * - If fewer than 2 are selected, a new period is added.
     * - If 2 are already selected, clicking a new period replaces the oldest selection.
     * This provides a fluid user experience without hard blocks.
     */
    const handlePeriodToggle = (period) => {
        const periodKey = period.start.toISOString();
        
        setSelectedPeriods(prev => {
            const isAlreadySelected = prev.some(p => p.start.toISOString() === periodKey);

            if (isAlreadySelected) {
                return prev.filter(p => p.start.toISOString() !== periodKey);
            } 
            
            // Always sort selections to ensure chronological order.
            // This makes the "replace oldest" logic predictable.
            const updatedSelection = [...prev, period].sort((a, b) => a.start - b.start);

            if (updatedSelection.length > 2) {
                // Remove the oldest item (the first one after sorting)
                return updatedSelection.slice(1); 
            }
            
            return updatedSelection;
        });
    };
    
    // This logic remains unchanged
    const generateReportData = () => {
        if (selectedPeriods.length === 0) {
            alert("Please select at least one pay period.");
            return;
        }
        const practice = practices.find(p => p.id === selectedPracticeId);
        const periodData = selectedPeriods.map(period => {
            const year = period.start.getUTCFullYear();
            const month = period.start.getUTCMonth();
            const entriesForMonth = entries.filter(e => {
                if (e.practiceId !== practice.id) return false;
                const dateStr = e.entryType === 'periodSummary' ? e.periodStartDate : e.date;
                if (!dateStr) return false;
                const entryDate = new Date(`${dateStr}T00:00:00Z`);
                return entryDate.getUTCFullYear() === year && entryDate.getUTCMonth() === month;
            });
            const monthCalcResult = calculatePay(practice, entriesForMonth, year, month);
            
            // Find the matching period - should match exactly now
            const matchedPeriod = monthCalcResult.payPeriods.find(calculatedPeriod => 
                calculatedPeriod.start.toISOString() === period.start.toISOString() &&
                calculatedPeriod.end.toISOString() === period.end.toISOString()
            );
            
            if (!matchedPeriod) {
                console.warn('No matching period found for:', period);
                return null;
            }
            
            if (matchedPeriod) {
                const entriesInThisExactPeriod = entries.filter(e => {
                    if (e.practiceId !== practice.id) return false;
                    const dateStr = e.entryType === 'periodSummary' ? e.periodStartDate : e.date;
                    if (!dateStr) return false;
                    const entryDate = new Date(`${dateStr}T00:00:00Z`);
                     if (e.entryType === 'periodSummary') {
                         const entryEndDate = new Date(`${e.periodEndDate}T00:00:00Z`);
                         return entryDate <= matchedPeriod.end && entryEndDate >= matchedPeriod.start;
                     }
                    return entryDate >= matchedPeriod.start && entryDate <= matchedPeriod.end;
                });
                
                // Get attendance entries for this period (for half-day support in calendar)
                const attendanceEntriesInPeriod = entriesInThisExactPeriod.filter(e => 
                    e.entryType === 'attendanceRecord' && e.date
                );
                
                const singlePeriodCalc = calculateSinglePeriod(practice, entriesInThisExactPeriod);
                return {
                    period: { start: matchedPeriod.start, end: matchedPeriod.end },
                    ...singlePeriodCalc,
                    attendanceEntries: attendanceEntriesInPeriod // Add this for the mini calendar
                };
            }
            return null;
        }).filter(Boolean);
        
        if (periodData.length === 0) {
            alert("No matching periods found. Please try different selections.");
            return;
        }
        
        setReportData({ practice, periods: periodData.sort((a, b) => a.period.start - b.period.start) });
    };

    // This PDF generation logic remains unchanged
    useEffect(() => {
        if (reportData) {
            const generateAndSavePdf = async () => {
                setIsGenerating(true);
                const reportElement = document.getElementById('pdf-document');
                if (reportElement) {
                    try {
                        const { jsPDF } = window.jspdf;
                        const html2canvas = window.html2canvas;
                        const canvas = await html2canvas(reportElement, { scale: 2 });
                        const imgData = canvas.toDataURL('image/png');
                        const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
                        const pdfWidth = pdf.internal.pageSize.getWidth();
                        const canvasAspectRatio = canvas.width / canvas.height;
                        const pdfHeight = pdfWidth / canvasAspectRatio;
                        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                        const pdfBase64 = pdf.output('datauristring').split(',')[1];
                        const formatDateForFilename = (date) => {
                            const d = new Date(date);
                            const year = d.getUTCFullYear();
                            const month = String(d.getUTCMonth() + 1).padStart(2, '0');
                            const day = String(d.getUTCDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                        }
                        
                        // Safety check for periods array
                        if (!reportData.periods || reportData.periods.length === 0) {
                            throw new Error("No periods found in report data");
                        }
                        
                        const overallStartDate = reportData.periods[0].period.start;
                        const overallEndDate = reportData.periods[reportData.periods.length - 1].period.end;
                        const suggestedName = `${reportData.practice.name}_Summary_${formatDateForFilename(overallStartDate)}_to_${formatDateForFilename(overallEndDate)}.pdf`;
                        await window.electronAPI.savePdf(pdfBase64, suggestedName);
                    } catch (error) {
                        console.error("PDF generation failed:", error);
                    } finally {
                        setIsGenerating(false);
                        setReportData(null);
                        onCancel();
                    }
                }
            };
            generateAndSavePdf();
        }
    }, [reportData, onCancel]);

    return (
        <div className={styles.modalContainer}>
            {/* DESIGNER'S NOTE: The UI is split into a configuration panel and a selection panel. */}
            <div className={styles.configPanel}>
                <h3 className={styles.title}>Generate PDF Summary</h3>
                <p className={styles.subtitle}>Select up to two pay periods to include in the report.</p>
                <div className={styles.formGroup}>
                    <label htmlFor="practiceSelect">Practice</label>
                    <div className={styles.selectWrapper}>
                        <select id="practiceSelect" value={selectedPracticeId} onChange={e => setSelectedPracticeId(parseInt(e.target.value))}>
                            {(practices || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <ChevronDown size={20} className={styles.selectIcon} />
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label>Year</label>
                    <div className={styles.selectWrapper}>
                         <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
                            {[...Array(5)].map((_, i) => {
                                const year = new Date().getFullYear() - i;
                                return <option key={year} value={year}>{year}</option>
                            })}
                        </select>
                        <ChevronDown size={20} className={styles.selectIcon} />
                    </div>
                </div>
            </div>

            <div className={styles.periodsPanel}>
                <div className={styles.scrollContainer}>
                    {availablePeriodsByMonth.length > 0 ? availablePeriodsByMonth.map(({ month, periods }) => (
                        <div key={month} className={styles.monthGroup}>
                            <h5 className={styles.monthHeader}>{new Date(selectedYear, month).toLocaleString('default', { month: 'long' })}</h5>
                            <div className={styles.periodList}>
                                {periods.map(period => {
                                    const periodKey = period.start.toISOString();
                                    const isSelected = selectedPeriods.some(p => p.start.toISOString() === periodKey);
                                    // Disable non-selected items when the max is reached
                                    const isDisabled = !isSelected && selectedPeriods.length >= 2;
                                    
                                    return (
                                        <div 
                                            key={periodKey} 
                                            className={`${styles.periodItem} ${isSelected ? styles.selected : ''} ${isDisabled ? styles.disabled : ''}`} 
                                            onClick={() => !isDisabled && handlePeriodToggle(period)}
                                        >
                                            {period.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} - {period.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )) : <p className={styles.noPeriods}>No work logged for this practice in {selectedYear}.</p>}
                </div>
            </div>

            <div className={styles.actions}>
                <button onClick={onCancel} className={styles.cancelButton}>Cancel</button>
                <button onClick={generateReportData} className={styles.generateButton} disabled={isGenerating || selectedPeriods.length === 0}>
                    {isGenerating ? <LoaderCircle size={18} className={styles.spinner}/> : <Download size={18}/>}
                    {isGenerating ? 'Generating...' : `Generate PDF (${selectedPeriods.length})`}
                </button>
            </div>

            {reportData && <div style={{ position: 'fixed', left: '-2000px', top: 0, zIndex: -1 }}><PdfDocument {...reportData} /></div>}
        </div>
    );
};

export default PdfSummaryGenerator;