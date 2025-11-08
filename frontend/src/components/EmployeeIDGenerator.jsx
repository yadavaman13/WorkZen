import React, { useState } from 'react';
import { employeesAPI } from '../services/api.js';

const EmployeeIDGenerator = () => {
  const [generatedIds, setGeneratedIds] = useState([]);
  const [companyCode, setCompanyCode] = useState('OI');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const generateId = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await employeesAPI.generateEmployeeId({ company_code: companyCode });

      const newId = {
        id: response.data.employee_id,
        generatedAt: response.data.generated_at,
        format: response.data.format
      };

      setGeneratedIds([newId, ...generatedIds]);
      setSuccess(`✓ Generated ID: ${response.data.employee_id}`);

      // Auto-clear success message
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate ID');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (id) => {
    navigator.clipboard.writeText(id);
    alert('Copied to clipboard: ' + id);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Employee ID Generator</h2>

      {/* Generation Controls */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Code
            </label>
            <input
              type="text"
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value.toUpperCase().slice(0, 2))}
              maxLength="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="OI"
            />
            <p className="text-xs text-gray-600 mt-1">2-letter code (e.g., OI for Org India)</p>
          </div>
          <button
            onClick={generateId}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading ? 'Generating...' : 'Generate ID'}
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            {success}
          </div>
        )}
      </div>

      {/* ID Format Information */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-700 mb-2">ID Format:</h3>
        <p className="text-sm text-gray-600 mb-2">
          <code className="bg-white px-2 py-1 rounded border">[CompanyCode][YYYY][Serial]</code>
        </p>
        <p className="text-sm text-gray-600">
          <strong>Example:</strong> OI2025<span className="text-blue-600">0001</span> (First employee of 2025)
        </p>
      </div>

      {/* Generated IDs Table */}
      {generatedIds.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Generated IDs ({generatedIds.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
                    Employee ID
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
                    Generated At
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {generatedIds.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-mono text-blue-600 font-semibold">
                      {item.id}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                      {new Date(item.generatedAt).toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <button
                        onClick={() => copyToClipboard(item.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm transition"
                      >
                        Copy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {generatedIds.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No IDs generated yet. Click "Generate ID" to create one.</p>
        </div>
      )}
    </div>
  );
};

export default EmployeeIDGenerator;
