import React, { useState } from 'react';
import styles from './GeminiImporter.module.css';
import { Upload, LoaderCircle, AlertTriangle } from 'lucide-react';

const GeminiImporter = ({ practices, onSuccess, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setError(null);
    setIsLoading(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64ImageData = reader.result.split(',')[1];
      
      const practiceNames = practices.map(p => p.name).join(', ');
      const prompt = `Analyze the attached image of a bank transaction or paystub. Extract the practice name, total amount, and transaction date. Match the practice name exactly to one of these options: [${practiceNames}]. The current year is ${new Date().getFullYear()}. Format the output as a JSON object.`;
      
      const schema = {
        type: "OBJECT",
        properties: {
          practiceName: { type: "STRING" },
          amount: { type: "NUMBER" },
          date: { type: "STRING", description: "The transaction date in YYYY-MM-DD format" },
        },
        required: ["practiceName", "amount", "date"]
      };

      try {
        const apiKey = "";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const payload = {
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: file.type, data: base64ImageData } }
            ]
          }],
          generation_config: {
            response_mime_type: "application/json",
            response_schema: schema,
          }
        };

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) throw new Error("Could not extract information from the image.");

        const parsedData = JSON.parse(text);
        const matchedPractice = practices.find(p => p.name === parsedData.practiceName);
        if (!matchedPractice) throw new Error(`Could not match practice name "${parsedData.practiceName}".`);

        onSuccess({
            practiceId: matchedPractice.id,
            amount: parsedData.amount,
            paymentDate: new Date(parsedData.date).toISOString().split('T')[0],
            dateReceived: new Date(parsedData.date).toISOString().split('T')[0],
        });

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
  };

  return (
    <div className={styles.importerContainer}>
      <div className={styles.importerContent}>
        <div className={styles.uploadArea}>
          <input type="file" id="fileUpload" onChange={handleFileChange} accept="image/*" className={styles.fileInput} disabled={isLoading} />
          <label htmlFor="fileUpload" className={styles.uploadLabel}>
            <Upload size={24} />
            <span>{imagePreview ? 'Select a different screenshot' : 'Select a screenshot'}</span>
          </label>
          <p className={styles.infoText}>Upload a screenshot of a cheque, deposit, or e-transfer.</p>
        </div>

        {isLoading && (
          <div className={styles.status}>
            <LoaderCircle size={24} className={styles.spinner} />
            <span>Analyzing image...</span>
          </div>
        )}
        
        {error && (
          <div className={`${styles.status} ${styles.error}`}>
              <AlertTriangle size={24} />
              <span>{error}</span>
          </div>
        )}

        {imagePreview && (
          <div className={styles.preview}>
            <h4>Screenshot Preview</h4>
            <img src={imagePreview} alt="Transaction preview" />
          </div>
        )}
      </div>
      
      {/* Floating Action Bar */}
      <div className={styles.actions}>
          <button onClick={onCancel} className={styles.cancelButton}>
              Cancel
          </button>
      </div>
    </div>
  );
};

export default GeminiImporter;

