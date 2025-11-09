import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Step4Review({ token }) {
  const [pan, setPan] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [panVerified, setPanVerified] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/onboarding/submit/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pan,
          aadhaar,
          pan_verified: panVerified,
          aadhaar_verified: aadhaarVerified
        })
      });

      if (response.ok) {
        toast.success('Onboarding submitted successfully! Check your email for updates.');
        setTimeout(() => {
          navigate('/onboard/success');
        }, 2000);
      } else {
        const data = await response.json();
        if (data.warning) {
          toast.warning(data.error);
        } else {
          toast.error(data.error);
        }
      }
    } catch (error) {
      toast.error('Failed to submit onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Step 4: Review & Submit</h2>

      <form onSubmit={handleSubmit}>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-4">Please verify your identification:</h3>

          <div className="space-y-4">
            <div>
              <label className="form-label">PAN Number *</label>
              <input
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                className="form-input"
                placeholder="ABCDE1234F"
                maxLength="10"
                required
              />
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="pan_verify"
                  checked={panVerified}
                  onChange={(e) => setPanVerified(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="pan_verify" className="text-sm text-gray-600">
                  I confirm this is my correct PAN
                </label>
              </div>
            </div>

            <div>
              <label className="form-label">Aadhaar Number *</label>
              <input
                type="text"
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
                className="form-input"
                placeholder="1234 1234 1234"
                maxLength="12"
                required
              />
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="aadhaar_verify"
                  checked={aadhaarVerified}
                  onChange={(e) => setAadhaarVerified(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="aadhaar_verify" className="text-sm text-gray-600">
                  I confirm this is my correct Aadhaar
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-900">
            ⚠️ Please ensure all information is correct. After submission, an HR officer will review your details.
          </p>
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
            disabled={loading || !panVerified || !aadhaarVerified}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : '✓ Submit Onboarding'}
          </button>
        </div>
      </form>
    </div>
  );
}
