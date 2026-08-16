/**
 * PendingTransactionsPanel Component
 * 
 * Shows bank transactions awaiting review and approval.
 * Users can approve, reject, or edit pending transactions before
 * they become actual payment records.
 */
import React, { useState, useMemo } from 'react';
import { useBankSync } from '../../contexts/BankSyncContext';
import { usePractices } from '../../contexts/PracticeContext/PracticeContext';
import Modal from '../common/Modal/Modal';
import styles from './PendingTransactionsPanel.module.css';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  CreditCard,
  Landmark,
  MousePointerClick,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
  Edit3,
  Trash2,
} from 'lucide-react';

const PAYMENT_TYPES = [
  { value: 'directDeposits', label: 'Direct Deposit', icon: Landmark },
  { value: 'eTransfers', label: 'E-Transfer', icon: MousePointerClick },
  { value: 'cheques', label: 'Cheque', icon: CreditCard },
];

const PendingTransactionsPanel = ({ onTransactionApproved }) => {
  const {
    pendingTransactions,
    isLoading,
    approveTransaction,
    rejectTransaction,
    bulkApprove,
    bulkReject,
    clearAllPending,
    syncAccount,
    connections,
    isSyncing,
  } = useBankSync();

  console.log('📋 [PENDING TRANSACTIONS] Showing', pendingTransactions?.length || 0, 'pending transactions');

  const { practices } = usePractices();

  // State
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [transactionToApprove, setTransactionToApprove] = useState(null);
  const [approvalData, setApprovalData] = useState({
    practiceId: null,
    paymentType: 'eTransfers',
    notes: '',
  });
  const [rejectReason, setRejectReason] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [filterPractice, setFilterPractice] = useState('all');
  const [filterBankAccount, setFilterBankAccount] = useState('all');
  const [showUnlinkedSenders, setShowUnlinkedSenders] = useState(true);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all'); // all, income, expense

  // Active practices for selection (all tax statuses, not just contractors)
  const activePractices = useMemo(() => {
    return practices.filter(p => p.status === 'active');
  }, [practices]);

  // Available bank accounts for filtering
  const bankAccountOptions = useMemo(() => {
    const options = [];
    const seenAccountIds = new Set();

    // Prefer connected accounts for clean labels
    connections.forEach((connection) => {
      if (!connection.accountId || seenAccountIds.has(connection.accountId)) return;
      seenAccountIds.add(connection.accountId);
      options.push({
        value: connection.accountId,
        label: `${connection.institutionName} - ${connection.accountName} (****${connection.lastFour})`,
      });
    });

    // Include historical/disconnected accounts that still appear in pending transactions
    pendingTransactions.forEach((transaction) => {
      if (!transaction.accountId || seenAccountIds.has(transaction.accountId)) return;
      seenAccountIds.add(transaction.accountId);
      options.push({
        value: transaction.accountId,
        label: `${transaction.institutionName} - ${transaction.accountName}`,
      });
    });

    return options;
  }, [connections, pendingTransactions]);

  // Filtered pending transactions
  const filteredTransactions = useMemo(() => {
    // Include both 'pending' and 'auto-matched' transactions for review
    let filtered = pendingTransactions.filter(t => t.status === 'pending' || t.status === 'auto-matched');
    
    // MAIN FILTER: Show only linked sender transactions by default
    if (!showUnlinkedSenders) {
      // Only show transactions that have a suggested practice (linked senders)
      filtered = filtered.filter(t => t.suggestedPracticeId);
    }
    
    // Apply transaction type filter (income vs expense)
    if (transactionTypeFilter === 'income') {
      filtered = filtered.filter(t => t.type === 'income');
    } else if (transactionTypeFilter === 'expense') {
      filtered = filtered.filter(t => t.type === 'expense');
    }

    // Apply bank account filter if selected
    if (filterBankAccount !== 'all') {
      filtered = filtered.filter(t => t.accountId === filterBankAccount);
    }
    
    // Apply practice-specific filter if selected
    if (filterPractice !== 'all') {
      filtered = filtered.filter(t => 
        t.suggestedPracticeId === parseInt(filterPractice) ||
        (!t.suggestedPracticeId && filterPractice === 'unmatched')
      );
    }
    
    return filtered;
  }, [pendingTransactions, filterPractice, showUnlinkedSenders, transactionTypeFilter, filterBankAccount]);

  // Count by match status
  const counts = useMemo(() => {
    const pending = pendingTransactions.filter(t => t.status === 'pending' || t.status === 'auto-matched');
    return {
      total: pending.length,
      matched: pending.filter(t => t.suggestedPracticeId).length,
      unmatched: pending.filter(t => !t.suggestedPracticeId).length,
      linked: pending.filter(t => t.suggestedPracticeId).length, // Transactions from linked senders
      income: pending.filter(t => t.type === 'income').length,
      expense: pending.filter(t => t.type === 'expense').length,
    };
  }, [pendingTransactions]);

  // Toggle selection
  const toggleSelection = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Select all visible
  const selectAllVisible = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
    }
  };

  // Open approve modal for single transaction
  const handleOpenApproveModal = (transaction) => {
    setTransactionToApprove(transaction);
    setApprovalData({
      practiceId: transaction.suggestedPracticeId || (activePractices.length > 0 ? activePractices[0].id : null),
      paymentType: transaction.suggestedPaymentType || 'eTransfers',
      notes: '',
    });
    setShowApproveModal(true);
  };

  // Approve single transaction
  const handleApprove = async () => {
    if (!transactionToApprove || !approvalData.practiceId) return;
    
    await approveTransaction(transactionToApprove.id, approvalData);
    setShowApproveModal(false);
    setTransactionToApprove(null);
    onTransactionApproved?.();
  };

  // Reject single transaction
  const handleReject = async () => {
    if (!transactionToApprove) return;
    
    await rejectTransaction(transactionToApprove.id, rejectReason);
    setShowRejectModal(false);
    setTransactionToApprove(null);
    setRejectReason('');
  };

  // Open reject modal
  const handleOpenRejectModal = (transaction) => {
    setTransactionToApprove(transaction);
    setRejectReason('');
    setShowRejectModal(true);
  };

  // Bulk approve selected with auto-matched practices
  const handleBulkApprove = async () => {
    const approvals = [];
    
    for (const id of selectedIds) {
      const transaction = filteredTransactions.find(t => t.id === id);
      if (transaction && transaction.suggestedPracticeId) {
        approvals.push({
          pendingId: id,
          data: {
            practiceId: transaction.suggestedPracticeId,
            paymentType: transaction.suggestedPaymentType || 'eTransfers',
            notes: `Auto-approved from bank import`,
          },
        });
      }
    }
    
    if (approvals.length > 0) {
      await bulkApprove(approvals);
      setSelectedIds(new Set());
      onTransactionApproved?.();
    } else {
      alert('No transactions with matched practices selected. Please approve unmatched transactions individually.');
    }
  };

  // Bulk reject selected
  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    
    if (window.confirm(`Reject ${selectedIds.size} selected transactions?`)) {
      await bulkReject(Array.from(selectedIds), 'Bulk rejected');
      setSelectedIds(new Set());
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Get confidence badge color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return styles.highConfidence;
    if (confidence >= 50) return styles.mediumConfidence;
    return styles.lowConfidence;
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Clock className={styles.spinIcon} size={24} />
        <span>Loading pending transactions...</span>
      </div>
    );
  }

  // Render empty state for no transactions at all
  const renderNoTransactionsState = () => (
    <div className={styles.emptyState}>
      <CheckCircle2 size={48} className={styles.emptyIcon} />
      <h4>No Pending Transactions</h4>
      <p>All imported transactions have been reviewed. Sync your bank accounts to import new transactions.</p>
    </div>
  );

  // Render empty state for filtered results
  const renderFilteredEmptyState = () => {
    if (!showUnlinkedSenders) {
      return (
        <div className={styles.emptyState}>
          <Sparkles size={48} className={styles.emptyIcon} />
          <h4>No Transactions from Linked Senders</h4>
          <p>
            There are {counts.total} pending transaction(s), but none from your linked senders.
            {counts.unmatched > 0 && ` Check "Show unlinked senders" above to review ${counts.unmatched} unlinked transaction(s).`}
          </p>
          <div className={styles.helpBox}>
            <AlertCircle size={16} />
            <div>
              <strong>Looking for missing transactions?</strong>
              <p>Go to Bank Sync Settings and use "Custom date range" to fetch older transactions from all your accounts.</p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className={styles.emptyState}>
        <CheckCircle2 size={48} className={styles.emptyIcon} />
        <h4>All Filtered Transactions Reviewed</h4>
        <p>No pending transactions match your current filters.</p>
      </div>
    );
  };

  // If no transactions at all, show simple empty state
  if (counts.total === 0) {
    return renderNoTransactionsState();
  }

  // Always render container with filters visible
  return (
    <div className={styles.container}>
      {/* Critical Action Banner - for mis-classified transactions */}
      {counts.total > 0 && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'start',
          gap: '12px'
        }}>
          <AlertCircle size={24} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#92400e', fontSize: '16px' }}>
              🔄 Need to Re-classify Transactions?
            </h4>
            <p style={{ margin: '0 0 12px 0', color: '#78350f', lineHeight: '1.5' }}>
              If your pending transactions are showing reversed labels (income marked as expense or vice versa), 
              you can clear all pending transactions and re-sync your accounts to fix the classification.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={async () => {
                  if (window.confirm(`Clear all ${counts.total} pending transactions? This cannot be undone. You can re-sync your accounts after to import them with correct classification.`)) {
                    await clearAllPending();
                  }
                }}
                disabled={isSyncing}
                style={{
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: isSyncing ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: isSyncing ? 0.6 : 1
                }}
              >
                <Trash2 size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Clear All Pending Transactions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with stats - always visible */}
      <div className={styles.header}>
        <div className={styles.stats}>
          <div className={styles.stat} style={{ color: '#10b981' }}>
            <Sparkles size={18} />
            <span>{counts.income} income</span>
          </div>
          {counts.expense > 0 && (
            <div className={`${styles.stat}`} style={{ color: '#ef4444', fontWeight: 'bold' }}>
              <AlertCircle size={18} />
              <span>{counts.expense} expenses (should reject)</span>
            </div>
          )}
          {counts.unmatched > 0 && (
            <div className={`${styles.stat} ${styles.unmatched}`}>
              <AlertCircle size={18} />
              <span>{counts.unmatched} unlinked</span>
            </div>
          )}
        </div>

        {/* Simplified Filters - always visible */}
        <div className={styles.filtersPanel}>
          <div className={styles.filtersTitle}>
            <Filter size={14} />
            <span>Filter Transactions</span>
          </div>

          <div className={styles.filters}>
            {/* Transaction Type Filter */}
            <div className={styles.filterControl}>
              <label htmlFor="pending-type-filter" className={styles.filterLabel}>Type</label>
              <select
                id="pending-type-filter"
                value={transactionTypeFilter}
                onChange={(e) => setTransactionTypeFilter(e.target.value)}
                className={`${styles.filterSelect} ${styles.typeFilter}`}
              >
                <option value="all">All Types ({counts.total})</option>
                <option value="income">Income Only ({counts.income})</option>
                <option value="expense">Expenses Only ({counts.expense})</option>
              </select>
            </div>

            {/* Practice filter - only show when relevant */}
            {(showUnlinkedSenders || activePractices.length > 1) && (
              <div className={styles.filterControl}>
                <label htmlFor="pending-practice-filter" className={styles.filterLabel}>Practice</label>
                <select
                  id="pending-practice-filter"
                  value={filterPractice}
                  onChange={(e) => setFilterPractice(e.target.value)}
                  className={`${styles.filterSelect} ${styles.practiceFilter}`}
                >
                  <option value="all">All Practices</option>
                  {showUnlinkedSenders && <option value="unmatched">Unlinked Only</option>}
                  {activePractices.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Bank account filter */}
            <div className={styles.filterControl}>
              <label htmlFor="pending-account-filter" className={styles.filterLabel}>Bank Account</label>
              <select
                id="pending-account-filter"
                value={filterBankAccount}
                onChange={(e) => setFilterBankAccount(e.target.value)}
                className={`${styles.filterSelect} ${styles.practiceFilter}`}
              >
                <option value="all">All Bank Accounts</option>
                {bankAccountOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle for showing unlinked transactions */}
            <div className={`${styles.filterControl} ${styles.filterToggleControl}`}>
              <label className={styles.filterLabel}>Matching</label>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={showUnlinkedSenders}
                  onChange={(e) => {
                    setShowUnlinkedSenders(e.target.checked);
                    if (!e.target.checked) setFilterPractice('all');
                  }}
                />
                <span>Show unlinked senders</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Show empty state if no filtered transactions, otherwise show list */}
      {filteredTransactions.length === 0 ? (
        renderFilteredEmptyState()
      ) : (
        <>
      {/* Warning about expense transactions */}
      {counts.expense > 0 && transactionTypeFilter !== 'income' && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          padding: '16px',
          margin: '16px 0',
          display: 'flex',
          alignItems: 'start',
          gap: '12px'
        }}>
          <AlertCircle size={24} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#991b1b', fontSize: '16px' }}>
              ⚠️ Expense Transactions Detected
            </h4>
            <p style={{ margin: '0 0 12px 0', color: '#7f1d1d', lineHeight: '1.5' }}>
              You have <strong>{counts.expense} expense transaction(s)</strong> (money going out). 
              Dentrak is designed to track <strong>income only</strong> (money received from practices). 
              These expense transactions should be rejected.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setTransactionTypeFilter('expense')}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                View Expenses Only
              </button>
              <button
                onClick={async () => {
                  if (window.confirm(`Reject all ${counts.expense} expense transactions? This cannot be undone.`)) {
                    const expenseTxs = pendingTransactions.filter(t => 
                      (t.status === 'pending' || t.status === 'auto-matched') && t.type === 'expense'
                    );
                    await bulkReject(expenseTxs.map(t => t.id), 'Bulk rejected - expense transactions not tracked in Dentrak');
                  }
                }}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <XCircle size={16} />
                Reject All Expenses
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className={styles.bulkActions}>
          <span>{selectedIds.size} selected</span>
          <button onClick={handleBulkApprove} className={styles.bulkApproveBtn}>
            <CheckCircle2 size={16} /> Approve Matched
          </button>
          <button onClick={handleBulkReject} className={styles.bulkRejectBtn}>
            <XCircle size={16} /> Reject Selected
          </button>
          <button onClick={() => setSelectedIds(new Set())} className={styles.clearBtn}>
            Clear Selection
          </button>
        </div>
      )}

      {/* Transactions List */}
      <div className={styles.transactionsList}>
        {/* Select All Header */}
        <div className={styles.listHeader}>
          <button onClick={selectAllVisible} className={styles.selectAllBtn}>
            {selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0 ? (
              <CheckSquare size={18} />
            ) : (
              <Square size={18} />
            )}
            <span>Select All</span>
          </button>
        </div>

        {filteredTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className={`${styles.transactionCard} ${selectedIds.has(transaction.id) ? styles.selected : ''}`}
          >
            <div className={styles.transactionMain}>
              {/* Checkbox */}
              <button
                className={styles.checkbox}
                onClick={() => toggleSelection(transaction.id)}
              >
                {selectedIds.has(transaction.id) ? (
                  <CheckSquare size={20} />
                ) : (
                  <Square size={20} />
                )}
              </button>

              {/* Transaction Info */}
              <div className={styles.transactionInfo}>
                <div className={styles.transactionHeader}>
                  <span className={styles.description}>
                    {transaction.type === 'expense' && (
                      <span style={{ 
                        display: 'inline-block',
                        backgroundColor: '#ef4444', 
                        color: 'white', 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontSize: '11px', 
                        fontWeight: 'bold',
                        marginRight: '8px'
                      }}>
                        EXPENSE
                      </span>
                    )}
                    {transaction.type === 'income' && (
                      <span style={{ 
                        display: 'inline-block',
                        backgroundColor: '#10b981', 
                        color: 'white', 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontSize: '11px', 
                        fontWeight: 'bold',
                        marginRight: '8px'
                      }}>
                        INCOME
                      </span>
                    )}
                    {transaction.description}
                  </span>
                  <span className={styles.amount}>{formatCurrency(transaction.amount)}</span>
                </div>
                <div className={styles.transactionMeta}>
                  <span className={styles.date}>
                    {new Date(transaction.date).toLocaleDateString()}
                  </span>
                  <span className={styles.account}>{transaction.accountName}</span>
                </div>
              </div>

              {/* Practice Match Badge */}
              <div className={styles.practiceMatch}>
                {transaction.suggestedPracticeId ? (
                  <div className={`${styles.matchBadge} ${getConfidenceColor(transaction.matchConfidence)}`}>
                    <Sparkles size={14} />
                    <span>{transaction.suggestedPracticeName}</span>
                    <span className={styles.confidence}>{transaction.matchConfidence}%</span>
                  </div>
                ) : (
                  <div className={`${styles.matchBadge} ${styles.noMatch}`}>
                    <AlertCircle size={14} />
                    <span>No match found</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className={styles.transactionActions}>
                <button
                  onClick={() => handleOpenApproveModal(transaction)}
                  className={styles.approveBtn}
                  title="Approve this transaction and add to your records"
                >
                  <CheckCircle2 size={16} />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => handleOpenRejectModal(transaction)}
                  className={styles.rejectBtn}
                  title="Reject and skip this transaction"
                >
                  <XCircle size={16} />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => setExpandedId(expandedId === transaction.id ? null : transaction.id)}
                  className={styles.expandBtn}
                  title="View transaction details"
                  style={{ 
                    backgroundColor: '#3B82F6', 
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    minWidth: '36px',
                    minHeight: '36px',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                >
                  {expandedId === transaction.id ? '▲' : '▼'}
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedId === transaction.id && (
              <div className={styles.expandedDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Original Description:</span>
                  <span className={styles.detailValue}>{transaction.originalDescription}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Bank Account:</span>
                  <span className={styles.detailValue}>{transaction.institutionName} - {transaction.accountName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Transaction ID:</span>
                  <span className={styles.detailValue}>{transaction.tellerTransactionId}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Imported At:</span>
                  <span className={styles.detailValue}>{new Date(transaction.importedAt).toLocaleString()}</span>
                </div>
                {transaction.suggestedPaymentType && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Suggested Type:</span>
                    <span className={styles.detailValue}>
                      {PAYMENT_TYPES.find(t => t.value === transaction.suggestedPaymentType)?.label || transaction.suggestedPaymentType}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
        </>
      )}

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setTransactionToApprove(null);
        }}
        title="Approve Transaction"
      >
        {transactionToApprove && (
          <div className={styles.approveModal}>
            {/* Transaction Summary */}
            <div className={styles.transactionSummary}>
              <div className={styles.summaryAmount}>
                {formatCurrency(transactionToApprove.amount)}
              </div>
              <div className={styles.summaryDescription}>
                {transactionToApprove.description}
              </div>
              <div className={styles.summaryDate}>
                {new Date(transactionToApprove.date).toLocaleDateString()}
              </div>
            </div>

            {/* Practice Selection */}
            <div className={styles.formGroup}>
              <label>Link to Practice *</label>
              <select
                value={approvalData.practiceId || ''}
                onChange={(e) => setApprovalData({
                  ...approvalData,
                  practiceId: parseInt(e.target.value)
                })}
                required
              >
                <option value="">Select a practice...</option>
                {activePractices.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {transactionToApprove.suggestedPracticeId === p.id && ' ⭐ (Suggested)'}
                  </option>
                ))}
              </select>
              {transactionToApprove.suggestedPracticeId && (
                <div className={styles.suggestionHint}>
                  <Sparkles size={14} />
                  Auto-matched with {transactionToApprove.matchConfidence}% confidence
                </div>
              )}
            </div>

            {/* Payment Type */}
            <div className={styles.formGroup}>
              <label>Payment Type</label>
              <div className={styles.paymentTypeOptions}>
                {PAYMENT_TYPES.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      className={`${styles.paymentTypeBtn} ${approvalData.paymentType === type.value ? styles.active : ''}`}
                      onClick={() => setApprovalData({ ...approvalData, paymentType: type.value })}
                    >
                      <Icon size={18} />
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className={styles.formGroup}>
              <label>Notes (optional)</label>
              <textarea
                value={approvalData.notes}
                onChange={(e) => setApprovalData({ ...approvalData, notes: e.target.value })}
                placeholder="Add any notes about this transaction..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className={styles.modalFooter}>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setTransactionToApprove(null);
                }}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className={styles.confirmApproveBtn}
                disabled={!approvalData.practiceId}
              >
                <CheckCircle2 size={18} />
                Approve & Save
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setTransactionToApprove(null);
        }}
        title="Reject Transaction"
      >
        {transactionToApprove && (
          <div className={styles.rejectModal}>
            <div className={styles.rejectWarning}>
              <AlertCircle size={24} />
              <p>
                Are you sure you want to reject this transaction? 
                It will be marked as rejected and won't be imported as a payment.
              </p>
            </div>

            <div className={styles.transactionSummary}>
              <div className={styles.summaryAmount}>
                {formatCurrency(transactionToApprove.amount)}
              </div>
              <div className={styles.summaryDescription}>
                {transactionToApprove.description}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Reason for rejection (optional)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Personal expense, duplicate, not dental income..."
                rows={3}
              />
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setTransactionToApprove(null);
                }}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button onClick={handleReject} className={styles.confirmRejectBtn}>
                <XCircle size={18} />
                Reject Transaction
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PendingTransactionsPanel;
