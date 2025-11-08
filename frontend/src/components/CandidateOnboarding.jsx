import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { onboardingAPI } from '../services/api';

function CandidateOnboarding() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Step 1: Personal Information
  const [personalInfo, setPersonalInfo] = useState({
    full_name: '',
    dob: '',
    contact_number: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  // Step 2: Bank Information
  const [bankInfo, setBankInfo] = useState({
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_holder_name: ''
  });

  // Step 3: Documents
  const [documents, setDocuments] = useState({
    pan: '',
    aadhaar: ''
  });

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setMessage({ type: 'error', text: 'Invalid onboarding link. Token is missing.' });
      setLoading(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      setLoading(true);
      const response = await onboardingAPI.validateToken(token);
      setOnboardingData(response.data.onboarding);
      
      // Determine which step to show based on status
      const status = response.data.onboarding.status;
      if (status === 'invited' || status === 'changes_requested') {
        setCurrentStep(1);
        if (status === 'changes_requested') {
          setMessage({ 
            type: 'error', 
            text: 'HR has requested changes to your submission. Please review and update your information.' 
          });
        }
      }
      else if (status === 'step1_completed') setCurrentStep(2);
      else if (status === 'step2_completed') setCurrentStep(3);
      else if (status === 'pending_review') {
        setMessage({ type: 'success', text: 'Your application has been submitted and is under review!' });
      }
      else if (status === 'approved') {
        setMessage({ type: 'success', text: 'Your onboarding has been approved! You will receive login credentials via email.' });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Invalid or expired onboarding link' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onboardingAPI.savePersonalInfo(token, personalInfo);
      setMessage({ type: 'success', text: 'Personal information saved!' });
      setCurrentStep(2);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to save personal information' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBankInfoSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onboardingAPI.saveBankInfo(token, bankInfo);
      setMessage({ type: 'success', text: 'Bank information saved!' });
      setCurrentStep(3);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to save bank information' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentsSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Submit documents
      await onboardingAPI.savePersonalInfo(token, {
        ...personalInfo,
        pan_number: documents.pan,
        aadhaar_number: documents.aadhaar
      });
      
      // Submit the onboarding
      await onboardingAPI.submitOnboarding(token);
      
      setMessage({ 
        type: 'success', 
        text: 'Onboarding completed! Your application is now under review.' 
      });
      setCurrentStep(4);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to submit onboarding' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !onboardingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating onboarding link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Welcome to WorkZen!</h1>
          <p className="text-gray-600">
            Complete your onboarding to join {onboardingData?.department} as {onboardingData?.position}
          </p>
        </div>

        {/* HR Comments (if changes requested) */}
        {onboardingData?.status === 'changes_requested' && onboardingData?.review_comments && (
          <div className="mb-6 p-6 rounded-lg bg-orange-50 border border-orange-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <h3 className="font-semibold text-orange-900 mb-2">Changes Requested by HR</h3>
                <p className="text-orange-800 whitespace-pre-wrap">{onboardingData.review_comments}</p>
              </div>
            </div>
          </div>
        )}

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 
            'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-start gap-2">
              <span className="text-lg">{message.type === 'success' ? '✅' : '⚠️'}</span>
              <div>{message.text}</div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        {onboardingData && currentStep <= 3 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-24 h-1 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className={currentStep >= 1 ? 'text-blue-600 font-semibold' : 'text-gray-500'}>Personal Info</span>
              <span className={currentStep >= 2 ? 'text-blue-600 font-semibold' : 'text-gray-500'}>Bank Details</span>
              <span className={currentStep >= 3 ? 'text-blue-600 font-semibold' : 'text-gray-500'}>Documents</span>
            </div>
          </div>
        )}

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Personal Information</h2>
            <form onSubmit={handlePersonalInfoSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={personalInfo.full_name}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                  <input
                    type="date"
                    value={personalInfo.dob}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, dob: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number *</label>
                  <input
                    type="tel"
                    value={personalInfo.contact_number}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, contact_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    value={personalInfo.city}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                  <input
                    type="text"
                    value={personalInfo.state}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, state: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
                  <input
                    type="text"
                    value={personalInfo.pincode}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, pincode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                <textarea
                  value={personalInfo.address}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {loading ? 'Saving...' : 'Continue to Bank Details'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Bank Information */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Bank Information</h2>
            <form onSubmit={handleBankInfoSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name *</label>
                  <input
                    type="text"
                    value={bankInfo.bank_name}
                    onChange={(e) => setBankInfo({ ...bankInfo, bank_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name *</label>
                  <input
                    type="text"
                    value={bankInfo.account_holder_name}
                    onChange={(e) => setBankInfo({ ...bankInfo, account_holder_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Number *</label>
                  <input
                    type="text"
                    value={bankInfo.account_number}
                    onChange={(e) => setBankInfo({ ...bankInfo, account_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code *</label>
                  <input
                    type="text"
                    value={bankInfo.ifsc_code}
                    onChange={(e) => setBankInfo({ ...bankInfo, ifsc_code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {loading ? 'Saving...' : 'Continue to Documents'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Documents */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Identity Documents</h2>
            <form onSubmit={handleDocumentsSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number *</label>
                  <input
                    type="text"
                    value={documents.pan}
                    onChange={(e) => setDocuments({ ...documents, pan: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="ABCDE1234F"
                    pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Aadhaar Number *</label>
                  <input
                    type="text"
                    value={documents.aadhaar}
                    onChange={(e) => setDocuments({ ...documents, aadhaar: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="1234 5678 9012"
                    pattern="[0-9]{12}"
                    maxLength="12"
                    required
                  />
                </div>
              </div>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Make sure your PAN and Aadhaar details are correct. These will be verified by HR.
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-green-400"
                >
                  {loading ? 'Submitting...' : 'Submit Onboarding'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 4: Completion */}
        {currentStep === 4 && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-green-600 mb-4">Onboarding Complete!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for completing your onboarding. Your application is now under review by our HR team.
              You will receive an email notification once your account is approved.
            </p>
            <div className="bg-blue-50 rounded-lg p-6">
              <p className="text-sm text-blue-800">
                <strong>What's Next?</strong><br/>
                • HR will review your information<br/>
                • You'll receive login credentials via email<br/>
                • You can start working once approved
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CandidateOnboarding;
