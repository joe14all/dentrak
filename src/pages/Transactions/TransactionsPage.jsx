import React, { useState, useMemo } from 'react';
import styles from './TransactionsPage.module.css';
import { useTransactions } from '../../contexts/TransactionContext/TransactionContext';
import { usePractices } from '../../contexts/PracticeContext/PracticeContext';
import { usePayments } from '../../contexts/PaymentContext/PaymentContext'; 
import TransactionsToolbar from '../../features/transactions/TransactionsToolbar';
import TransactionList from '../../features/transactions/TransactionList';
import Modal from '../../components/common/Modal/Modal';
import TransactionForm from '../../features/transactions/form-components/TransactionForm';
import DeleteConfirmation from '../../features/transactions/DeleteConfirmation';
import TransactionViewCard from '../../features/transactions/TransactionViewCard';
import GeminiImporter from '../../features/transactions/GeminiImporter';
import { CreditCard, Landmark, MousePointerClick, List } from 'lucide-react';

const TransactionsPage = () => {
  const { cheques, directDeposits, eTransfers, isLoading: isTransactionsLoading, ...transactionActions } = useTransactions();
  const { practices } = usePractices();
  const { isLoading: isPaymentsLoading } = usePayments();
  
  const [activeView, setActiveView] = useState('all');
  
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [transactionToView, setTransactionToView] = useState(null);
  const [isImportModalOpen, setImportModalOpen] = useState(false);

  const views = useMemo(() => {
    // Correctly map and add the 'type' and 'uniqueId' to every transaction array.
    // This ensures data consistency across all views.
    const mappedCheques = cheques.map(t => ({ ...t, type: 'cheques', uniqueId: `cheque-${t.id}` }));
    const mappedDeposits = directDeposits.map(t => ({ ...t, type: 'directDeposits', uniqueId: `deposit-${t.id}` }));
    const mappedTransfers = eTransfers.map(t => ({ ...t, type: 'eTransfers', uniqueId: `transfer-${t.id}` }));

    const allTransactions = [...mappedCheques, ...mappedDeposits, ...mappedTransfers]
      .sort((a, b) => new Date(b.dateReceived || b.paymentDate) - new Date(a.dateReceived || a.paymentDate));
    
    return {
      all: { label: 'All', icon: List, data: allTransactions },
      cheques: { label: 'Cheques', icon: CreditCard, data: mappedCheques, ...transactionActions },
      directDeposits: { label: 'Direct Deposits', icon: Landmark, data: mappedDeposits, ...transactionActions },
      eTransfers: { label: 'E-Transfers', icon: MousePointerClick, data: mappedTransfers, ...transactionActions },
    };
  }, [cheques, directDeposits, eTransfers, transactionActions]);

  // All event handlers remain the same and are collapsed for brevity.
  const handleOpenAddModal = () => { setTransactionToEdit(null); setFormModalOpen(true); };
  const handleOpenEditModal = (transaction) => { setTransactionToEdit(transaction); setFormModalOpen(true); };
  const handleOpenDeleteModal = (transactionId, type) => { setTransactionToDelete({ id: transactionId, type }); setDeleteModalOpen(true); };
  const handleOpenViewModal = (transaction) => { setTransactionToView(transaction); setViewModalOpen(true); };
  const handleCloseModals = () => {
    setFormModalOpen(false);
    setDeleteModalOpen(false);
    setViewModalOpen(false);
    setImportModalOpen(false);
    setTransactionToEdit(null);
    setTransactionToDelete(null);
    setTransactionToView(null);
  };
  const handleImportSuccess = (parsedData) => {
    setImportModalOpen(false);
    setTransactionToEdit(parsedData);
    setFormModalOpen(true);
  };
  const handleSave = (formData) => {
    const { type, ...data } = formData;
    const isEditing = !!transactionToEdit;
    
    let action;
    if (type === 'cheques') action = isEditing ? views.cheques.editCheque : views.cheques.addNewCheque;
    if (type === 'directDeposits') action = isEditing ? views.directDeposits.editDirectDeposit : views.directDeposits.addNewDirectDeposit;
    if (type === 'eTransfers') action = isEditing ? views.eTransfers.editETransfer : views.eTransfers.addNewETransfer;
    
    if (action) {
      if (isEditing) {
        action(transactionToEdit.id, data);
      } else {
        action(data);
      }
    }
    handleCloseModals();
  };
  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      const type = transactionToDelete.type;
      const view = Object.values(views).find(v => v.data.some(d => d.type === type));
      if (view && view.remove) {
         view.remove(transactionToDelete.id);
      }
    }
    handleCloseModals();
  };
  const handleStatusUpdate = (newStatus) => {
    if (transactionToView && transactionToView.type === 'cheques') {
      const updatedTransaction = { ...transactionToView, status: newStatus };
      transactionActions.editCheque(updatedTransaction.id, updatedTransaction);
      setTransactionToView(updatedTransaction);
    }
  };
  const handleEditFromView = () => {
      if(transactionToView) {
          setViewModalOpen(false);
          handleOpenEditModal(transactionToView);
      }
  };


  return (
    <div className={styles.page}>
      <TransactionsToolbar
        views={Object.entries(views).map(([id, { label, icon }]) => ({ id, label, icon }))}
        activeView={activeView}
        setActiveView={setActiveView}
        onAddTransaction={handleOpenAddModal}
        onOpenImporter={() => setImportModalOpen(true)}
      />
      <div className={styles.content}>
        <TransactionList
          transactions={views[activeView].data}
          transactionType={activeView}
          practices={practices}
          isLoading={isTransactionsLoading || isPaymentsLoading}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteModal}
          onView={handleOpenViewModal}
        />
      </div>

      {/* --- Modals --- */}
      <Modal isOpen={isFormModalOpen} onClose={handleCloseModals} title={transactionToEdit ? `Edit Transaction` : `Log New Transaction`}>
        <TransactionForm
          transactionToEdit={transactionToEdit}
          initialType={activeView !== 'all' ? activeView : 'cheques'}
          practices={practices}
          onSave={handleSave}
          onCancel={handleCloseModals}
        />
      </Modal>
      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseModals} title="Confirm Deletion">
        <DeleteConfirmation onConfirm={handleConfirmDelete} onCancel={handleCloseModals} />
      </Modal>
      <Modal isOpen={isViewModalOpen} onClose={handleCloseModals} title="Transaction Details">
        {transactionToView && (
            <TransactionViewCard 
                transaction={transactionToView}
                practice={practices.find(p => p.id === transactionToView.practiceId)}
                onStatusChange={handleStatusUpdate}
                onEdit={handleEditFromView}
            />
        )}
      </Modal>
      <Modal isOpen={isImportModalOpen} onClose={handleCloseModals} title="Import Transaction with AI">
        <GeminiImporter 
          practices={practices}
          onSuccess={handleImportSuccess}
          onCancel={handleCloseModals}
        />
      </Modal>
    </div>
  );
};

export default TransactionsPage;

