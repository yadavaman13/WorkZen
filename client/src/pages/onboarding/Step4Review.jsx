import { useState } from 'react';
import axios from '../../api/axios';

export default function Step4Review({ profile, userData, onPrev }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const personalData = profile?.step1_personal;
  const bankData = profile?.step2_bank;
  const documentsData = profile?.step3_documents;

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');
      
      // Submit for HR approval
      const token = localStorage.getItem('token');
      await axios.post('/onboarding/submit', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Show success message - the OnboardingWizard will detect status change and show pending message
      alert('Profile submitted for HR approval successfully!');
      window.location.reload();
    } catch (err) {
      console.error('Error submitting profile:', err);
      setError(err.response?.data?.error || 'Failed to submit profile');
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Review Your Information</h2>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          Please review all your information carefully. After submission, your profile will be sent to HR for approval.
        </p>
      </div>

      {/* Personal Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="bg-purple-100 text-purple-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">1</span>
          Personal Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Date of Birth</p>
            <p className="text-gray-900 font-medium">{personalData?.dateOfBirth || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Gender</p>
            <p className="text-gray-900 font-medium">{personalData?.gender || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Marital Status</p>
            <p className="text-gray-900 font-medium">{personalData?.maritalStatus || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phone</p>
            <p className="text-gray-900 font-medium">{personalData?.phone || 'N/A'}</p>
          </div>
          {personalData?.alternatePhone && (
            <div>
              <p className="text-sm text-gray-600">Alternate Phone</p>
              <p className="text-gray-900 font-medium">{personalData.alternatePhone}</p>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Address</p>
          <p className="text-gray-900">
            {personalData?.address}, {personalData?.city}, {personalData?.state} - {personalData?.zipCode}
            {personalData?.country && `, ${personalData.country}`}
          </p>
        </div>

        {/* Emergency Contact */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Emergency Contact</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="text-gray-900 font-medium">{personalData?.emergencyContactName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Relation</p>
              <p className="text-gray-900 font-medium">{personalData?.emergencyContactRelation || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="text-gray-900 font-medium">{personalData?.emergencyContactPhone || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bank & Tax Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="bg-purple-100 text-purple-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">2</span>
          Bank & Tax Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Account Holder Name</p>
            <p className="text-gray-900 font-medium">{bankData?.accountHolderName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Bank Name</p>
            <p className="text-gray-900 font-medium">{bankData?.bankName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Account Number</p>
            <p className="text-gray-900 font-medium">{bankData?.accountNumber ? '****' + bankData.accountNumber.slice(-4) : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">IFSC Code</p>
            <p className="text-gray-900 font-medium">{bankData?.ifscCode || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Branch</p>
            <p className="text-gray-900 font-medium">{bankData?.branch || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Account Type</p>
            <p className="text-gray-900 font-medium">{bankData?.accountType || 'N/A'}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">PAN Number</p>
            <p className="text-gray-900 font-medium">{bankData?.panNumber || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Aadhar Number</p>
            <p className="text-gray-900 font-medium">{bankData?.aadharNumber ? '****-****-' + bankData.aadharNumber.slice(-4) : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="bg-purple-100 text-purple-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">3</span>
          Documents
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Passport Photo</span>
            <span className={`text-sm font-medium ${documentsData?.photoUrl ? 'text-green-600' : 'text-gray-400'}`}>
              {documentsData?.photoUrl ? '✓ Provided' : 'Not provided'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Aadhar Card</span>
            <span className={`text-sm font-medium ${documentsData?.aadharCardUrl ? 'text-green-600' : 'text-gray-400'}`}>
              {documentsData?.aadharCardUrl ? '✓ Provided' : 'Not provided'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">PAN Card</span>
            <span className={`text-sm font-medium ${documentsData?.panCardUrl ? 'text-green-600' : 'text-gray-400'}`}>
              {documentsData?.panCardUrl ? '✓ Provided' : 'Not provided'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Education Certificate</span>
            <span className={`text-sm font-medium ${documentsData?.educationCertificateUrl ? 'text-green-600' : 'text-gray-400'}`}>
              {documentsData?.educationCertificateUrl ? '✓ Provided' : 'Not provided'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Experience Certificate</span>
            <span className={`text-sm font-medium ${documentsData?.experienceCertificateUrl ? 'text-green-600' : 'text-gray-400'}`}>
              {documentsData?.experienceCertificateUrl ? '✓ Provided' : 'Not provided'}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={onPrev}
          disabled={submitting}
          className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
        >
          ← Previous
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 flex items-center"
        >
          {submitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </>
          ) : (
            '✓ Submit for Approval'
          )}
        </button>
      </div>
    </div>
  );
}
