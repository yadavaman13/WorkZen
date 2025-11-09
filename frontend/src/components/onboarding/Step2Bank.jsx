import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function OnboardingStep2() {
  const { token } = useParams();
  const [formData, setFormData] = useState({
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_holder_name: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/onboarding/bank/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Bank information saved!');
        window.dispatchEvent(new CustomEvent('nextStep', { detail: { step: 2 } }));
      }
    } catch (error) {
      toast.error('Failed to save bank information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Step 2: Bank Information</h2>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="form-label">Bank Name *</label>
            <input
              type="text"
              name="bank_name"
              value={formData.bank_name}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., HDFC Bank"
              required
            />
          </div>

          <div>
            <label className="form-label">Account Number *</label>
            <input
              type="text"
              name="account_number"
              value={formData.account_number}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div>
            <label className="form-label">IFSC Code *</label>
            <input
              type="text"
              name="ifsc_code"
              value={formData.ifsc_code}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., HDFC0000001"
              required
            />
          </div>

          <div>
            <label className="form-label">Account Holder Name *</label>
            <input
              type="text"
              name="account_holder_name"
              value={formData.account_holder_name}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
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
            {loading ? 'Saving...' : 'Next Step'}
          </button>
        </div>
      </form>
    </div>
  );
}
