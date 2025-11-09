import { useState, useEffect } from 'react';
import { onboardingAPI } from '../services/api';

function OnboardingManagement() {
  const [activeTab, setActiveTab] = useState('invite');
  const [loading, setLoading] = useState(false);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [inviteForm, setInviteForm] = useState({
    candidate_email: '',
    candidate_name: '',
    department: '',
    position: '',
    joining_date: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedOnboarding, setSelectedOnboarding] = useState(null);
  const [reviewAction, setReviewAction] = useState({ comments: '', reason: '' });

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchPendingReviews();
    }
  }, [activeTab]);

  const fetchPendingReviews = async () => {
    try {
      setLoading(true);
      const response = await onboardingAPI.getPendingReviews();
      setPendingReviews(response.data.onboardings || []);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to fetch pending reviews' });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const response = await onboardingAPI.createInvite(inviteForm);
      
      setMessage({ 
        type: 'success', 
        text: `Onboarding invite sent to ${inviteForm.candidate_email} successfully!` 
      });

      // Reset form
      setInviteForm({
        candidate_email: '',
        candidate_name: '',
        department: '',
        position: '',
        joining_date: ''
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to send invite' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (onboardingId) => {
    if (!window.confirm('Are you sure you want to approve this onboarding? An employee account will be created and credentials will be sent via email.')) return;

    try {
      setLoading(true);
      const response = await onboardingAPI.approveOnboarding(onboardingId);
      
      setMessage({ 
        type: 'success', 
        text: `Onboarding approved! Employee ID ${response.data.employee_id} created and credentials sent via email.` 
      });
      
      fetchPendingReviews();
      setSelectedOnboarding(null);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to approve onboarding' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestChanges = async (onboardingId) => {
    if (!reviewAction.comments) {
      setMessage({ type: 'error', text: 'Please enter comments for changes' });
      return;
    }

    try {
      setLoading(true);
      await onboardingAPI.requestChanges(onboardingId, { 
        comments: reviewAction.comments,
        fields_to_change: []
      });
      setMessage({ type: 'success', text: 'Change request sent successfully!' });
      fetchPendingReviews();
      setSelectedOnboarding(null);
      setReviewAction({ comments: '', reason: '' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to request changes' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (onboardingId) => {
    if (!reviewAction.reason) {
      setMessage({ type: 'error', text: 'Please enter a reason for rejection' });
      return;
    }

    if (!window.confirm('Are you sure you want to reject this onboarding?')) return;

    try {
      setLoading(true);
      await onboardingAPI.rejectOnboarding(onboardingId, { reason: reviewAction.reason });
      setMessage({ type: 'success', text: 'Onboarding rejected' });
      fetchPendingReviews();
      setSelectedOnboarding(null);
      setReviewAction({ comments: '', reason: '' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to reject onboarding' 
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const badges = {
      invited: 'bg-blue-100 text-blue-800',
      step1_completed: 'bg-purple-100 text-purple-800',
      step2_completed: 'bg-purple-100 text-purple-800',
      step3_completed: 'bg-purple-100 text-purple-800',
      pending_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      changes_requested: 'bg-orange-100 text-orange-800',
      revision_required: 'bg-orange-100 text-orange-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace(/_/g, ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Employee Onboarding</h2>
        <p className="text-gray-600 mt-1">Manage candidate invitations and review onboarding submissions</p>
      </div>

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

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-6">
        <button
          onClick={() => setActiveTab('invite')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'invite'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          Send Invite
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 px-4 font-medium transition-colors relative ${
            activeTab === 'reviews'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          Pending Reviews
          {pendingReviews.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {pendingReviews.length}
            </span>
          )}
        </button>
      </div>

      {/* Invite Tab */}
      {activeTab === 'invite' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Invite New Candidate</h3>
          <form onSubmit={handleInviteSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Candidate Email *
                </label>
                <input
                  type="email"
                  value={inviteForm.candidate_email}
                  onChange={(e) => setInviteForm({ ...inviteForm, candidate_email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Candidate Name *
                </label>
                <input
                  type="text"
                  value={inviteForm.candidate_name}
                  onChange={(e) => setInviteForm({ ...inviteForm, candidate_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  value={inviteForm.department}
                  onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Department</option>
                  <option value="Engineering">Engineering</option>
                  <option value="HR">Human Resources</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position *
                </label>
                <input
                  type="text"
                  value={inviteForm.position}
                  onChange={(e) => setInviteForm({ ...inviteForm, position: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Joining Date *
                </label>
                <input
                  type="date"
                  value={inviteForm.joining_date}
                  onChange={(e) => setInviteForm({ ...inviteForm, joining_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {loading ? 'Sending Invite...' : 'Send Onboarding Invite'}
            </button>
          </form>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {loading && !selectedOnboarding ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading pending reviews...</p>
            </div>
          ) : pendingReviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Pending Reviews</h3>
              <p className="text-gray-600">All onboarding submissions have been reviewed</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingReviews.map((onboarding) => (
                <div key={onboarding.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{onboarding.candidate_name}</h3>
                      <p className="text-gray-600">{onboarding.candidate_email}</p>
                    </div>
                    {getStatusBadge(onboarding.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Department</p>
                      <p className="font-semibold">{onboarding.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Position</p>
                      <p className="font-semibold">{onboarding.position}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Joining Date</p>
                      <p className="font-semibold">{formatDate(onboarding.joining_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Submitted</p>
                      <p className="font-semibold">{formatDate(onboarding.submitted_at)}</p>
                    </div>
                  </div>

                  {selectedOnboarding?.id === onboarding.id ? (
                    <div className="border-t pt-4 mt-4">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Comments / Changes Required
                          </label>
                          <textarea
                            value={reviewAction.comments}
                            onChange={(e) => setReviewAction({ ...reviewAction, comments: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows="3"
                            placeholder="Enter your comments or requested changes..."
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApprove(onboarding.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleRequestChanges(onboarding.id)}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                          >
                            📝 Request Changes
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOnboarding(null);
                              setReviewAction({ comments: '', reason: '' });
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedOnboarding(onboarding)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Review
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OnboardingManagement;
