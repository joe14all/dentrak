import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import styles from './ReportImporter.module.css';
import ImportConfirmationModal from './ImportConfirmationModal';
import { parseDaySheetPDF } from '../../utils/pdfParser';
import { aggregateProcedures } from '../../utils/procedureAggregator';

const ReportImporter = ({ practices, onImport, onClose, isImporting, importProgress }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPractice, setSelectedPractice] = useState('');
  const [parsedEntries, setParsedEntries] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!file) return false;
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return true;
    } else if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
      return true;
    }
    return false;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (validateFile(file)) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please select a valid PDF or CSV file');
        setSelectedFile(null);
      }
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (validateFile(file)) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please drop a valid PDF or CSV file');
        setSelectedFile(null);
      }
    }
  };

  const handlePracticeChange = (e) => {
    setSelectedPractice(e.target.value);
  };

  const handleProcessFile = async () => {
    if (!selectedFile || !selectedPractice) {
      setError('Please select both a file and a practice');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let rawProcedures;
      
      // Determine file type and parse accordingly
      if (selectedFile.name.toLowerCase().endsWith('.csv')) {
        // Parse CSV file
        const text = await selectedFile.text();
        const { parseCSV } = await import('../../utils/pdfParser');
        rawProcedures = parseCSV(text);
      } else {
        // Parse PDF file
        rawProcedures = await parseDaySheetPDF(selectedFile);
      }
      
      if (!rawProcedures || rawProcedures.length === 0) {
        throw new Error('No procedures found in the file');
      }

      // Aggregate procedures by patient and date
      const aggregatedEntries = aggregateProcedures(
        rawProcedures, 
        parseInt(selectedPractice)
      );

      setParsedEntries(aggregatedEntries);
      setShowConfirmation(true);
    } catch (err) {
      console.error('Error processing file:', err);
      setError(err.message || 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = (entriesToImport) => {
    onImport(entriesToImport);
    // Do NOT reset here — keep confirmation modal mounted so the
    // importing overlay remains visible until EntriesPage finishes.
  };

  const handleReset = () => {
    setSelectedFile(null);
    setSelectedPractice('');
    setParsedEntries(null);
    setShowConfirmation(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className={styles.importerContainer}>
        <div className={styles.header}>
          <FileText size={24} />
          <h2>Import Day Sheet Report</h2>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <label className={styles.sectionLabel}>
              1. Select Practice <span className={styles.required}>*</span>
            </label>
            <select 
              value={selectedPractice} 
              onChange={handlePracticeChange}
              className={`${styles.practiceSelect} ${!selectedPractice && selectedFile ? styles.highlight : ''}`}
              disabled={isProcessing}
            >
              <option value="">Choose a practice...</option>
              {practices.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {!selectedPractice && selectedFile && (
              <p className={styles.selectHint}>Please select a practice to continue</p>
            )}
          </div>

          <div className={styles.section}>
            <label className={styles.sectionLabel}>
              2. Upload Day Sheet File <span className={styles.required}>*</span>
            </label>
            <div 
              className={`${styles.fileUpload} ${isDragging ? styles.dragging : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv"
                onChange={handleFileSelect}
                className={styles.fileInput}
                id="pdf-upload"
                disabled={isProcessing}
              />
              <label htmlFor="pdf-upload" className={styles.fileLabel}>
                <Upload size={20} />
                <span>
                  {selectedFile 
                    ? selectedFile.name 
                    : isDragging 
                      ? 'Drop file here...' 
                      : 'Drop file here or click to browse'}
                </span>
              </label>
            </div>
            <p className={styles.hint}>
              Supported formats: Day Sheet PDF reports or CSV files
            </p>
          </div>

          {error && (
            <div className={styles.error}>
              <AlertCircle size={18} />
              <div>
                <div>{error}</div>
                {error.includes('parse PDF') && (
                  <div className={styles.errorHint}>
                    <strong>Alternative:</strong> Try converting to CSV format or check browser console for details.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProcessFile}
              className={styles.processButton}
              disabled={!selectedFile || !selectedPractice || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Process & Preview'}
            </button>
          </div>
        </div>
      </div>

      {showConfirmation && parsedEntries && (
        <ImportConfirmationModal
          entries={parsedEntries}
          practiceName={practices.find(p => p.id === parseInt(selectedPractice))?.name}
          onConfirm={handleConfirmImport}
          onCancel={() => {
            if (isImporting) return;
            setShowConfirmation(false);
            setParsedEntries(null);
          }}
          isImporting={isImporting}
          importProgress={importProgress}
        />
      )}
    </>
  );
};

export default ReportImporter;
