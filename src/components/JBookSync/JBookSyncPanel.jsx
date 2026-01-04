/**
 * JBookSyncPanel Component
 * 
 * UI component for managing synchronization with JBook.
 * Shows connection status, sync button, and results.
 */

import { useState, useEffect } from 'react';
import { useJBookSync } from '../../contexts/JBookSyncContext/JBookSyncContext';
import './JBookSyncPanel.css';

function JBookSyncPanel() {
  const {
    isConnected,
    isChecking,
    isSyncing,
    isSyncingInvoices,
    lastSyncResult,
    lastInvoiceSyncResult,
    financialSummary,
    error,
    checkConnection,
    syncToJBook,
    syncAllInvoices,
    refreshFinancialSummary,
    selectedYears,
    setSelectedYears,
    getAvailableYears,
  } = useJBookSync();

  const [availableYears, setAvailableYears] = useState([]);
  const [isLoadingYears, setIsLoadingYears] = useState(false);

  // Load available years on mount
  useEffect(() => {
    const loadYears = async () => {
      setIsLoadingYears(true);
      const years = await getAvailableYears();
      setAvailableYears(years);
      setIsLoadingYears(false);
    };
    loadYears();
  }, [getAvailableYears]);

  const toggleYear = (year) => {
    setSelectedYears(prev => {
      if (prev.includes(year)) {
        return prev.filter(y => y !== year);
      } else {
        return [...prev, year].sort((a, b) => a - b);
      }
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="jbook-sync-panel">
      <div className="sync-header">
        <h3>📊 JBook Integration</h3>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          <span className="status-text">
            {isChecking ? 'Checking...' : isConnected ? 'Connected' : 'Not Connected'}
          </span>
        </div>
      </div>

      {error && (
        <div className="sync-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}

      <div className="sync-actions">
        <button
          className="sync-btn primary"
          onClick={syncToJBook}
          disabled={isSyncing || isSyncingInvoices || !isConnected}
        >
          {isSyncing ? (
            <>
              <span className="spinner"></span>
              Syncing...
            </>
          ) : (
            <>
              <span>🔄</span>
              Sync Data
            </>
          )}
        </button>
        
        {/* Year Selection for Invoice Sync */}
        <div className="year-selection">
          <label className="year-selection-label">📅 Years to Import:</label>
          <div className="year-chips">
            {isLoadingYears ? (
              <span className="loading-years">Loading...</span>
            ) : availableYears.length > 0 ? (
              availableYears.map(year => (
                <button
                  key={year}
                  className={`year-chip ${selectedYears.includes(year) ? 'selected' : ''}`}
                  onClick={() => toggleYear(year)}
                  disabled={isSyncingInvoices}
                >
                  {year}
                </button>
              ))
            ) : (
              <span className="no-years">No data found</span>
            )}
          </div>
          {selectedYears.length === 0 && (
            <span className="year-warning">⚠️ Select at least one year</span>
          )}
        </div>
        
        <button
          className="sync-btn invoice"
          onClick={() => syncAllInvoices()}
          disabled={isSyncingInvoices || isSyncing || !isConnected || selectedYears.length === 0}
        >
          {isSyncingInvoices ? (
            <>
              <span className="spinner"></span>
              Creating Invoices...
            </>
          ) : (
            <>
              <span>📄</span>
              Sync Invoices ({selectedYears.length} year{selectedYears.length !== 1 ? 's' : ''})
            </>
          )}
        </button>
        
        <button
          className="sync-btn secondary"
          onClick={checkConnection}
          disabled={isChecking}
        >
          {isChecking ? 'Checking...' : '🔌 Check Connection'}
        </button>
      </div>

      {/* Invoice Sync Result */}
      {lastInvoiceSyncResult && (
        <div className={`invoice-sync-result ${lastInvoiceSyncResult.success ? 'success' : 'error'}`}>
          <h4>📄 Invoice Sync</h4>
          <div className="result-time">{formatDate(lastInvoiceSyncResult.timestamp)}</div>
          <p className="result-message">{lastInvoiceSyncResult.message}</p>
          
          {lastInvoiceSyncResult.created > 0 && (
            <div className="result-detail">
              ✅ Created {lastInvoiceSyncResult.created} draft invoice{lastInvoiceSyncResult.created !== 1 ? 's' : ''}
            </div>
          )}
          {lastInvoiceSyncResult.skipped > 0 && (
            <div className="result-detail">
              ⏭️ Skipped {lastInvoiceSyncResult.skipped} (already exist)
            </div>
          )}
          {lastInvoiceSyncResult.errors?.length > 0 && (
            <div className="result-errors">
              {lastInvoiceSyncResult.errors.slice(0, 3).map((err, i) => (
                <div key={i} className="error-item">⚠️ {err}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {lastSyncResult && (
        <div className="sync-result">
          <h4>Last Sync Result</h4>
          <div className="result-time">{formatDate(lastSyncResult.timestamp)}</div>
          
          <div className="result-stats">
            {lastSyncResult.practices && (
              <div className="stat-item">
                <span className="stat-label">Practices</span>
                <span className="stat-value">
                  {lastSyncResult.practices.synced} synced, {lastSyncResult.practices.skipped} existing
                </span>
              </div>
            )}
            {lastSyncResult.payments && (
              <div className="stat-item">
                <span className="stat-label">Payments</span>
                <span className="stat-value">
                  {lastSyncResult.payments.synced} synced, {lastSyncResult.payments.skipped} existing
                </span>
              </div>
            )}
            {lastSyncResult.expenses && (
              <div className="stat-item">
                <span className="stat-label">Expenses</span>
                <span className="stat-value">
                  {lastSyncResult.expenses.synced} synced, {lastSyncResult.expenses.skipped} existing
                </span>
              </div>
            )}
          </div>

          {lastSyncResult.errors?.length > 0 && (
            <div className="sync-errors">
              <h5>Errors ({lastSyncResult.errors.length})</h5>
              <ul>
                {lastSyncResult.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {lastSyncResult.errors.length > 5 && (
                  <li>...and {lastSyncResult.errors.length - 5} more</li>
                )}
              </ul>
            </div>
          )}

          {lastSyncResult.excluded && (lastSyncResult.excluded.employeePractices > 0 || lastSyncResult.excluded.employeePayments > 0) && (
            <div className="sync-excluded">
              <h5>📋 Excluded (Employee Data)</h5>
              <p className="excluded-note">
                {lastSyncResult.excluded.employeePractices} employee practice(s) and {lastSyncResult.excluded.employeePayments} related payment(s) were not synced.
                <br />
                <small>JBook tracks contractor income only.</small>
              </p>
            </div>
          )}
        </div>
      )}

      {financialSummary && (
        <div className="financial-summary">
          <h4>JBook Financial Summary ({financialSummary.year})</h4>
          <div className="summary-grid">
            <div className="summary-item income">
              <span className="summary-label">Total Income</span>
              <span className="summary-value">{formatCurrency(financialSummary.totalIncome)}</span>
            </div>
            <div className="summary-item expenses">
              <span className="summary-label">Total Expenses</span>
              <span className="summary-value">{formatCurrency(financialSummary.totalExpenses)}</span>
            </div>
            <div className="summary-item profit">
              <span className="summary-label">Net Profit</span>
              <span className="summary-value">{formatCurrency(financialSummary.netProfit)}</span>
            </div>
          </div>
          <button className="refresh-btn" onClick={refreshFinancialSummary}>
            🔄 Refresh Summary
          </button>
        </div>
      )}

      <div className="sync-info">
        <h4>ℹ️ How it works</h4>
        <ul>
          <li>Start <strong>JBook</strong> first to enable sync</li>
          <li><strong>Sync Data:</strong> Transfers payments, practices, and expenses to JBook</li>
          <li><strong>Sync Invoices:</strong> Automatically creates draft invoices for all completed pay periods</li>
          <li><strong>Only contractor practices</strong> are synced (employee data stays in Dentrak only)</li>
          <li>Already synced items will be skipped (no duplicates)</li>
        </ul>
      </div>
    </div>
  );
}

export default JBookSyncPanel;
