import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function OnboardingReviewDashboard() {
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/onboarding/reviews/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPendingReviews(data.onboardings);
    } catch (error) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (onboardingId, action) => {
    if (action === 'approve' || action === 'reject') {
      setSelectedId(onboardingId);
      setActionType(action);
    }
  };

  const confirmAction = async () => {
    const token = localStorage.getItem('token');
    const endpoint = actionType === 'approve'
      ? `/api/onboarding/approve/${selectedId}`
      : `/api/onboarding/reject/${selectedId}`;

    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes, reason: notes })
      });

      if (response.ok) {
        toast.success(`Onboarding ${actionType}ed successfully`);
        fetchPendingReviews();
        setSelectedId(null);
        setActionType(null);
        setNotes('');
      }
    } catch (error) {
      toast.error(`Failed to ${actionType} onboarding`);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Onboarding Review Dashboard</h1>
      <p className="text-gray-600 mb-6">Pending Onboardings: {pendingReviews.length}</p>

      <div className="grid gap-4">
        {pendingReviews.map(review => (
          <div key={review.id} className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold">{review.candidate_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{review.candidate_email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Position</p>
                <p className="font-semibold">{review.position}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Submitted</p>
                <p className="font-semibold">{new Date(review.submitted_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">Attached Documents:</h3>
              <div className="flex gap-2 flex-wrap">
                {review.documents && review.documents.map(doc => (
                  <span key={doc.id} className="bg-gray-100 px-3 py-1 rounded text-sm">
                    {doc.doc_type}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleAction(review.id, 'approve')}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                ✓ Approve
              </button>
              <button
                onClick={() => handleAction(review.id, 'reject')}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                ✗ Reject
              </button>
              <button
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                📝 Request Changes
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Action Modal */}
      {selectedId && actionType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {actionType === 'approve' ? 'Approve' : 'Reject'} Onboarding
            </h3>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes or reason..."
              className="w-full border border-gray-300 rounded p-3 mb-4"
              rows="4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setActionType(null)}
                className="flex-1 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`flex-1 px-4 py-2 text-white rounded ${
                  actionType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
