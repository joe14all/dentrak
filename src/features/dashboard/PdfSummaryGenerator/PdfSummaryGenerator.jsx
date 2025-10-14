import React, { useState, useEffect, useMemo } from 'react';
import styles from './PdfSummaryGenerator.module.css';
import { usePractices } from '../../../contexts/PracticeContext/PracticeContext';
import { useEntries } from '../../../contexts/EntryContext/EntryContext';

import { calculateSinglePeriod } from '../../../utils/calculations'; 
import PdfDocument from './PdfDocument';
import { ChevronDown, Download, LoaderCircle } from 'lucide-react';

const generateYearlyPayPeriods = (practice, year) => {
    if (!practice) return [];
    const periods = [];
    for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        switch (practice.payCycle) {
            case 'monthly':
                periods.push({ start: new Date(Date.UTC(year, month, 1)), end: new Date(Date.UTC(year, month, daysInMonth)) });
                break;
            case 'bi-weekly':
                periods.push({ start: new Date(Date.UTC(year, month, 1)), end: new Date(Date.UTC(year, month, 15)) });
                periods.push({ start: new Date(Date.UTC(year, month, 16)), end: new Date(Date.UTC(year, month, daysInMonth)) });
                break;
            default: break;
        }
    }
    return periods;
};

const PdfSummaryGenerator = ({ onCancel }) => {
    const { practices } = usePractices();
    const { entries } = useEntries();

    const [selectedPracticeId, setSelectedPracticeId] = useState(practices?.[0]?.id || '');
    const [selectedPeriods, setSelectedPeriods] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const availablePeriods = useMemo(() => {
        const practice = practices.find(p => p.id === selectedPracticeId);
        return generateYearlyPayPeriods(practice, new Date().getFullYear());
    }, [selectedPracticeId, practices]);

    const handlePeriodToggle = (period) => {
        const periodKey = period.start.toISOString();
        setSelectedPeriods(prev => 
            prev.some(p => p.start.toISOString() === periodKey)
                ? prev.filter(p => p.start.toISOString() !== periodKey)
                : [...prev, period]
        );
    };

    const generateReportData = () => {
        if (selectedPeriods.length === 0) {
            alert("Please select at least one pay period.");
            return;
        }
        
        const practice = practices.find(p => p.id === selectedPracticeId);
        const periodData = selectedPeriods.map(period => {
            const entriesInPeriod = entries.filter(e => {
                const date = new Date(`${e.date || e.periodStartDate}T00:00:00Z`);
                return e.practiceId === practice.id && date >= period.start && date <= period.end;
            });
            // THE FIX: Use the simpler, more direct calculation function.
            const calcResult = calculateSinglePeriod(practice, entriesInPeriod);
            return { period, ...calcResult };
        });
        
        setReportData({ practice, periods: periodData });
    };

    useEffect(() => {
        if (reportData) {
            const generateAndSavePdf = async () => {
                setIsGenerating(true);
                const reportElement = document.getElementById('pdf-document');
                const { jsPDF } = window.jspdf;
                const html2canvas = window.html2canvas;

                if (reportElement && jsPDF && html2canvas) {
                    try {
                        const canvas = await html2canvas(reportElement, { scale: 2 });
                        const imgData = canvas.toDataURL('image/png');
                        const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
                        const pdfWidth = pdf.internal.pageSize.getWidth();
                        
                        const canvasAspectRatio = canvas.width / canvas.height;
                        const finalCanvasHeight = pdfWidth / canvasAspectRatio;

                        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, finalCanvasHeight);
                        
                        const pdfBase64 = pdf.output('datauristring').split(',')[1];
                        const suggestedName = `${reportData.practice.name}_Summary_${new Date().toISOString().split('T')[0]}.pdf`;

                        const result = await window.electronAPI.savePdf(pdfBase64, suggestedName);
                        if (result.success) {
                            console.log(`PDF saved to: ${result.path}`);
                        } else {
                            console.log(result.message);
                        }
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
        <div className={styles.panel}>
            <div className={styles.formGroup}>
                <label htmlFor="practiceSelect">1. Select a Practice</label>
                <div className={styles.selectWrapper}>
                    <select id="practiceSelect" value={selectedPracticeId} onChange={e => setSelectedPracticeId(parseInt(e.target.value))}>
                        {(practices || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <ChevronDown size={20} className={styles.selectIcon} />
                </div>
            </div>
            <div className={styles.formGroup}>
                <label>2. Select Pay Periods to Include</label>
                <div className={styles.periodList}>
                    {availablePeriods.map((period) => {
                         const periodKey = period.start.toISOString();
                         const isSelected = selectedPeriods.some(p => p.start.toISOString() === periodKey);
                         return (
                            <div key={periodKey} className={`${styles.periodItem} ${isSelected ? styles.selected : ''}`} onClick={() => handlePeriodToggle(period)}>
                                {period.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} - {period.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                            </div>
                         )
                    })}
                </div>
            </div>
             <div className={styles.actions}>
                <button onClick={onCancel} className={styles.cancelButton}>Cancel</button>
                <button onClick={generateReportData} className={styles.generateButton} disabled={isGenerating}>
                    {isGenerating ? <LoaderCircle size={16} className={styles.spinner}/> : <Download size={16}/>}
                    {isGenerating ? 'Generating...' : 'Generate PDF'}
                </button>
            </div>

            {reportData && <div style={{ position: 'fixed', left: '-2000px', top: 0 }}><PdfDocument {...reportData} /></div>}
        </div>
    );
};

export default PdfSummaryGenerator;

