import { useState, useEffect } from "react";
import axios from "../api/axios";

export default function SmartSchedulingAssistant({ formData, onApplySuggestion }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAssistant, setShowAssistant] = useState(false);

  // Auto-analyze when dates change
  useEffect(() => {
    if (formData.fromDate && formData.toDate && formData.leaveType) {
      analyzeDates();
    } else {
      setSuggestions(null);
    }
  }, [formData.fromDate, formData.toDate, formData.leaveType]);

  const analyzeDates = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      const response = await axios.get("/api/timeoff/smart-suggestions", {
        params: {
          fromDate: formData.fromDate,
          toDate: formData.toDate,
          leaveType: formData.leaveType
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuggestions(response.data.data);
        setShowAssistant(true);
      }
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setError("Failed to analyze dates");
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
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mt-4">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
          <span className="text-purple-700 font-medium">🤖 AI analyzing your dates...</span>
        </div>
      </div>
    );
  }

  if (!suggestions || !showAssistant) {
    return null;
  }

  const { analysis, conflicts, recommendations, alternativeDates, historicalInsight } = suggestions;

  const getRiskColor = (level) => {
    switch (level) {
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getApprovalColor = (probability) => {
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="mt-4 space-y-4">
      {/* AI Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🤖</div>
            <div>
              <h3 className="font-bold text-lg">AI Scheduling Assistant</h3>
              <p className="text-sm text-purple-100">Smart analysis of your leave request</p>
            </div>
          </div>
          <button
            onClick={() => setShowAssistant(false)}
            className="text-white hover:text-purple-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`border rounded-lg p-3 ${getRiskColor(analysis.riskLevel)}`}>
          <div className="text-xs font-medium opacity-75 mb-1">Approval Probability</div>
          <div className={`text-2xl font-bold ${getApprovalColor(analysis.approvalProbability)}`}>
            {analysis.approvalProbability}%
          </div>
        </div>
        <div className={`border rounded-lg p-3 ${getRiskColor(analysis.riskLevel)}`}>
          <div className="text-xs font-medium opacity-75 mb-1">Risk Level</div>
          <div className="text-2xl font-bold">{analysis.riskLevel}</div>
        </div>
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
          <div className="text-xs font-medium text-blue-600 opacity-75 mb-1">Team Coverage</div>
          <div className="text-2xl font-bold text-blue-600">{analysis.teamCoverage}%</div>
        </div>
        <div className="border border-purple-200 bg-purple-50 rounded-lg p-3">
          <div className="text-xs font-medium text-purple-600 opacity-75 mb-1">Team on Leave</div>
          <div className="text-2xl font-bold text-purple-600">{analysis.peopleOnLeave}</div>
        </div>
      </div>

      {/* Smart Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span>
            Smart Recommendations
          </h4>
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  rec.type === 'success' ? 'bg-green-50 border border-green-200' :
                  rec.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                  rec.type === 'danger' ? 'bg-red-50 border border-red-200' :
                  'bg-blue-50 border border-blue-200'
                }`}
              >
                <span className="text-xl flex-shrink-0">{rec.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    rec.type === 'success' ? 'text-green-800' :
                    rec.type === 'warning' ? 'text-yellow-800' :
                    rec.type === 'danger' ? 'text-red-800' :
                    'text-blue-800'
                  }`}>
                    {rec.message}
                  </p>
                  {rec.priority === 'critical' && (
                    <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 bg-red-600 text-white rounded">
                      CRITICAL
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Conflicts */}
      {conflicts.length > 0 && (
        <div className="bg-white border border-orange-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            Team Members on Leave ({conflicts.length})
          </h4>
          <div className="space-y-2">
            {conflicts.map((conflict, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center text-sm font-bold text-orange-700">
                    {conflict.employee.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{conflict.employee}</p>
                    <p className="text-xs text-gray-600">{conflict.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">
                    {new Date(conflict.from).toLocaleDateString()} - {new Date(conflict.to).toLocaleDateString()}
                  </p>
                  <p className="text-xs font-medium text-orange-600">{conflict.type}</p>
                  {conflict.isCritical && (
                    <span className="inline-block text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded mt-1">
                      Critical Role
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternative Dates */}
      {alternativeDates.length > 0 && analysis.approvalProbability < 70 && (
        <div className="bg-white border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-xl">📅</span>
            Better Alternative Dates
          </h4>
          <div className="space-y-2">
            {alternativeDates.map((alt, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  alt.recommended 
                    ? 'bg-green-50 border-green-300 border-2' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">
                        {new Date(alt.fromDate).toLocaleDateString()} - {new Date(alt.toDate).toLocaleDateString()}
                      </p>
                      {alt.recommended && (
                        <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded font-medium">
                          ⭐ BEST CHOICE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{alt.reason}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${alt.score}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold text-green-600">{alt.score}% optimal</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUseAlternative(alt)}
                    className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Use These Dates
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historical Insight */}
      {historicalInsight.totalRequests > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="text-xl">📊</span>
            Your Leave History
          </h4>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-600">{historicalInsight.yourApprovalRate}%</p>
              <p className="text-xs text-gray-600">Overall Approval</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{historicalInsight.typeApprovalRate}%</p>
              <p className="text-xs text-gray-600">{formData.leaveType} Approval</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-pink-600">{historicalInsight.totalRequests}</p>
              <p className="text-xs text-gray-600">Total Requests</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
