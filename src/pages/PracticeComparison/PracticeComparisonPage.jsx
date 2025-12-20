import React, { useState, useMemo } from 'react';
import styles from './PracticeComparisonPage.module.css';
import { usePractices } from '../../contexts/PracticeContext/PracticeContext';
import { useEntries } from '../../contexts/EntryContext/EntryContext';
import { usePayments } from '../../contexts/PaymentContext/PaymentContext';
import { comparePractices } from '../../utils/practiceComparison';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis } from 'recharts';
import { TrendingUp, Calendar, Download, Award, DollarSign, Activity, Target, Clock, Percent } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PracticeComparisonPage = () => {
  const { practices } = usePractices();
  const { entries } = useEntries();
  const { payments } = usePayments();

  // Date range state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPractices, setSelectedPractices] = useState(() => practices.map(p => p.id));

  // Calculate comparison data with filters
  const comparisonData = useMemo(() => {
    const options = {
      practiceIds: selectedPractices, // Always pass the array, even if empty
      startDate: startDate || null,
      endDate: endDate || null,
      activeOnly: false, // Show all practices based on selection
    };

    console.log('Practice filter - selectedPractices:', selectedPractices);
    console.log('Comparison options:', options);

    return comparePractices(practices, entries, payments, options);
  }, [practices, entries, payments, selectedPractices, startDate, endDate]);

  const { metrics = [], totals = {}, rankings = {}, insights = [] } = comparisonData || {};

  // Safely access totals with defaults
  const safeTotals = {
    totalPay: totals?.totalCalculatedPay || 0,
    totalProduction: totals?.totalProduction || 0,
    totalCollection: totals?.totalCollection || 0,
    totalDays: totals?.daysWorked || 0,
  };

  // Prepare chart data
  const barChartData = metrics.map(m => ({
    name: m.practiceName,
    'Total Pay': m.totalCalculatedPay || 0,
    'Production': m.totalProduction || 0,
    'Collection': m.totalCollection || 0,
  }));

  const lineChartData = metrics.map(m => ({
    name: m.practiceName,
    'Avg Pay/Day': m.avgPayPerDay || 0,
    'Avg Production/Day': m.avgProductionPerDay || 0,
  }));

  const radarChartData = metrics.map(m => ({
    practice: m.practiceName,
    'Total Pay': (m.totalCalculatedPay || 0) / 1000, // Normalize to thousands
    'Days Worked': m.daysWorked || 0,
    'Avg Pay/Day': (m.avgPayPerDay || 0) / 100, // Normalize
    'Effective Rate': m.effectiveRate || 0,
  }));

  const scatterData = metrics.map(m => ({
    name: m.practiceName,
    x: m.daysWorked || 0,
    y: m.avgPayPerDay || 0,
    z: m.totalCalculatedPay || 0,
  }));

  // Quick preset filters
  const applyPreset = (preset) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    switch (preset) {
      case 'ytd':
        setStartDate(new Date(currentYear, 0, 1).toISOString().split('T')[0]);
        setEndDate(now.toISOString().split('T')[0]);
        break;
      case 'last3months': {
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        setStartDate(threeMonthsAgo.toISOString().split('T')[0]);
        setEndDate(now.toISOString().split('T')[0]);
        break;
      }
      case 'last6months': {
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        setStartDate(sixMonthsAgo.toISOString().split('T')[0]);
        setEndDate(now.toISOString().split('T')[0]);
        break;
      }
      case 'lastyear':
        setStartDate(new Date(currentYear - 1, 0, 1).toISOString().split('T')[0]);
        setEndDate(new Date(currentYear - 1, 11, 31).toISOString().split('T')[0]);
        break;
      case 'all':
        setStartDate('');
        setEndDate('');
        break;
      default:
        break;
    }
  };

  // Toggle practice selection
  const togglePractice = (practiceId) => {
    setSelectedPractices(prev => {
      if (prev.includes(practiceId)) {
        return prev.filter(id => id !== practiceId);
      } else {
        return [...prev, practiceId];
      }
    });
  };

  // Select all/none practices
  const selectAllPractices = () => {
    setSelectedPractices(practices.map(p => p.id));
  };

  const clearPracticeSelection = () => {
    setSelectedPractices([]);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Helper function to add page number
    const addPageNumber = () => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
      }
      doc.setTextColor(0, 0, 0);
    };

    // Header with logo area
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('Practice Performance Comparison', 14, 15);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    const dateRange = startDate && endDate 
      ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
      : 'All Time';
    doc.text(`Analysis Period: ${dateRange}`, 14, 23);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 29);
    
    doc.setTextColor(0, 0, 0);
    let yPos = 45;

    // Executive Summary Section
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('Executive Summary', 14, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 8;

    // Summary boxes
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    const summaryBoxWidth = (pageWidth - 38) / 4;
    const summaryBoxHeight = 20;
    const summaryBoxY = yPos;
    
    // Box 1: Total Income
    doc.setFillColor(240, 249, 255);
    doc.roundedRect(14, summaryBoxY, summaryBoxWidth, summaryBoxHeight, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('Total Income', 16, summaryBoxY + 6);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text(`$${safeTotals.totalPay.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 16, summaryBoxY + 15);
    
    // Box 2: Total Production
    doc.setFont(undefined, 'normal');
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(14 + summaryBoxWidth + 4, summaryBoxY, summaryBoxWidth, summaryBoxHeight, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('Total Production', 16 + summaryBoxWidth + 4, summaryBoxY + 6);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(`$${safeTotals.totalProduction.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 16 + summaryBoxWidth + 4, summaryBoxY + 15);
    
    // Box 3: Total Days
    doc.setFont(undefined, 'normal');
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(14 + (summaryBoxWidth + 4) * 2, summaryBoxY, summaryBoxWidth, summaryBoxHeight, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('Total Days', 16 + (summaryBoxWidth + 4) * 2, summaryBoxY + 6);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(245, 158, 11);
    doc.text(`${safeTotals.totalDays}`, 16 + (summaryBoxWidth + 4) * 2, summaryBoxY + 15);
    
    // Box 4: Avg Effective Rate
    doc.setFont(undefined, 'normal');
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(14 + (summaryBoxWidth + 4) * 3, summaryBoxY, summaryBoxWidth, summaryBoxHeight, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('Avg Eff. Rate', 16 + (summaryBoxWidth + 4) * 3, summaryBoxY + 6);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(107, 114, 128);
    doc.text(`${(safeTotals.totalPay / safeTotals.totalProduction * 100 || 0).toFixed(1)}%`, 16 + (summaryBoxWidth + 4) * 3, summaryBoxY + 15);
    
    yPos = summaryBoxY + summaryBoxHeight + 12;
    doc.setTextColor(0, 0, 0);

    // Key Insights Section
    if (insights.length > 0) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text('Key Insights', 14, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 7;

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      insights.filter(insight => insight.practice && insight.practice !== 'undefined').slice(0, 6).forEach((insight, idx) => {
        let value = '';
        if (insight.value !== undefined && insight.value !== null) {
          if (insight.isPercentage) {
            value = ` - ${insight.value.toFixed(1)}%`;
          } else if (insight.metric === 'Days Worked') {
            value = ` - ${insight.value} days`;
          } else if (typeof insight.value === 'number') {
            value = ` - $${insight.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
          } else {
            value = ` - ${insight.value}`;
          }
        }
        
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(14, yPos - 4, pageWidth - 28, 8, 1, 1, 'F');
        
        doc.setFont(undefined, 'bold');
        doc.setTextColor(59, 130, 246);
        doc.text(`${idx + 1}.`, 16, yPos);
        
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`${insight.title}:`, 22, yPos);
        
        doc.setFont(undefined, 'bold');
        doc.text(`${insight.practice}${value}`, 70, yPos);
        
        yPos += 10;
      });
      yPos += 5;
    }

    // Detailed Metrics Table
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('Detailed Practice Metrics', 14, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 7;

    const detailedTableData = metrics.map(m => [
      m.practiceName,
      m.daysWorked || 0,
      `$${(m.totalCalculatedPay || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      `$${(m.avgPayPerDay || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      `$${(m.totalProduction || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      `$${(m.avgProductionPerDay || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      `${(m.effectiveRate || 0).toFixed(1)}%`,
      `${(m.incomeContribution || 0).toFixed(1)}%`,
    ]);

    // Add totals row
    detailedTableData.push([
      'TOTAL',
      safeTotals.totalDays,
      `$${safeTotals.totalPay.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      `$${(safeTotals.totalPay / safeTotals.totalDays || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      `$${safeTotals.totalProduction.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      `$${(safeTotals.totalProduction / safeTotals.totalDays || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      `${(safeTotals.totalPay / safeTotals.totalProduction * 100 || 0).toFixed(1)}%`,
      '100%',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Practice', 'Days', 'Total Pay', 'Avg/Day', 'Production', 'Avg Prod/Day', 'Eff. Rate', 'Income %']],
      body: detailedTableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [59, 130, 246],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 35 },
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'center' },
        7: { halign: 'center' },
      },
      didParseCell: function(data) {
        if (data.row.index === detailedTableData.length - 1) {
          data.cell.styles.fillColor = [243, 244, 246];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      didDrawPage: function(data) {
        yPos = data.cursor.y;
      }
    });

    // Performance Rankings Section
    yPos = yPos + 12;
    
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('Performance Rankings', 14, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 8;

    const rankingLabels = {
      byTotalPay: 'By Total Income',
      byAvgPayPerDay: 'By Daily Rate',
      byProduction: 'By Production',
      byEffectiveRate: 'By Effective Rate',
      byDaysWorked: 'By Days Worked',
    };

    Object.entries(rankings).forEach(([key, practices]) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text(`${rankingLabels[key]}`, 14, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 6;

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      
      (practices || []).slice(0, 5).forEach((practice, idx) => {
        if (practice) {
          const rankNumber = `${idx + 1}.`;
          
          let valueText = '';
          if (key === 'byTotalPay') {
            valueText = `$${(practice.totalCalculatedPay || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
          } else if (key === 'byAvgPayPerDay') {
            valueText = `$${(practice.avgPayPerDay || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/day`;
          } else if (key === 'byProduction') {
            valueText = `$${(practice.totalProduction || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
          } else if (key === 'byEffectiveRate') {
            valueText = `${(practice.effectiveRate || 0).toFixed(1)}%`;
          } else if (key === 'byDaysWorked') {
            valueText = `${practice.daysWorked || 0} days`;
          }

          doc.setFillColor(idx < 3 ? 249 : 255, idx < 3 ? 250 : 255, idx < 3 ? 251 : 255);
          doc.roundedRect(14, yPos - 4, pageWidth - 28, 7, 1, 1, 'F');
          
          doc.setFont(undefined, 'bold');
          doc.setTextColor(59, 130, 246);
          doc.text(rankNumber, 16, yPos);
          doc.setTextColor(0, 0, 0);
          doc.text(practice.practiceName, 24, yPos);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(107, 114, 128);
          doc.text(valueText, pageWidth - 16, yPos, { align: 'right' });
          doc.setTextColor(0, 0, 0);
          
          yPos += 8;
        }
      });
      yPos += 4;
    });

    // Footer with analysis notes
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(14, yPos, pageWidth - 14, yPos);
    yPos += 8;

    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.setFont(undefined, 'italic');
    doc.text('Notes:', 14, yPos);
    yPos += 5;
    doc.setFont(undefined, 'normal');
    doc.text('• Effective Rate = (Total Pay / Total Production) × 100', 14, yPos);
    yPos += 4;
    doc.text('• Income % represents each practice\'s contribution to total income', 14, yPos);
    yPos += 4;
    doc.text('• Rankings are based on the selected date range and practices', 14, yPos);
    yPos += 4;
    doc.text('• This report was generated by Dentrak Practice Performance Analysis System', 14, yPos);

    // Add page numbers
    addPageNumber();

    // Save PDF
    const fileName = `Practice_Comparison_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <TrendingUp size={32} />
          <div>
            <h1>Practice Performance Comparison</h1>
            <p>Analyze and compare performance across all practices</p>
          </div>
        </div>
        <button className={styles.exportButton} onClick={exportToPDF}>
          <Download size={18} />
          Export PDF Report
        </button>
      </div>

      {/* Filters Section */}
      <div className={styles.filtersCard}>
        <div className={styles.filterSection}>
          <h3><Calendar size={20} /> Date Range</h3>
          <div className={styles.presetButtons}>
            <button onClick={() => applyPreset('ytd')}>YTD</button>
            <button onClick={() => applyPreset('last3months')}>Last 3 Months</button>
            <button onClick={() => applyPreset('last6months')}>Last 6 Months</button>
            <button onClick={() => applyPreset('lastyear')}>Last Year</button>
            <button onClick={() => applyPreset('all')}>All Time</button>
          </div>
          <div className={styles.customDateRange}>
            <div className={styles.dateInput}>
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className={styles.dateInput}>
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={styles.filterSection}>
          <h3><Target size={20} /> Select Practices</h3>
          <div className={styles.practiceFilters}>
            <div className={styles.practiceButtons}>
              <button onClick={selectAllPractices}>Select All</button>
              <button onClick={clearPracticeSelection}>Clear All</button>
            </div>
            <div className={styles.practiceCheckboxes}>
              {practices.map(practice => (
                <label key={practice.id} className={styles.practiceCheckbox}>
                  <input
                    type="checkbox"
                    checked={selectedPractices.includes(practice.id)}
                    onChange={() => togglePractice(practice.id)}
                  />
                  <span>{practice.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <DollarSign size={24} />
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Total Income</span>
            <span className={styles.summaryValue}>
              ${safeTotals.totalPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <Activity size={24} />
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Total Production</span>
            <span className={styles.summaryValue}>
              ${safeTotals.totalProduction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <Clock size={24} />
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Total Days Worked</span>
            <span className={styles.summaryValue}>{safeTotals.totalDays}</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <Percent size={24} />
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Avg Effective Rate</span>
            <span className={styles.summaryValue}>
              {(safeTotals.totalPay / safeTotals.totalProduction * 100 || 0).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className={styles.insightsCard}>
        <h2><Award size={24} /> Key Insights</h2>
        <div className={styles.insightsList}>
          {insights.map((insight, idx) => (
            <div key={idx} className={styles.insightItem}>
              <div className={styles.insightRank}>{idx + 1}</div>
              <div className={styles.insightDetails}>
                <span className={styles.insightTitle}>{insight.title}</span>
                <span className={styles.insightPractice}>{insight.practice}</span>
                {insight.value && (
                  <span className={styles.insightValue}>
                    {typeof insight.value === 'number' 
                      ? `$${insight.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : insight.value}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Bar Chart: Total Income vs Production */}
        <div className={styles.chartCard}>
          <h3>Income & Production Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="Total Pay" fill="#3b82f6" />
              <Bar dataKey="Production" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart: Average Daily Rates */}
        <div className={styles.chartCard}>
          <h3>Average Daily Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="Avg Pay/Day" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="Avg Production/Day" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart: Multi-metric comparison */}
        <div className={styles.chartCard}>
          <h3>Multi-Metric Performance Radar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarChartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="practice" />
              <PolarRadiusAxis />
              <Radar name="Performance" dataKey="Total Pay" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Scatter Chart: Days vs Daily Rate */}
        <div className={styles.chartCard}>
          <h3>Days Worked vs Daily Rate</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="x" name="Days Worked" />
              <YAxis type="number" dataKey="y" name="Avg Pay/Day" />
              <ZAxis type="number" dataKey="z" name="Total Pay" range={[100, 1000]} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                formatter={(value, name) => {
                  if (name === 'Days Worked') return value;
                  return `$${value.toLocaleString()}`;
                }}
                labelFormatter={(value) => scatterData[value]?.name || 'Practice'}
              />
              <Scatter name="Practices" data={scatterData} fill="#3b82f6" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className={styles.tableCard}>
        <h2>Detailed Metrics</h2>
        <div className={styles.tableContainer}>
          <table className={styles.metricsTable}>
            <thead>
              <tr>
                <th>Practice</th>
                <th>Days Worked</th>
                <th>Total Pay</th>
                <th>Avg Pay/Day</th>
                <th>Total Production</th>
                <th>Avg Prod/Day</th>
                <th>Total Collection</th>
                <th>Effective Rate</th>
                <th>Income %</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.practiceId}>
                  <td className={styles.practiceName}>{m.practiceName}</td>
                  <td>{m.daysWorked || 0}</td>
                  <td className={styles.currency}>
                    ${(m.totalCalculatedPay || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={styles.currency}>
                    ${(m.avgPayPerDay || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={styles.currency}>
                    ${(m.totalProduction || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={styles.currency}>
                    ${(m.avgProductionPerDay || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={styles.currency}>
                    ${(m.totalCollection || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={styles.percentage}>{(m.effectiveRate || 0).toFixed(1)}%</td>
                  <td className={styles.percentage}>{(m.incomeContribution || 0).toFixed(1)}%</td>
                </tr>
              ))}
              <tr className={styles.totalRow}>
                <td><strong>Total</strong></td>
                <td><strong>{safeTotals.totalDays}</strong></td>
                <td className={styles.currency}>
                  <strong>${safeTotals.totalPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </td>
                <td className={styles.currency}>
                  <strong>${(safeTotals.totalPay / safeTotals.totalDays || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </td>
                <td className={styles.currency}>
                  <strong>${safeTotals.totalProduction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </td>
                <td className={styles.currency}>
                  <strong>${(safeTotals.totalProduction / safeTotals.totalDays || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </td>
                <td className={styles.currency}>
                  <strong>${(safeTotals.totalCollection || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </td>
                <td className={styles.percentage}>
                  <strong>{(safeTotals.totalPay / safeTotals.totalProduction * 100 || 0).toFixed(1)}%</strong>
                </td>
                <td className={styles.percentage}><strong>100%</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Rankings Section */}
      <div className={styles.rankingsCard}>
        <h2>Performance Rankings</h2>
        <div className={styles.rankingsGrid}>
          <div className={styles.rankingColumn}>
            <h3>By Total Income</h3>
            <ol>
              {(rankings.byTotalPay || []).map(practice => (
                <li key={practice.practiceId}>
                  <span>{practice.practiceName}</span>
                  <span>${(practice.totalCalculatedPay || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.rankingColumn}>
            <h3>By Daily Rate</h3>
            <ol>
              {(rankings.byAvgPayPerDay || []).map(practice => (
                <li key={practice.practiceId}>
                  <span>{practice.practiceName}</span>
                  <span>${(practice.avgPayPerDay || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.rankingColumn}>
            <h3>By Production</h3>
            <ol>
              {(rankings.byProduction || []).map(practice => (
                <li key={practice.practiceId}>
                  <span>{practice.practiceName}</span>
                  <span>${(practice.totalProduction || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.rankingColumn}>
            <h3>By Effective Rate</h3>
            <ol>
              {(rankings.byEffectiveRate || []).map(practice => (
                <li key={practice.practiceId}>
                  <span>{practice.practiceName}</span>
                  <span>{(practice.effectiveRate || 0).toFixed(1)}%</span>
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.rankingColumn}>
            <h3>By Days Worked</h3>
            <ol>
              {(rankings.byDaysWorked || []).map(practice => (
                <li key={practice.practiceId}>
                  <span>{practice.practiceName}</span>
                  <span>{practice.daysWorked || 0} days</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeComparisonPage;
