import { useState, useEffect } from 'react';
import axios from '../api/axios';

export default function HROnboardingReview() {
  const [pendingProfiles, setPendingProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingProfiles();
  }, []);

  const fetchPendingProfiles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/onboarding/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingProfiles(response.data.profiles || []);
    } catch (error) {
      console.error('Error fetching pending profiles:', error);
      alert('Failed to load pending profiles');
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (profile, action) => {
    setSelectedProfile(profile);
    setReviewAction(action);
    setRejectionNotes('');
    setShowReviewModal(true);
  };

  const handleReview = async () => {
    if (reviewAction === 'reject' && !rejectionNotes.trim()) {
      alert('Please provide rejection notes');
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      await axios.put(`/api/onboarding/review/${selectedProfile.id}`, {
        action: reviewAction,
        rejectionNotes: reviewAction === 'reject' ? rejectionNotes : undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Profile ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully!`);
      setShowReviewModal(false);
      fetchPendingProfiles(); // Refresh list
    } catch (error) {
      console.error('Error reviewing profile:', error);
      alert(error.response?.data?.error || 'Failed to review profile');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pending profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Employee Onboarding Review</h1>
          <p className="text-gray-600 mt-2">Review and approve employee onboarding profiles</p>
        </div>

        {pendingProfiles.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Pending Profiles</h3>
            <p className="text-gray-500">There are no employee profiles waiting for approval</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {pendingProfiles.map((profile) => (
              <div key={profile.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-purple-100 text-purple-700 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                        {profile.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{profile.user_name}</h3>
                        <p className="text-gray-600">{profile.user_email}</p>
                        <p className="text-sm text-gray-500 mt-1">Employee ID: {profile.user_employee_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        Pending Review
                      </span>
                      <p className="text-xs text-gray-500 mt-2">
                        Submitted: {new Date(profile.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Personal Info */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                        Personal Info
                      </h4>
                      {profile.step1_personal ? (
                        <div className="text-sm space-y-2">
                          <p><span className="text-gray-600">DOB:</span> {profile.step1_personal.dateOfBirth}</p>
                          <p><span className="text-gray-600">Gender:</span> {profile.step1_personal.gender}</p>
                          <p><span className="text-gray-600">Phone:</span> {profile.step1_personal.phone}</p>
                          <p><span className="text-gray-600">City:</span> {profile.step1_personal.city}, {profile.step1_personal.state}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Not completed</p>
                      )}
                    </div>

                    {/* Bank Info */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                        Bank & Tax
                      </h4>
                      {profile.step2_bank ? (
                        <div className="text-sm space-y-2">
                          <p><span className="text-gray-600">Bank:</span> {profile.step2_bank.bankName}</p>
                          <p><span className="text-gray-600">A/C:</span> ****{profile.step2_bank.accountNumber?.slice(-4)}</p>
                          <p><span className="text-gray-600">PAN:</span> {profile.step2_bank.panNumber}</p>
                          <p><span className="text-gray-600">Aadhar:</span> ****-****-{profile.step2_bank.aadharNumber?.slice(-4)}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Not completed</p>
                      )}
                    </div>

                    {/* Documents */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">3</span>
                        Documents
                      </h4>
                      {profile.step3_documents ? (
                        <div className="text-sm space-y-1">
                          <p className={profile.step3_documents.photoUrl ? 'text-green-600' : 'text-gray-400'}>
                            {profile.step3_documents.photoUrl ? '✓' : '✗'} Photo
                          </p>
                          <p className={profile.step3_documents.aadharCardUrl ? 'text-green-600' : 'text-gray-400'}>
                            {profile.step3_documents.aadharCardUrl ? '✓' : '✗'} Aadhar
                          </p>
                          <p className={profile.step3_documents.panCardUrl ? 'text-green-600' : 'text-gray-400'}>
                            {profile.step3_documents.panCardUrl ? '✓' : '✗'} PAN
                          </p>
                          <p className={profile.step3_documents.educationCertificateUrl ? 'text-green-600' : 'text-gray-400'}>
                            {profile.step3_documents.educationCertificateUrl ? '✓' : '✗'} Education
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Not completed</p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => openReviewModal(profile, 'reject')}
                      className="px-6 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-medium transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => openReviewModal(profile, 'approve')}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {reviewAction === 'approve' ? 'Approve Profile' : 'Reject Profile'}
            </h3>
            
            <div className="mb-4">
              <p className="text-gray-700">
                Employee: <strong>{selectedProfile.user_name}</strong>
              </p>
              <p className="text-gray-600 text-sm">{selectedProfile.user_email}</p>
            </div>

            {reviewAction === 'approve' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  Are you sure you want to approve this employee's onboarding profile? 
                  This will activate their account and set profile completion to 100%.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="Please explain why you are rejecting this profile and what needs to be corrected..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The employee will see this message and can resubmit after making corrections.
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowReviewModal(false)}
                disabled={processing}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={processing || (reviewAction === 'reject' && !rejectionNotes.trim())}
                className={`px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center ${
                  reviewAction === 'approve'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {processing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  reviewAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
