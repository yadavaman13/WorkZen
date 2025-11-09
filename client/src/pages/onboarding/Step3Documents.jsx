import { useState } from 'react';

export default function Step3Documents({ initialData, onNext, onPrev }) {
  const [formData, setFormData] = useState(initialData || {
    photoUrl: '',
    aadharCardUrl: '',
    panCardUrl: '',
    educationCertificateUrl: '',
    experienceCertificateUrl: '',
    additionalDocs: []
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Document Upload</h2>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> For now, please provide document URLs or upload links. 
          You can email documents to HR or upload to a shared drive and paste the link here.
        </p>
      </div>

      <div className="space-y-6">
        {/* Photo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Passport Size Photo
          </label>
          <input
            type="text"
            name="photoUrl"
            value={formData.photoUrl}
            onChange={handleChange}
            placeholder="URL or shared drive link"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">JPEG/PNG format, recent photo</p>
        </div>

        {/* Aadhar Card */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Aadhar Card
          </label>
          <input
            type="text"
            name="aadharCardUrl"
            value={formData.aadharCardUrl}
            onChange={handleChange}
            placeholder="URL or shared drive link"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Both sides of Aadhar card</p>
        </div>

        {/* PAN Card */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PAN Card
          </label>
          <input
            type="text"
            name="panCardUrl"
            value={formData.panCardUrl}
            onChange={handleChange}
            placeholder="URL or shared drive link"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Education Certificate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Education Certificate
          </label>
          <input
            type="text"
            name="educationCertificateUrl"
            value={formData.educationCertificateUrl}
            onChange={handleChange}
            placeholder="URL or shared drive link"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Highest qualification certificate</p>
        </div>

        {/* Experience Certificate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Experience Certificate (if applicable)
          </label>
          <input
            type="text"
            name="experienceCertificateUrl"
            value={formData.experienceCertificateUrl}
            onChange={handleChange}
            placeholder="URL or shared drive link"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Previous employment certificate</p>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> You can also send documents directly to hr@workzen.io and mention your Employee ID in the subject.
        </p>
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
