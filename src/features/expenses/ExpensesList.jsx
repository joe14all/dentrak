import React, { useMemo } from 'react';
import styles from './ExpensesList.module.css';
import { usePractices } from '../../contexts/PracticeContext/PracticeContext';
import { Receipt, Edit2, Trash2, Building2, Calendar, Tag } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const ExpensesList = ({ expenses, onEdit, onDelete }) => {
  const { practices } = usePractices();

  // Sort expenses by date (newest first)
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses]);

  // Calculate total
  const total = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, [expenses]);

  const getPracticeName = (practiceId) => {
    if (!practiceId) return 'General';
    const practice = practices.find(p => p.id === practiceId);
    return practice ? practice.name : 'Unknown Practice';
  };

  if (expenses.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Receipt size={48} />
        <h3>No expenses recorded</h3>
        <p>Start tracking your business expenses for tax deductions</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.summary}>
        <span className={styles.summaryLabel}>Total Expenses:</span>
        <span className={styles.summaryAmount}>{formatCurrency(total)}</span>
      </div>

      <div className={styles.list}>
        {sortedExpenses.map((expense) => (
          <div key={expense.id} className={styles.expenseCard}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <h4 className={styles.description}>{expense.description}</h4>
                <div className={styles.meta}>
                  <span className={styles.metaItem}>
                    <Calendar size={14} />
                    {formatDate(expense.date)}
                  </span>
                  <span className={styles.metaItem}>
                    <Tag size={14} />
                    {expense.category}
                  </span>
                  {expense.practiceId && (
                    <span className={styles.metaItem}>
                      <Building2 size={14} />
                      {getPracticeName(expense.practiceId)}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.headerRight}>
                <span className={styles.amount}>{formatCurrency(expense.amount)}</span>
                {expense.taxDeductible && (
                  <span className={styles.taxBadge}>Tax Deductible</span>
                )}
              </div>
            </div>

            {(expense.vendor || expense.notes) && (
              <div className={styles.cardBody}>
                {expense.vendor && (
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Vendor:</span>
                    <span className={styles.detailValue}>{expense.vendor}</span>
                  </div>
                )}
                {expense.notes && (
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Notes:</span>
                    <span className={styles.detailValue}>{expense.notes}</span>
                  </div>
                )}
              </div>
            )}

            <div className={styles.cardActions}>
              <button
                className={styles.editButton}
                onClick={() => onEdit(expense)}
                title="Edit expense"
              >
                <Edit2 size={16} />
                Edit
              </button>
              <button
                className={styles.deleteButton}
                onClick={() => onDelete(expense)}
                title="Delete expense"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpensesList;
