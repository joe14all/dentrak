import React, { useState, useMemo } from 'react';
import styles from './TransactionsPage.module.css';
import { useTransactions } from '../../contexts/TransactionContext/TransactionContext';
import { usePractices } from '../../contexts/PracticeContext/PracticeContext';
import TransactionsToolbar from '../../features/transactions/TransactionsToolbar';
import TransactionList from '../../features/transactions/TransactionList';
import Modal from '../../components/common/Modal/Modal';
import TransactionForm from '../../features/transactions/form-components/TransactionForm';
import DeleteConfirmation from '../../features/transactions/DeleteConfirmation';
import TransactionViewCard from '../../features/transactions/TransactionViewCard';
import { CreditCard, Landmark, MousePointerClick } from 'lucide-react';

const TransactionsPage = () => {
  const { 
    cheques, directDeposits, eTransfers, isLoading, 
    addNewCheque, editCheque, removeCheque,
    addNewDirectDeposit, editDirectDeposit, removeDirectDeposit,
    addNewETransfer, editETransfer, removeETransfer,
  } = useTransactions();
  const { practices } = usePractices();
  
  const [activeView, setActiveView] = useState('cheques');
  
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [transactionToView, setTransactionToView] = useState(null);

  // By wrapping this object in useMemo, we ensure it's stable between re-renders,
  // preventing the list from displaying duplicate data.
  const views = useMemo(() => ({
    cheques: { label: 'Cheques', icon: CreditCard, data: cheques, remove: removeCheque, edit: editCheque, add: addNewCheque },
    directDeposits: { label: 'Direct Deposits', icon: Landmark, data: directDeposits, remove: removeDirectDeposit, edit: editDirectDeposit, add: addNewDirectDeposit },
    eTransfers: { label: 'E-Transfers', icon: MousePointerClick, data: eTransfers, remove: removeETransfer, edit: editETransfer, add: addNewETransfer },
  }), [
      cheques, directDeposits, eTransfers, 
      removeCheque, editCheque, addNewCheque,
      removeDirectDeposit, editDirectDeposit, addNewDirectDeposit,
      removeETransfer, editETransfer, addNewETransfer
  ]);

  const handleOpenAddModal = () => { setTransactionToEdit(null); setFormModalOpen(true); };
  const handleOpenEditModal = (transaction) => { setTransactionToEdit({ ...transaction, type: activeView }); setFormModalOpen(true); };
  const handleOpenDeleteModal = (transactionId) => { setTransactionToDelete({ id: transactionId, type: activeView }); setDeleteModalOpen(true); };
  const handleOpenViewModal = (transaction) => { setTransactionToView({ ...transaction, type: activeView }); setViewModalOpen(true); };

  const handleCloseModals = () => {
    setFormModalOpen(false);
    setDeleteModalOpen(false);
    setViewModalOpen(false);
    setTransactionToView(null);
  };

  const handleSave = (formData) => {
    const { type, ...data } = formData;
    const saveFunction = transactionToEdit ? views[type].edit : views[type].add;
    
    if (transactionToEdit) {
        saveFunction(transactionToEdit.id, data);
    } else {
        saveFunction(data);
    }
    handleCloseModals();
  };

  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      views[transactionToDelete.type].remove(transactionToDelete.id);
    }
    handleCloseModals();
  };
  
  const handleStatusUpdate = (newStatus) => {
    if (transactionToView && transactionToView.type === 'cheques') {
      const updatedTransaction = { ...transactionToView, status: newStatus };
      editCheque(updatedTransaction.id, updatedTransaction);
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
      />
      <div className={styles.content}>
        <TransactionList
          transactions={views[activeView].data}
          transactionType={activeView}
          practices={practices}
          isLoading={isLoading}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteModal}
          onView={handleOpenViewModal}
        />
      </div>

      <Modal isOpen={isFormModalOpen} onClose={handleCloseModals} title={transactionToEdit ? `Edit ${views[activeView].label}` : `Add New ${views[activeView].label}`}>
        <TransactionForm
          transactionToEdit={transactionToEdit}
          transactionType={activeView}
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
    </div>
  );
};

export default TransactionsPage;

