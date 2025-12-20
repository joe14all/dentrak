import React, { useState, useMemo } from 'react';
import styles from './ExpensesPage.module.css';
import { useExpenses } from '../../contexts/ExpenseContext/ExpenseContext';
import ExpenseForm from '../../features/expenses/ExpenseForm';
import ExpensesList from '../../features/expenses/ExpensesList';
import Modal from '../../components/common/Modal/Modal';
import ConfirmationModal from '../../components/common/Modal/ConfirmationModal';
import { Receipt, PlusCircle, Calendar, TrendingUp, DollarSign } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const ExpensesPage = () => {
  const { expenses, addNewExpense, editExpense, removeExpense } = useExpenses();
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Filter expenses by selected year
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const expenseYear = new Date(e.date).getFullYear();
      return expenseYear === selectedYear;
    });
  }, [expenses, selectedYear]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const taxDeductible = filteredExpenses
      .filter(e => e.taxDeductible !== false)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    const count = filteredExpenses.length;

    // Get unique years from all expenses
    const years = [...new Set(expenses.map(e => new Date(e.date).getFullYear()))].sort((a, b) => b - a);

    return { total, taxDeductible, count, years };
  }, [filteredExpenses, expenses]);

  // Handlers
  const handleAddExpense = () => {
    setExpenseToEdit(null);
    setExpenseModalOpen(true);
  };

  const handleEditExpense = (expense) => {
    setExpenseToEdit(expense);
    setExpenseModalOpen(true);
  };

  const handleSaveExpense = async (expenseData) => {
    try {
      if (expenseToEdit) {
        await editExpense(expenseToEdit.id, expenseData);
      } else {
        await addNewExpense(expenseData);
      }
      setExpenseModalOpen(false);
      setExpenseToEdit(null);
    } catch (error) {
      console.error('Failed to save expense:', error);
      alert('Error saving expense. Please try again.');
    }
  };

  const handleDeleteExpense = (expense) => {
    setExpenseToDelete(expense);
    setDeleteModalOpen(true);
  };

  const confirmDeleteExpense = async () => {
    try {
      await removeExpense(expenseToDelete.id);
      setDeleteModalOpen(false);
      setExpenseToDelete(null);
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Error deleting expense. Please try again.');
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Receipt size={28} />
          <div>
            <h1 className={styles.title}>Business Expenses</h1>
            <p className={styles.subtitle}>Track tax-deductible business expenses</p>
          </div>
        </div>
        <button className={styles.addButton} onClick={handleAddExpense}>
          <PlusCircle size={18} />
          Add Expense
        </button>
      </div>

      {/* Stats Summary */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
            <DollarSign size={24} style={{ color: '#3b82f6' }} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Total Expenses</span>
            <span className={styles.statValue}>{formatCurrency(stats.total)}</span>
            <span className={styles.statSubtext}>{stats.count} expense{stats.count !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <TrendingUp size={24} style={{ color: '#10b981' }} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Tax Deductible</span>
            <span className={styles.statValue}>{formatCurrency(stats.taxDeductible)}</span>
            <span className={styles.statSubtext}>
              {((stats.taxDeductible / stats.total) * 100 || 0).toFixed(0)}% of total
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
            <Calendar size={24} style={{ color: '#8b5cf6' }} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Year</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className={styles.yearSelect}
            >
              {stats.years.length > 0 ? (
                stats.years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))
              ) : (
                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className={styles.listContainer}>
        <ExpensesList
          expenses={filteredExpenses}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setExpenseModalOpen(false);
          setExpenseToEdit(null);
        }}
        title={expenseToEdit ? 'Edit Expense' : 'Add Business Expense'}
      >
        <ExpenseForm
          expenseToEdit={expenseToEdit}
          onSave={handleSaveExpense}
          onCancel={() => {
            setExpenseModalOpen(false);
            setExpenseToEdit(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setExpenseToDelete(null);
        }}
        title="Confirm Deletion"
      >
        <ConfirmationModal
          message={`Are you sure you want to delete this expense: "${expenseToDelete?.description}"?`}
          onConfirm={confirmDeleteExpense}
          onCancel={() => {
            setDeleteModalOpen(false);
            setExpenseToDelete(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default ExpensesPage;
