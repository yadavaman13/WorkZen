import { useState, useEffect } from 'react';
import axios from 'axios';

export default function SmartSchedulingAssistant({
  startDate,
  endDate,
  employeeId,
  requestType,
}) {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (formData.fromDate && formData.toDate && formData.leaveType) {
      analyzeDates();
    } else {
      setPredictions(null);
    }
  }, [formData.fromDate, formData.toDate, formData.leaveType]);

  const analyzeDates = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:5000/api/timeoff/smart-suggestions', {
        params: {
          fromDate: formData.fromDate,
          toDate: formData.toDate,
          leaveType: formData.leaveType
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPredictions(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setError(err.response?.data?.message || 'Failed to analyze dates');
      setPredictions(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUseAlternative = (alternative) => {
    onApplySuggestion({
      fromDate: alternative.fromDate,
      toDate: alternative.toDate
    });
  };

  if (!formData.fromDate || !formData.toDate) {
    return null;
  }

  if (loading) {
    return (
      <div className='bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4'>
        <div className='flex items-center gap-3'>
          <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600'></div>
          <span className='text-purple-700 font-medium'>Analyzing leave request...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-4 mt-4'>
        <p className='text-red-700 text-sm'>{error}</p>
      </div>
    );
  }

  if (!predictions) {
    return null;
  }

  const { analysis, conflicts, alternativeDates } = predictions;

  const getRiskColor = (level) => {
    switch (level) {
      case 'Low': return 'text-green-700 bg-green-50 border-green-300';
      case 'Medium': return 'text-yellow-700 bg-yellow-50 border-yellow-300';
      case 'High': return 'text-red-700 bg-red-50 border-red-300';
      default: return 'text-gray-700 bg-gray-50 border-gray-300';
    }
  };

  const getApprovalColor = (probability) => {
    if (probability >= 80) return 'text-green-700';
    if (probability >= 60) return 'text-yellow-700';
    return 'text-red-700';
  };

  return (
    <div className='mt-4 space-y-3'>
      {/* Approval Prediction Card */}
      <div className='bg-white border border-gray-200 rounded-lg p-4 shadow-sm'>
        <h4 className='font-semibold text-gray-900 mb-3 text-base'>Leave Approval Prediction</h4>
        
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          <div className='text-center p-3 bg-gray-50 rounded-lg border border-gray-200'>
            <p className='text-xs text-gray-600 mb-1'>Approval Chance</p>
            <p className={'text-2xl font-bold '+getApprovalColor(analysis.approvalProbability)}>{analysis.approvalProbability}%</p>
          </div>
          
          <div className='text-center p-3 bg-gray-50 rounded-lg border border-gray-200'>
            <p className='text-xs text-gray-600 mb-1'>Risk Level</p>
            <span className={'inline-block px-3 py-1 rounded-full text-sm font-semibold border '+getRiskColor(analysis.riskLevel)}>{analysis.riskLevel}</span>
          </div>
          
          <div className='text-center p-3 bg-gray-50 rounded-lg border border-gray-200'>
            <p className='text-xs text-gray-600 mb-1'>Team Coverage</p>
            <p className='text-2xl font-bold text-gray-900'>{analysis.teamCoverage}%</p>
          </div>
          
          <div className='text-center p-3 bg-gray-50 rounded-lg border border-gray-200'>
            <p className='text-xs text-gray-600 mb-1'>Team Conflicts</p>
            <p className='text-2xl font-bold text-gray-900'>{analysis.peopleOnLeave}</p>
          </div>
        </div>
      </div>

      {conflicts && conflicts.length > 0 && (
        <div className='bg-white border border-gray-200 rounded-lg p-4 shadow-sm'>
          <h4 className='font-semibold text-gray-900 mb-3 text-sm'>Team Members On Leave During This Period</h4>
          <div className='space-y-2'>
            {conflicts.map((conflict, index) => (
              <div key={index} className='flex items-center justify-between p-2 bg-gray-50 rounded border-l-3 border-gray-300'>
                <div className='flex-1'>
                  <p className='font-medium text-gray-900 text-sm'>{conflict.employee}</p>
                  <p className='text-xs text-gray-600'>{conflict.role}</p>
                </div>
                <div className='text-right'>
                  <p className='text-xs text-gray-700'>{new Date(conflict.from).toLocaleDateString()} - {new Date(conflict.to).toLocaleDateString()}</p>
                  <p className='text-xs text-gray-500'>{conflict.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {alternativeDates && alternativeDates.length > 0 && (
        <div className='bg-white border border-gray-200 rounded-lg p-4 shadow-sm'>
          <h4 className='font-semibold text-gray-900 mb-3 text-sm'>Suggested Alternative Dates</h4>
          <div className='space-y-2'>
            {alternativeDates.map((alt, index) => (
              <div key={index} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-1'>
                    <span className='text-sm font-medium text-gray-900'>{new Date(alt.fromDate).toLocaleDateString()} - {new Date(alt.toDate).toLocaleDateString()}</span>
                    <span className='text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium'>{alt.days} days</span>
                  </div>
                  <p className='text-xs text-gray-600 mb-1'>{alt.reason}</p>
                  <div className='flex items-center gap-3'>
                    <span className='text-xs text-gray-500'>Conflicts: <span className='font-semibold text-gray-700'>{alt.conflicts}</span></span>
                    <span className='text-xs text-gray-500'>Approval: <span className={'font-semibold '+getApprovalColor(alt.approvalChance)}>{alt.approvalChance}%</span></span>
                  </div>
                </div>
                <button onClick={() => handleUseAlternative(alt)} className='ml-3 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium'>Apply</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.criticalRolesAffected > 0 && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
          <p className='text-xs text-red-800 font-medium'>⚠ {analysis.criticalRolesAffected} critical role(s) will be affected during this period</p>
        </div>
      )}
    </div>
  );
}
