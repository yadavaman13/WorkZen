import { useState } from "react";

export default function CreatePayrunModal({ 
  show, 
  onClose, 
  periods, 
  selectedPeriod, 
  onPeriodChange, 
  onCreate, 
  loading, 
  warnings 
}) {
  const [forceCreate, setForceCreate] = useState(false);

  if (!show) return null;

  const handleCreate = () => {
    onCreate(forceCreate);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create Payroll Run</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Period Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Payroll Period
            </label>
            <select
              value={selectedPeriod || ''}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A24689] focus:border-transparent"
            >
              <option value="">Choose a period...</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.period_name} ({new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}) - {period.status}
                </option>
              ))}
            </select>
          </div>

          {/* Warnings */}
          {warnings && warnings.length > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">
                    {warnings.length} Warning(s) Found
                  </h3>
                  <ul className="space-y-2">
                    {warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-yellow-700">
                        • {warning.message}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={forceCreate}
                        onChange={(e) => setForceCreate(e.target.checked)}
                        className="rounded border-gray-300 text-[#A24689] focus:ring-[#A24689]"
                      />
                      <span className="ml-2 text-sm text-yellow-800">
                        Force create payrun despite warnings
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
            <p className="text-sm text-blue-700">
              Creating a payroll run will generate draft payslips for all active employees in the selected period.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!selectedPeriod || loading || (warnings.length > 0 && !forceCreate)}
            className="px-6 py-2 bg-[#A24689] text-white rounded-lg hover:bg-[#8B3A74] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{loading ? "Creating..." : "Create Payrun"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
