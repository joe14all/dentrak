import React, { useState, useMemo } from 'react';
import styles from './FinancialsPage.module.css'; // Create this CSS file later
import { useTransactions } from '../../contexts/TransactionContext/TransactionContext';
import { usePractices } from '../../contexts/PracticeContext/PracticeContext';
import { usePayments } from '../../contexts/PaymentContext/PaymentContext'; // Keep for potential cash payments
import FinancialsToolbar from '../../features/financials/FinancialsToolbar';
import FinancialsList from '../../features/financials/FinancialsList';
import Modal from '../../components/common/Modal/Modal';
import TransactionForm from '../../features/transactions/form-components/TransactionForm'; // Reuse existing form
import DeleteConfirmation from '../../features/transactions/DeleteConfirmation'; // Reuse existing confirmation
import TransactionViewCard from '../../features/transactions/TransactionViewCard'; // Reuse existing view card
import GeminiImporter from '../../features/transactions/GeminiImporter'; // Reuse existing importer
import { CreditCard, Landmark, MousePointerClick, Wallet, List } from 'lucide-react'; // Added Wallet for cash

const FinancialsPage = () => {
  const {
    cheques, directDeposits, eTransfers, isLoading: isTransactionsLoading,
    addNewCheque, editCheque, removeCheque,
    addNewDirectDeposit, editDirectDeposit, removeDirectDeposit,
    addNewETransfer, editETransfer, removeETransfer,
  } = useTransactions();
  const { practices } = usePractices();
  // Get payments context, primarily for cash and potentially future generic payments
  const { payments, isLoading: isPaymentsLoading, addNewPayment, editPayment, removePayment } = usePayments();

  const [activeView, setActiveView] = useState('all'); // Filter state (all, cheque, deposit, etc.)

  // State for modals (similar to TransactionsPage)
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [transactionToView, setTransactionToView] = useState(null);
  const [isImportModalOpen, setImportModalOpen] = useState(false);

  // Combine all financial data sources
  const allFinancialItems = useMemo(() => {
    // Start with transactions
    const transactions = [
      ...cheques.map(t => ({ ...t, type: 'cheques', uniqueId: `cheque-${t.id}` })),
      ...directDeposits.map(t => ({ ...t, type: 'directDeposits', uniqueId: `deposit-${t.id}` })),
      ...eTransfers.map(t => ({ ...t, type: 'eTransfers', uniqueId: `transfer-${t.id}` })),
    ];
    // Add cash payments from the payments context
    const cashPayments = payments
        .filter(p => p.paymentMethod === 'cash')
        .map(p => ({
            ...p, // Spread payment properties
            type: 'cash', // Explicitly set type
            uniqueId: `cash-${p.id}`,
            // Map payment fields to expected transaction fields for consistency in TransactionRow/ViewCard
            amount: p.amount,
            dateReceived: p.paymentDate, // Use paymentDate as the primary date field
            paymentDate: p.paymentDate,
            status: 'Completed', // Cash is typically completed immediately
            notes: p.notes,
            practiceId: p.practiceId,
            referenceNumber: p.referenceNumber || 'Cash Payment',
        }));


    // Combine and sort by date (most recent first)
    return [...transactions, ...cashPayments].sort((a, b) => {
        // Use a consistent date field for sorting
        const dateA = new Date(a.dateReceived || a.paymentDate || 0);
        const dateB = new Date(b.dateReceived || b.paymentDate || 0);
        return dateB - dateA;
     });
  }, [cheques, directDeposits, eTransfers, payments]);

  // Define views/filters for the toolbar and data filtering
  const views = useMemo(() => ({
    all: { label: 'All', icon: List, data: allFinancialItems },
    cheques: { label: 'Cheques', icon: CreditCard, data: allFinancialItems.filter(t => t.type === 'cheques') },
    directDeposits: { label: 'Deposits', icon: Landmark, data: allFinancialItems.filter(t => t.type === 'directDeposits') },
    eTransfers: { label: 'E-Transfers', icon: MousePointerClick, data: allFinancialItems.filter(t => t.type === 'eTransfers') },
    cash: { label: 'Cash', icon: Wallet, data: allFinancialItems.filter(t => t.type === 'cash') },
  }), [allFinancialItems]);

  // --- Modal Handlers (largely reusable from TransactionsPage) ---
  const handleOpenAddModal = () => { setTransactionToEdit(null); setFormModalOpen(true); };
  const handleOpenEditModal = (item) => {
      // Need to handle editing cash payments via PaymentForm if necessary
      if (item.type === 'cash') {
          console.warn("Editing cash payments directly might require PaymentForm integration.");
          // For now, let's allow editing basic fields via TransactionForm, assuming mappings exist
          setTransactionToEdit({ ...item, type: 'cash' }); // Ensure type is explicitly passed
          setFormModalOpen(true);
      } else {
          setTransactionToEdit(item);
          setFormModalOpen(true);
      }
   };
  const handleOpenDeleteModal = (itemId, itemType) => { setTransactionToDelete({ id: itemId, type: itemType }); setDeleteModalOpen(true); };
  const handleOpenViewModal = (item) => { setTransactionToView(item); setViewModalOpen(true); };
  const handleCloseModals = () => { /* ... same as TransactionsPage ... */
    setFormModalOpen(false);
    setDeleteModalOpen(false);
    setViewModalOpen(false);
    setImportModalOpen(false);
    setTransactionToEdit(null);
    setTransactionToDelete(null);
    setTransactionToView(null);
   };
   const handleImportSuccess = (parsedData) => { /* ... same as TransactionsPage ... */
    setImportModalOpen(false);
    setTransactionToEdit(parsedData); // Gemini importer likely gives transaction-like structure
    setFormModalOpen(true);
    };

  // --- Save Handler ---
  const handleSave = async (formData) => {
    const { type, ...data } = formData;
    let action = null;
    let editId = transactionToEdit?.id;

    console.log(`Saving item type: ${type}`, data);

    // Determine the correct action (add/edit) based on type
    switch (type) {
      case 'cheques': action = editId ? editCheque : addNewCheque; break;
      case 'directDeposits': action = editId ? editDirectDeposit : addNewDirectDeposit; break;
      case 'eTransfers': action = editId ? editETransfer : addNewETransfer; break;
      case 'cash':
        // Map back to payment structure if needed, or adjust PaymentContext functions
        const paymentData = {
          practiceId: data.practiceId,
          paymentDate: data.paymentDate || data.dateReceived, // Use the relevant date
          amount: data.amount,
          paymentMethod: 'cash',
          referenceNumber: data.referenceNumber,
          notes: data.notes,
        };
        action = editId ? (id, pData) => editPayment(id, pData) : addNewPayment;
        // Use paymentData for add/edit operations with PaymentContext
        if (action) {
          await (editId ? action(editId, paymentData) : action(paymentData));
        }
        handleCloseModals();
        return; // Exit early as PaymentContext handles refresh
      default:
        console.error(`Unknown transaction type: ${type}`);
        handleCloseModals();
        return;
    }

    if (action) {
      await (editId ? action(editId, data) : action(data));
    }
    handleCloseModals();
    // TransactionContext functions should handle their own refresh via autoRefreshAll
  };


  // --- Delete Handler ---
  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    const { id, type } = transactionToDelete;
    let removeAction = null;

    switch (type) {
      case 'cheques': removeAction = removeCheque; break;
      case 'directDeposits': removeAction = removeDirectDeposit; break;
      case 'eTransfers': removeAction = removeETransfer; break;
      case 'cash': removeAction = removePayment; break; // Use removePayment from PaymentContext
      default: console.error(`Unknown transaction type for delete: ${type}`);
    }

    if (removeAction) {
      await removeAction(id);
    }
    handleCloseModals();
    // Contexts handle their own refresh
  };

  // Status update handler (only for cheques currently)
  const handleStatusUpdate = async (newStatus) => {
      if (transactionToView && transactionToView.type === 'cheques') {
          // Clone the transaction to avoid direct state mutation before context update
          const updatedTransactionData = { ...transactionToView, status: newStatus };
          // Remove uniqueId and type before sending to edit function if they cause issues
          const { uniqueId, type, ...dataToUpdate } = updatedTransactionData;
          try {
              await editCheque(transactionToView.id, dataToUpdate);
              // Update the view modal state *after* successful save
              setTransactionToView(updatedTransactionData);
          } catch (error) {
              console.error("Failed to update cheque status:", error);
              // Optionally show an error message to the user
          }
      } else {
          console.warn("Status updates only implemented for cheques.");
      }
  };


  // Edit from View handler
  const handleEditFromView = () => {
    if (transactionToView) {
      handleOpenEditModal(transactionToView); // Directly call the edit modal handler
      // Close the view modal immediately *after* opening the edit modal
      setViewModalOpen(false);
    }
  };


  return (
    <div className={styles.page}>
      <FinancialsToolbar
        views={Object.entries(views).map(([id, { label, icon }]) => ({ id, label, icon }))}
        activeView={activeView}
        setActiveView={setActiveView}
        onAddTransaction={handleOpenAddModal}
        onOpenImporter={() => setImportModalOpen(true)}
      />
      <div className={styles.content}>
        <FinancialsList
          items={views[activeView]?.data || []} // Use optional chaining
          practices={practices}
          isLoading={isTransactionsLoading || isPaymentsLoading}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteModal}
          onView={handleOpenViewModal}
        />
      </div>

      {/* --- Modals --- */}
      <Modal isOpen={isFormModalOpen} onClose={handleCloseModals} title={transactionToEdit ? `Edit Financial Item` : `Log New Financial Item`}>
        <TransactionForm
          transactionToEdit={transactionToEdit}
          // Default to 'cheques' if adding from 'all' view, else use the active filter type
          initialType={activeView !== 'all' ? activeView : 'cheques'}
          practices={practices}
          onSave={handleSave}
          onCancel={handleCloseModals}
        />
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseModals} title="Confirm Deletion">
        <DeleteConfirmation onConfirm={handleConfirmDelete} onCancel={handleCloseModals} />
      </Modal>

       <Modal isOpen={isViewModalOpen} onClose={handleCloseModals} title="Financial Item Details">
        {/* Pass the transactionToView to TransactionViewCard */}
        {transactionToView && (
          <TransactionViewCard
            transaction={transactionToView}
            practice={practices.find(p => p.id === transactionToView.practiceId)}
            onStatusChange={handleStatusUpdate} // Pass the status update handler
            onEdit={handleEditFromView}         // Pass the edit handler
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

export default FinancialsPage;