import React, { useState, useMemo } from 'react';
import { usePractices } from '../../contexts/PracticeContext/PracticeContext';
import PracticeList from '../../features/practices/PracticeList';
import PracticeFilters from '../../features/practices/PracticeFilters';
import PracticeForm from '../../features/practices/PracticeForm';
import Modal from '../../components/common/Modal/Modal';
import styles from './PracticesPage.module.css';
import { PlusCircle, Trash2 } from 'lucide-react';

const PracticesPage = () => {
  const { practices, isLoading, addNewPractice, editPractice, removePractice } = usePractices();
  
  const [activeFilter, setActiveFilter] = useState('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'delete'
  const [currentPractice, setCurrentPractice] = useState(null);

  const filteredPractices = useMemo(() => {
    if (!practices) return [];
    switch (activeFilter) {
      case 'active':
        return practices.filter(p => p.status === 'active' || !p.status);
      case 'archived':
        return practices.filter(p => p.status === 'archived');
      case 'contractor':
        return practices.filter(p => p.taxStatus === 'contractor' && (p.status === 'active' || !p.status));
      case 'employee':
        return practices.filter(p => p.taxStatus === 'employee' && (p.status === 'active' || !p.status));
      default:
        return practices;
    }
  }, [practices, activeFilter]);

  const handleOpenModal = (mode, practice = null) => {
    setModalMode(mode);
    setCurrentPractice(practice);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentPractice(null);
  };

  const handleSavePractice = async (formData) => {
    if (modalMode === 'edit') {
      await editPractice(currentPractice.id, formData);
    } else {
      await addNewPractice(formData);
    }
    handleCloseModal();
  };

  const handleDeletePractice = async () => {
    if (currentPractice) {
      await removePractice(currentPractice.id);
    }
    handleCloseModal();
  };

  return (
    <>
      <div className={styles.practicesPage}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.title}>Manage Practices</h2>
            <PracticeFilters activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
          </div>
          <button className={styles.addButton} onClick={() => handleOpenModal('add')}>
            <PlusCircle size={16} />
            <span>Add New Practice</span>
          </button>
        </div>
        <PracticeList 
          practices={filteredPractices} 
          isLoading={isLoading}
          onEdit={(practice) => handleOpenModal('edit', practice)}
          onDelete={(practice) => handleOpenModal('delete', practice)}
        />
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title={
          modalMode === 'add' ? 'Add New Practice' :
          modalMode === 'edit' ? 'Edit Practice' : 'Confirm Deletion'
        }
      >
        {modalMode === 'add' || modalMode === 'edit' ? (
          <PracticeForm 
            practiceToEdit={currentPractice} 
            onSave={handleSavePractice} 
            onCancel={handleCloseModal} 
          />
        ) : (
          <div>
            <p>Are you sure you want to delete <strong>{currentPractice?.name}</strong>? This action cannot be undone.</p>
            <div className={styles.deleteActions}>
                <button onClick={handleCloseModal} className={styles.cancelButton}>Cancel</button>
                <button onClick={handleDeletePractice} className={styles.confirmDeleteButton}>
                    <Trash2 size={16}/> Delete
                </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default PracticesPage;

