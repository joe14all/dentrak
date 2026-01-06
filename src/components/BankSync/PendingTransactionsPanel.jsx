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
  } = useBankSync();

  const { practices } = usePractices();

  // State
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [transactionToApprove, setTransactionToApprove] = useState(null);
  const [approvalData, setApprovalData] = useState({
    practiceId: null,
    paymentType: 'directDeposits',
    notes: '',
  });
  const [rejectReason, setRejectReason] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [filterPractice, setFilterPractice] = useState('all');

  // Active contractor practices for selection
  const activePractices = useMemo(() => {
    return practices.filter(p => p.status === 'active' && p.taxStatus === 'contractor');
  }, [practices]);

  // Filtered pending transactions
  const filteredTransactions = useMemo(() => {
    let filtered = pendingTransactions.filter(t => t.status === 'pending');
    
    if (filterPractice !== 'all') {
      filtered = filtered.filter(t => 
        t.suggestedPracticeId === parseInt(filterPractice) ||
        (!t.suggestedPracticeId && filterPractice === 'unmatched')
      );
    }
    
    return filtered;
  }, [pendingTransactions, filterPractice]);

  // Count by match status
  const counts = useMemo(() => {
    const pending = pendingTransactions.filter(t => t.status === 'pending');
    return {
      total: pending.length,
      matched: pending.filter(t => t.suggestedPracticeId).length,
      unmatched: pending.filter(t => !t.suggestedPracticeId).length,
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
      paymentType: transaction.suggestedPaymentType || 'directDeposits',
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
            paymentType: transaction.suggestedPaymentType || 'directDeposits',
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

  if (counts.total === 0) {
    return (
      <div className={styles.emptyState}>
        <CheckCircle2 size={48} className={styles.emptyIcon} />
        <h4>No Pending Transactions</h4>
        <p>All imported transactions have been reviewed. Sync your bank accounts to import new transactions.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header with stats */}
      <div className={styles.header}>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <Clock size={18} />
            <span>{counts.total} pending</span>
          </div>
          <div className={`${styles.stat} ${styles.matched}`}>
            <Sparkles size={18} />
            <span>{counts.matched} auto-matched</span>
          </div>
          <div className={`${styles.stat} ${styles.unmatched}`}>
            <AlertCircle size={18} />
            <span>{counts.unmatched} need review</span>
          </div>
        </div>

        {/* Filter */}
        <div className={styles.filters}>
          <select
            value={filterPractice}
            onChange={(e) => setFilterPractice(e.target.value)}
          >
            <option value="all">All Transactions</option>
            <option value="unmatched">Unmatched Only</option>
            {activePractices.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

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
                  <span className={styles.description}>{transaction.description}</span>
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
