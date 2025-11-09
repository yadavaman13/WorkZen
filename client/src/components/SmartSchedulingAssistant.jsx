import { useState, useEffect } from 'react';
import axios from 'axios';

export default function SmartSchedulingAssistant({ formData, onApplySuggestion }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAssistant, setShowAssistant] = useState(false);

  useEffect(() => {
    if (formData.fromDate && formData.toDate && formData.leaveType) {
      analyzeDates();
    } else {
      setSuggestions(null);
      setShowAssistant(false);
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
        headers: { Authorization: Bearer +token }
      });

      if (response.data.success) {
        setSuggestions(response.data.data);
        setShowAssistant(true);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError(err.response?.data?.message || 'Failed to analyze dates');
      setSuggestions(null);
      setShowAssistant(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUseAlternative = (alternative) => {
    onApplySuggestion({
      fromDate: alternative.fromDate,
      toDate: alternative.toDate
    });
    setShowAssistant(false);
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

  if (!suggestions || !showAssistant) {
    return null;
  }

  const { analysis, conflicts, recommendations, alternativeDates } = suggestions;

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
    <div className='mt-4 space-y-4'>
      <div className='bg-white border-2 border-purple-600 rounded-lg p-4 shadow-sm'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='font-bold text-lg text-gray-900'>Smart Scheduling Analysis</h3>
            <p className='text-sm text-gray-600'>AI-powered leave request insights</p>
          </div>
          <button onClick={() => setShowAssistant(false)} className='text-gray-400 hover:text-gray-600 text-xl font-bold'></button>
        </div>
      </div>

      <div className='bg-white border border-gray-200 rounded-lg p-5 shadow-sm'>
        <h4 className='font-semibold text-gray-900 mb-4 text-base'>Approval Analysis</h4>
        
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='text-center p-3 bg-gray-50 rounded-lg'>
            <p className='text-xs text-gray-600 mb-1'>Approval Chance</p>
            <p className={'text-2xl font-bold '+getApprovalColor(analysis.approvalProbability)}>{analysis.approvalProbability}%</p>
          </div>
          
          <div className='text-center p-3 bg-gray-50 rounded-lg'>
            <p className='text-xs text-gray-600 mb-1'>Risk Level</p>
            <span className={'inline-block px-3 py-1 rounded-full text-sm font-semibold border '+getRiskColor(analysis.riskLevel)}>{analysis.riskLevel}</span>
          </div>
          
          <div className='text-center p-3 bg-gray-50 rounded-lg'>
            <p className='text-xs text-gray-600 mb-1'>Team Coverage</p>
            <p className='text-2xl font-bold text-gray-900'>{analysis.teamCoverage}%</p>
          </div>
          
          <div className='text-center p-3 bg-gray-50 rounded-lg'>
            <p className='text-xs text-gray-600 mb-1'>Conflicts</p>
            <p className='text-2xl font-bold text-gray-900'>{analysis.peopleOnLeave}</p>
          </div>
        </div>
      </div>

      {conflicts && conflicts.length > 0 && (
        <div className='bg-white border border-yellow-200 rounded-lg p-5 shadow-sm'>
          <h4 className='font-semibold text-gray-900 mb-3 text-base'>Team Members On Leave</h4>
          <div className='space-y-2'>
            {conflicts.map((conflict, index) => (
              <div key={index} className='flex items-center justify-between p-3 bg-yellow-50 rounded border-l-4 border-yellow-400'>
                <div className='flex-1'>
                  <p className='font-medium text-gray-900'>{conflict.employee}</p>
                  <p className='text-sm text-gray-600'>{conflict.role}</p>
                </div>
                <div className='text-right'>
                  <p className='text-sm text-gray-700'>{new Date(conflict.from).toLocaleDateString()} - {new Date(conflict.to).toLocaleDateString()}</p>
                  <p className='text-xs text-gray-500'>{conflict.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendations && recommendations.length > 0 && (
        <div className='bg-white border border-blue-200 rounded-lg p-5 shadow-sm'>
          <h4 className='font-semibold text-gray-900 mb-3 text-base'>Recommendations</h4>
          <ul className='space-y-2'>
            {recommendations.map((rec, index) => (
              <li key={index} className='flex items-start gap-3 p-3 bg-blue-50 rounded'>
                <span className={'inline-block w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 '+(rec.priority === 'high' ? 'bg-red-600' : rec.priority === 'medium' ? 'bg-yellow-600' : 'bg-blue-600')}>{index + 1}</span>
                <p className='text-sm text-gray-700 flex-1'>{rec.text}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {alternativeDates && alternativeDates.length > 0 && (
        <div className='bg-white border border-green-200 rounded-lg p-5 shadow-sm'>
          <h4 className='font-semibold text-gray-900 mb-3 text-base'>Suggested Alternative Dates</h4>
          <div className='space-y-3'>
            {alternativeDates.map((alt, index) => (
              <div key={index} className='flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200'>
                <div className='flex-1'>
                  <div className='flex items-center gap-4 mb-2'>
                    <span className='text-sm font-medium text-gray-700'>{new Date(alt.fromDate).toLocaleDateString()} - {new Date(alt.toDate).toLocaleDateString()}</span>
                    <span className='text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium'>{alt.days} days</span>
                  </div>
                  <p className='text-sm text-gray-600'>{alt.reason}</p>
                  <div className='flex items-center gap-4 mt-2'>
                    <span className='text-xs text-gray-500'>Conflicts: <span className='font-semibold text-gray-700'>{alt.conflicts}</span></span>
                    <span className='text-xs text-gray-500'>Approval Chance: <span className={'font-semibold '+getApprovalColor(alt.approvalChance)}>{alt.approvalChance}%</span></span>
                  </div>
                </div>
                <button onClick={() => handleUseAlternative(alt)} className='ml-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium'>Use These Dates</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.criticalRolesAffected > 0 && (
        <div className='bg-red-50 border border-red-300 rounded-lg p-4'>
          <p className='text-sm text-red-800 font-medium'>Warning: {analysis.criticalRolesAffected} critical role(s) will be affected during this period</p>
        </div>
      )}
    </div>
  );
}
