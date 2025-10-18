import React, { useState, useMemo } from 'react';
import { usePayments } from '../../contexts/PaymentContext/PaymentContext';
import { usePractices } from '../../contexts/PracticeContext/PracticeContext';
import PaymentsToolbar from '../../features/payments/PaymentsToolbar';
import PaymentsSummary from '../../features/payments/PaymentsSummary'; // Import the new component
import PaymentsList from '../../features/payments/PaymentsList';
import Modal from '../../components/common/Modal/Modal';
import PaymentForm from '../../features/payments/form-components/PaymentForm';
import DeleteConfirmation from '../../features/payments/DeleteConfirmation';
import styles from './PaymentsPage.module.css';

const PaymentsPage = () => {
  const { payments, isLoading, addNewPayment, editPayment, removePayment } = usePayments();
  const { practices } = usePractices();

  const [filters, setFilters] = useState({
    practiceId: 'all',
    methods: [],
    startDate: '',
    endDate: '',
  });

  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);

  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    
    return payments.filter(payment => {
      const practiceMatch = filters.practiceId === 'all' || payment.practiceId === parseInt(filters.practiceId);
      const methodMatch = filters.methods.length === 0 || filters.methods.includes(payment.paymentMethod);
      const startDateMatch = !filters.startDate || new Date(payment.paymentDate) >= new Date(filters.startDate);
      const endDateMatch = !filters.endDate || new Date(payment.paymentDate) <= new Date(filters.endDate);
      
      return practiceMatch && methodMatch && startDateMatch && endDateMatch;
    });
  }, [payments, filters]);

  // Calculate summary data from the filtered payments
  const paymentsSummaryData = useMemo(() => {
    return filteredPayments.reduce((acc, payment) => {
      acc.totalAmount += payment.amount || 0;
      acc.paymentCount += 1;
      return acc;
    }, { totalAmount: 0, paymentCount: 0 });
  }, [filteredPayments]);

  const handleOpenAddModal = () => {
    setPaymentToEdit(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (payment) => {
    setPaymentToEdit(payment);
    setFormModalOpen(true);
  };

  const handleOpenDeleteModal = (paymentId) => {
    setPaymentToDelete(paymentId);
    setDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setFormModalOpen(false);
    setDeleteModalOpen(false);
    setPaymentToEdit(null);
    setPaymentToDelete(null);
  };

  const handleSavePayment = (formData) => {
    if (paymentToEdit) {
      editPayment(paymentToEdit.id, formData);
    } else {
      addNewPayment(formData);
    }
    handleCloseModals();
  };

  const handleConfirmDelete = () => {
    if (paymentToDelete) {
      removePayment(paymentToDelete);
    }
    handleCloseModals();
  };

  return (
    <div className={styles.paymentsPage}>
      <PaymentsToolbar
        practices={practices}
        activeFilters={filters}
        onFilterChange={setFilters}
        onAddPayment={handleOpenAddModal}
      />
      <PaymentsSummary summaryData={paymentsSummaryData} />
      <div className={styles.content}>
        <PaymentsList
          payments={filteredPayments}
          practices={practices}
          isLoading={isLoading}
          onEditPayment={handleOpenEditModal}
          onDeletePayment={handleOpenDeleteModal}
        />
      </div>
      <Modal isOpen={isFormModalOpen} onClose={handleCloseModals} title={paymentToEdit ? "Edit Payment" : "Add New Payment"}>
        <PaymentForm
          paymentToEdit={paymentToEdit}
          practices={practices}
          onSave={handleSavePayment}
          onCancel={handleCloseModals}
        />
      </Modal>
      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseModals} title="Confirm Deletion">
        <DeleteConfirmation onConfirm={handleConfirmDelete} onCancel={handleCloseModals} />
      </Modal>
    </div>
  );
};

export default PaymentsPage;