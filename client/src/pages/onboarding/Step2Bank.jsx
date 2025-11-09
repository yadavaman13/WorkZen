import { useState } from 'react';

export default function Step2Bank({ initialData, onNext, onPrev }) {
  const [formData, setFormData] = useState(initialData || {
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
    accountType: 'savings',
    panNumber: '',
    aadharNumber: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.accountHolderName) newErrors.accountHolderName = 'Account holder name is required';
    if (!formData.bankName) newErrors.bankName = 'Bank name is required';
    if (!formData.accountNumber) newErrors.accountNumber = 'Account number is required';
    if (!formData.ifscCode) newErrors.ifscCode = 'IFSC code is required';
    if (!formData.panNumber || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
      newErrors.panNumber = 'Valid PAN number is required (e.g., ABCDE1234F)';
    }
    if (!formData.aadharNumber || !/^\d{12}$/.test(formData.aadharNumber.replace(/\s/g, ''))) {
      newErrors.aadharNumber = 'Valid 12-digit Aadhar number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onNext(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Bank & Tax Details</h2>
      
      {/* Bank Account Details */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Bank Account Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Holder Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="accountHolderName"
              value={formData.accountHolderName}
              onChange={handleChange}
              placeholder="As per bank records"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.accountHolderName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.accountHolderName && <p className="text-red-500 text-sm mt-1">{errors.accountHolderName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
              placeholder="e.g., HDFC Bank, SBI"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.bankName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.bankName && <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.accountNumber ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.accountNumber && <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IFSC Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="ifscCode"
              value={formData.ifscCode}
              onChange={handleChange}
              placeholder="e.g., SBIN0001234"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase ${
                errors.ifscCode ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.ifscCode && <p className="text-red-500 text-sm mt-1">{errors.ifscCode}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
            <input
              type="text"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              placeholder="Branch name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
            <select
              name="accountType"
              value={formData.accountType}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="savings">Savings</option>
              <option value="current">Current</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tax Information */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Tax Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PAN Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="panNumber"
              value={formData.panNumber}
              onChange={handleChange}
              placeholder="ABCDE1234F"
              maxLength={10}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase ${
                errors.panNumber ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.panNumber && <p className="text-red-500 text-sm mt-1">{errors.panNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aadhar Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="aadharNumber"
              value={formData.aadharNumber}
              onChange={handleChange}
              placeholder="1234 5678 9012"
              maxLength={14}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.aadharNumber ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.aadharNumber && <p className="text-red-500 text-sm mt-1">{errors.aadharNumber}</p>}
          </div>
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Your PAN and Aadhar details are required for tax compliance and salary processing.
            All information is encrypted and stored securely.
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
        >
          ← Previous
        </button>
        <button
          type="submit"
          className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
        >
          Next Step →
        </button>
      </div>
    </form>
  );
}
