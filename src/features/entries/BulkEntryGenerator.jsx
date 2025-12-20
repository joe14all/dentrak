import React, { useState } from 'react';
import { useEntryTemplates } from '../../contexts/EntryTemplateContext/EntryTemplateContext';
import { useEntries } from '../../contexts/EntryContext/EntryContext';
import { useScheduleBlocks } from '../../contexts/ScheduleBlockContext/ScheduleBlockContext';
import { usePractices } from '../../contexts/PracticeContext/PracticeContext';
import styles from './BulkEntryGenerator.module.css';
import { Calendar, Copy, CheckCircle, AlertCircle } from 'lucide-react';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const BulkEntryGenerator = ({ onClose }) => {
  const { templates, generateBulkEntries } = useEntryTemplates();
  const { addNewEntry } = useEntries();
  const { isDateBlocked } = useScheduleBlocks();
  const { practices } = usePractices();
  
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);

  const selectedTemplate = templates.find(t => t.id === parseInt(selectedTemplateId, 10));

  const handleDayToggle = (day) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const getPracticeName = (practiceId) => {
    const practice = practices?.find(p => p.id === practiceId);
    return practice?.name || 'Unknown Practice';
  };

  const handleGenerate = async () => {
    if (!selectedTemplate || !startDate || !endDate || selectedDays.length === 0) {
      alert('Please fill in all fields and select at least one day of the week.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date must be before or equal to end date.');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Generate entries from template
      const entries = generateBulkEntries(
        selectedTemplate,
        startDate,
        endDate,
        selectedDays,
        isDateBlocked
      );

      if (entries.length === 0) {
        setGenerationResult({
          success: false,
          message: 'No entries were generated. All dates in the range are either blocked or do not match the selected days of the week.',
        });
        setIsGenerating(false);
        return;
      }

      // Add all entries to the database
      let successCount = 0;
      const errors = [];

      for (const entry of entries) {
        try {
          await addNewEntry(entry);
          successCount++;
        } catch {
          errors.push(`Failed to add entry for ${entry.date}`);
        }
      }

      setGenerationResult({
        success: successCount > 0,
        successCount,
        totalAttempted: entries.length,
        errors,
        message: successCount === entries.length
          ? `Successfully created ${successCount} entries!`
          : `Created ${successCount} of ${entries.length} entries. ${errors.length} failed.`,
      });

      // Clear form if all successful
      if (successCount === entries.length) {
        setTimeout(() => {
          setSelectedTemplateId('');
          setStartDate('');
          setEndDate('');
          setSelectedDays([]);
          setGenerationResult(null);
        }, 3000);
      }
    } catch (error) {
      setGenerationResult({
        success: false,
        message: `Error generating entries: ${error.message}`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Calendar size={24} />
        <h2>Bulk Entry Generator</h2>
      </div>

      <p className={styles.description}>
        Create multiple entries at once from a template. Select a date range and the days of the week
        you want to create entries for. Blocked dates will be automatically skipped.
      </p>

      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="template">Select Template *</label>
          <select
            id="template"
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            required
          >
            <option value="">Choose a template...</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name} - {getPracticeName(template.practiceId)}
              </option>
            ))}
          </select>
        </div>

        {selectedTemplate && (
          <div className={styles.templatePreview}>
            <h4>Template Preview</h4>
            <div className={styles.previewDetails}>
              <span><strong>Practice:</strong> {getPracticeName(selectedTemplate.practiceId)}</span>
              {selectedTemplate.production > 0 && (
                <span><strong>Production:</strong> ${selectedTemplate.production.toFixed(2)}</span>
              )}
              {selectedTemplate.collection > 0 && (
                <span><strong>Collection:</strong> ${selectedTemplate.collection.toFixed(2)}</span>
              )}
              {selectedTemplate.adjustments?.length > 0 && (
                <span><strong>Adjustments:</strong> {selectedTemplate.adjustments.length} item(s)</span>
              )}
            </div>
          </div>
        )}

        <div className={styles.dateRange}>
          <div className={styles.formGroup}>
            <label htmlFor="startDate">Start Date *</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="endDate">End Date *</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Select Days of Week *</label>
          <div className={styles.daySelector}>
            {DAYS_OF_WEEK.map(day => (
              <button
                key={day}
                type="button"
                className={`${styles.dayButton} ${selectedDays.includes(day) ? styles.selected : ''}`}
                onClick={() => handleDayToggle(day)}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>
          <p className={styles.hint}>
            Entries will only be created for the selected days within the date range.
            Blocked dates will be automatically skipped.
          </p>
        </div>

        {generationResult && (
          <div className={`${styles.result} ${generationResult.success ? styles.success : styles.error}`}>
            {generationResult.success ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <div>
              <p className={styles.resultMessage}>{generationResult.message}</p>
              {generationResult.errors?.length > 0 && (
                <ul className={styles.errorList}>
                  {generationResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={onClose}
            className={styles.cancelButton}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            className={styles.generateButton}
            disabled={isGenerating || !selectedTemplateId || !startDate || !endDate || selectedDays.length === 0}
          >
            {isGenerating ? (
              <>Generating...</>
            ) : (
              <>
                <Copy size={18} />
                Generate Entries
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkEntryGenerator;
