/**
 * ApprovedTransactionsPanel Component
 * 
 * Shows history of approved bank transactions, grouped by practice.
 * Allows users to review what has been imported and verify nothing is missing.
 */
import React, { useState, useMemo, useEffect } from 'react';
import { usePractices } from '../../contexts/PracticeContext/PracticeContext';
import { getApprovedBankTransactions } from '../../database/bankSync';
import styles from './ApprovedTransactionsPanel.module.css';
import {
  CheckCircle2,
  Building2,
  Calendar,
  DollarSign,
  Landmark,
  MousePointerClick,
  CreditCard,
  Filter,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
} from 'lucide-react';

const ApprovedTransactionsPanel = () => {
  const { practices } = usePractices();
  const [approvedTransactions, setApprovedTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPractice, setFilterPractice] = useState('all');
  const [filterPaymentType, setFilterPaymentType] = useState('all');
  const [dateRange, setDateRange] = useState('last-30-days');
  const [expandedPractice, setExpandedPractice] = useState(null);

  // Load approved transactions
  const loadApprovedTransactions = async () => {
    setIsLoading(true);
    try {
      const approved = await getApprovedBankTransactions();
      setApprovedTransactions(approved);
    } catch (err) {
      console.error('Failed to load approved transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApprovedTransactions();
  }, []);

  // Active practices for filtering
  const activePractices = useMemo(() => {
    return practices.filter(p => p.status === 'active');
  }, [practices]);

  // Get date range filter
  const getDateRangeFilter = (range) => {
    const now = new Date();
    const start = new Date();
    
    switch (range) {
      case 'last-7-days':
        start.setDate(start.getDate() - 7);
        break;
      case 'last-30-days':
        start.setDate(start.getDate() - 30);
        break;
      case 'last-90-days':
        start.setDate(start.getDate() - 90);
        break;
      case 'this-month':
        start.setDate(1);
        break;
      case 'last-month':
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);
        now.setDate(0);
        break;
      case 'this-year':
        start.setMonth(0);
        start.setDate(1);
        break;
      case 'all':
      default:
        return null;
    }
    
    return { start, end: now };
  };

  // Filtered and grouped transactions
  const groupedTransactions = useMemo(() => {
    let filtered = [...approvedTransactions];
    
    // Apply date filter
    const dateFilter = getDateRangeFilter(dateRange);
    if (dateFilter) {
      filtered = filtered.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= dateFilter.start && txDate <= dateFilter.end;
      });
    }
    
    // Apply practice filter
    if (filterPractice !== 'all') {
      filtered = filtered.filter(t => t.approvedPracticeId === parseInt(filterPractice));
    }
    
    // Apply payment type filter
    if (filterPaymentType !== 'all') {
      filtered = filtered.filter(t => t.approvedPaymentType === filterPaymentType);
    }
    
    // Group by practice
    const grouped = {};
    filtered.forEach(t => {
      const practiceId = t.approvedPracticeId;
      if (!grouped[practiceId]) {
        const practice = practices.find(p => p.id === practiceId);
        grouped[practiceId] = {
          practice: practice || { id: practiceId, name: 'Unknown Practice' },
          transactions: [],
          totalAmount: 0,
        };
      }
      grouped[practiceId].transactions.push(t);
      grouped[practiceId].totalAmount += t.amount;
    });
    
    // Sort by total amount (highest first)
    return Object.values(grouped).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [approvedTransactions, practices, filterPractice, filterPaymentType, dateRange]);

  // Summary stats
  const stats = useMemo(() => {
    const dateFilter = getDateRangeFilter(dateRange);
    let filtered = approvedTransactions;
    
    if (dateFilter) {
      filtered = filtered.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= dateFilter.start && txDate <= dateFilter.end;
      });
    }
    
    return {
      total: filtered.length,
      totalAmount: filtered.reduce((sum, t) => sum + t.amount, 0),
      practices: new Set(filtered.map(t => t.approvedPracticeId)).size,
      byType: {
        directDeposits: filtered.filter(t => t.approvedPaymentType === 'directDeposits').length,
        eTransfers: filtered.filter(t => t.approvedPaymentType === 'eTransfers').length,
        cheques: filtered.filter(t => t.approvedPaymentType === 'cheques').length,
      },
    };
  }, [approvedTransactions, dateRange]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  // Payment type icon
  const getPaymentTypeIcon = (type) => {
    switch (type) {
      case 'directDeposits':
        return <Landmark size={16} />;
      case 'eTransfers':
        return <MousePointerClick size={16} />;
      case 'cheques':
        return <CreditCard size={16} />;
      default:
        return <DollarSign size={16} />;
    }
  };

  // Payment type label
  const getPaymentTypeLabel = (type) => {
    switch (type) {
      case 'directDeposits':
        return 'Direct Deposit';
      case 'eTransfers':
        return 'E-Transfer';
      case 'cheques':
        return 'Cheque';
      default:
        return type;
    }
  };

  // Export to CSV
  const handleExport = () => {
    const csvData = approvedTransactions.map(t => {
      const practice = practices.find(p => p.id === t.approvedPracticeId);
      return {
        Date: new Date(t.date).toLocaleDateString(),
        Practice: practice?.name || 'Unknown',
        Sender: t.description,
        Amount: t.amount,
        'Payment Type': getPaymentTypeLabel(t.approvedPaymentType),
        'Approved Date': new Date(t.approvedAt).toLocaleDateString(),
        'Bank Account': t.accountName,
      };
    });
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(',')),
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `approved-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <RefreshCw className={styles.spinIcon} size={24} />
        <span>Loading approved transactions...</span>
      </div>
    );
  }

  if (approvedTransactions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <CheckCircle2 size={48} className={styles.emptyIcon} />
        <h4>No Approved Transactions Yet</h4>
        <p>Approved bank transactions will appear here for your review and records.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header with summary stats */}
      <div className={styles.header}>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <CheckCircle2 size={18} />
            <span>{stats.total} approved</span>
          </div>
          <div className={styles.stat}>
            <DollarSign size={18} />
            <span>{formatCurrency(stats.totalAmount)}</span>
          </div>
          <div className={styles.stat}>
            <Building2 size={18} />
            <span>{stats.practices} {stats.practices === 1 ? 'practice' : 'practices'}</span>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button 
            onClick={loadApprovedTransactions} 
            className={styles.refreshBtn} 
            title="Refresh"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? styles.spinIcon : ''} />
          </button>
          <button onClick={handleExport} className={styles.exportBtn} title="Export to CSV">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Date Range</label>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="last-7-days">Last 7 Days</option>
            <option value="last-30-days">Last 30 Days</option>
            <option value="last-90-days">Last 90 Days</option>
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="this-year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Practice</label>
          <select value={filterPractice} onChange={(e) => setFilterPractice(e.target.value)}>
            <option value="all">All Practices</option>
            {activePractices.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Payment Type</label>
          <select value={filterPaymentType} onChange={(e) => setFilterPaymentType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="directDeposits">Direct Deposits</option>
            <option value="eTransfers">E-Transfers</option>
            <option value="cheques">Cheques</option>
          </select>
        </div>
      </div>

      {/* Payment type breakdown */}
      <div className={styles.breakdown}>
        <div className={styles.breakdownItem}>
          <Landmark size={16} />
          <span>{stats.byType.directDeposits} Direct Deposits</span>
        </div>
        <div className={styles.breakdownItem}>
          <MousePointerClick size={16} />
          <span>{stats.byType.eTransfers} E-Transfers</span>
        </div>
        <div className={styles.breakdownItem}>
          <CreditCard size={16} />
          <span>{stats.byType.cheques} Cheques</span>
        </div>
      </div>

      {/* Grouped transactions by practice */}
      <div className={styles.groupedList}>
        {groupedTransactions.length === 0 ? (
          <div className={styles.noResults}>
            <Filter size={32} />
            <p>No transactions match your filters</p>
          </div>
        ) : (
          groupedTransactions.map(group => (
            <div key={group.practice.id} className={styles.practiceGroup}>
              <button
                className={styles.practiceHeader}
                onClick={() => setExpandedPractice(
                  expandedPractice === group.practice.id ? null : group.practice.id
                )}
              >
                <div className={styles.practiceInfo}>
                  <Building2 size={20} />
                  <div>
                    <h4>{group.practice.name}</h4>
                    <span className={styles.practiceStats}>
                      {group.transactions.length} transaction{group.transactions.length !== 1 ? 's' : ''} • {formatCurrency(group.totalAmount)}
                    </span>
                  </div>
                </div>
                {expandedPractice === group.practice.id ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>

              {expandedPractice === group.practice.id && (
                <div className={styles.transactionsList}>
                  {group.transactions.map(tx => (
                    <div key={tx.id} className={styles.transaction}>
                      <div className={styles.transactionMain}>
                        <div className={styles.transactionIcon}>
                          {getPaymentTypeIcon(tx.approvedPaymentType)}
                        </div>
                        <div className={styles.transactionInfo}>
                          <div className={styles.transactionHeader}>
                            <span className={styles.sender}>{tx.description}</span>
                            <span className={styles.amount}>{formatCurrency(tx.amount)}</span>
                          </div>
                          <div className={styles.transactionMeta}>
                            <span className={styles.date}>
                              <Calendar size={14} />
                              {new Date(tx.date).toLocaleDateString()}
                            </span>
                            <span className={styles.type}>
                              {getPaymentTypeLabel(tx.approvedPaymentType)}
                            </span>
                            <span className={styles.account}>{tx.accountName}</span>
                          </div>
                        </div>
                      </div>
                      <div className={styles.approvalInfo}>
                        <CheckCircle2 size={14} />
                        <span>
                          Approved {new Date(tx.approvedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ApprovedTransactionsPanel;
