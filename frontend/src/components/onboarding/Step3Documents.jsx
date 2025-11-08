import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function OnboardingStep3() {
  const { token } = useParams();
  const [files, setFiles] = useState({
    pan: null,
    aadhaar: null,
    resume: null,
    address_proof: null
  });
  const [ocrData, setOcrData] = useState({
    pan: '',
    aadhaar: ''
  });
  const [loading, setLoading] = useState(false);
  const [ocrRunning, setOcrRunning] = useState(false);

  const handleFileChange = (e) => {
    const { name, files: uploadedFiles } = e.target;
    setFiles({
      ...files,
      [name]: uploadedFiles[0]
    });
  };

  const handleRunOCR = async (docType) => {
    if (!files[docType]) {
      toast.error('Please upload document first');
      return;
    }

    setOcrRunning(true);
    const formData = new FormData();
    formData.append('file', files[docType]);

    try {
      const response = await fetch(`/api/onboarding/ocr/extract`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (docType === 'pan' && data.extracted_data.pan) {
        setOcrData(prev => ({ ...prev, pan: data.extracted_data.pan }));
        toast.success('PAN extracted successfully!');
      }
      if (docType === 'aadhaar' && data.extracted_data.aadhaar) {
        setOcrData(prev => ({ ...prev, aadhaar: data.extracted_data.aadhaar }));
        toast.success('Aadhaar extracted successfully!');
      }
    } catch (error) {
      toast.error('OCR extraction failed');
    } finally {
      setOcrRunning(false);
    }
  };

  const handleUploadAll = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    Object.entries(files).forEach(([key, file]) => {
      if (file) formData.append(key, file);
    });

    try {
      const response = await fetch(`/api/onboarding/upload/${token}`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast.success('Documents uploaded successfully!');
        window.dispatchEvent(new CustomEvent('nextStep', { detail: { step: 3 } }));
      }
    } catch (error) {
      toast.error('Failed to upload documents');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Step 3: Documents & Verification</h2>

      <form onSubmit={handleUploadAll}>
        {/* PAN Card */}
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <label className="form-label">PAN Card *</label>
          <input
            type="file"
            name="pan"
            onChange={handleFileChange}
            accept="image/*,.pdf"
            className="form-input mb-2"
            required
          />
          {files.pan && (
            <button
              type="button"
              onClick={() => handleRunOCR('pan')}
              disabled={ocrRunning}
              className="text-blue-600 hover:text-blue-800 text-sm font-semibold mb-2"
            >
              {ocrRunning ? '⏳ Extracting...' : '🔍 Extract PAN'}
            </button>
          )}
          {ocrData.pan && (
            <div className="bg-green-50 p-2 rounded mb-2">
              <input
                type="text"
                value={ocrData.pan}
                readOnly
                className="w-full bg-green-100 p-2 rounded border border-green-300"
                placeholder="PAN"
              />
            </div>
          )}
        </div>

        {/* Aadhaar */}
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <label className="form-label">Aadhaar Card *</label>
          <input
            type="file"
            name="aadhaar"
            onChange={handleFileChange}
            accept="image/*,.pdf"
            className="form-input mb-2"
            required
          />
          {files.aadhaar && (
            <button
              type="button"
              onClick={() => handleRunOCR('aadhaar')}
              disabled={ocrRunning}
              className="text-blue-600 hover:text-blue-800 text-sm font-semibold mb-2"
            >
              {ocrRunning ? '⏳ Extracting...' : '🔍 Extract Aadhaar'}
            </button>
          )}
          {ocrData.aadhaar && (
            <div className="bg-green-50 p-2 rounded mb-2">
              <input
                type="text"
                value={ocrData.aadhaar}
                readOnly
                className="w-full bg-green-100 p-2 rounded border border-green-300"
                placeholder="Aadhaar"
              />
            </div>
          )}
        </div>

        {/* Resume */}
        <div className="mb-6">
          <label className="form-label">Resume</label>
          <input
            type="file"
            name="resume"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
            className="form-input"
          />
        </div>

        {/* Address Proof */}
        <div className="mb-6">
          <label className="form-label">Address Proof</label>
          <input
            type="file"
            name="address_proof"
            onChange={handleFileChange}
            accept="image/*,.pdf"
            className="form-input"
          />
        </div>

        <div className="mt-6 flex gap-4">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('prevStep'))}
            className="btn-secondary flex-1"
          >
            Previous
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Next Step'}
          </button>
        </div>
      </form>
    </div>
  );
}
