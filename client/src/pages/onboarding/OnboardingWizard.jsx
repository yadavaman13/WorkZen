import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Step1Personal from './Step1Personal';
import Step2Bank from './Step2Bank';
import Step3Documents from './Step3Documents';
import Step4Review from './Step4Review';

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    initializeOnboarding();
  }, []);

  const initializeOnboarding = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Get user data
      const userResponse = await axios.get('/api/user/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(userResponse.data.user);

      // Get or create onboarding profile
      try {
        const profileResponse = await axios.get('/api/onboarding/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(profileResponse.data.profile);
        setCurrentStep(profileResponse.data.profile.current_step || 1);
      } catch (error) {
        if (error.response?.status === 404) {
          // Create new profile
          const createResponse = await axios.post('/api/onboarding/create', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setProfile(createResponse.data.profile);
          setCurrentStep(1);
        }
      }
    } catch (error) {
      console.error('Error initializing onboarding:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async (stepData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/onboarding/update-step', {
        step: currentStep,
        data: stepData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error('Error saving step:', error);
      alert('Failed to save data. Please try again.');
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/onboarding/submit', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Profile submitted for HR approval! You will be notified once reviewed.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting for approval:', error);
      alert('Failed to submit. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">Failed to load user data</p>
          <button onClick={() => navigate('/login')} className="mt-4 text-blue-600">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // If profile is already approved, redirect to dashboard
  if (profile?.status === 'approved') {
    navigate('/dashboard');
    return null;
  }

  // If profile is pending approval, show waiting message
  if (profile?.status === 'pending_approval') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Pending Approval</h2>
          <p className="text-gray-600 mb-6">
            Your profile has been submitted and is awaiting HR review.
            You will be notified once it's approved.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // If profile was rejected, show rejection message
  if (profile?.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Profile Rejected</h2>
          <p className="text-gray-600 mb-4 text-center">
            Your profile was rejected by HR. Please review the feedback and resubmit.
          </p>
          {profile.rejection_notes && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="font-semibold text-red-800 mb-2">HR Feedback:</p>
              <p className="text-red-700 text-sm">{profile.rejection_notes}</p>
            </div>
          )}
          <button
            onClick={() => setProfile({ ...profile, status: 'in_progress' })}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            Update Profile
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { number: 1, title: 'Personal Info' },
    { number: 2, title: 'Bank Details' },
    { number: 3, title: 'Documents' },
    { number: 4, title: 'Review' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">Welcome {userData.name}! Please complete these steps to get started.</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {steps.map((step, index) => (
              <div key={step.number} className="flex-1 relative">
                {/* Line connector */}
                {index < steps.length - 1 && (
                  <div className={`absolute top-6 left-1/2 w-full h-1 ${
                    currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                  }`} style={{ zIndex: 0 }}></div>
                )}
                
                {/* Step circle */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                    currentStep === step.number
                      ? 'bg-purple-600 text-white shadow-lg scale-110'
                      : currentStep > step.number
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {currentStep > step.number ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  <p className={`mt-2 text-sm font-medium ${
                    currentStep === step.number ? 'text-purple-600' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Employee Info Card */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 text-center border-l-4 border-purple-600">
          <p className="text-gray-700">
            <span className="font-semibold text-lg">{userData.name}</span>
            <span className="mx-2">•</span>
            <span className="text-gray-600">{userData.email}</span>
            <span className="mx-2">•</span>
            <span className="font-semibold text-purple-600">{userData.employee_id}</span>
          </p>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {currentStep === 1 && (
            <Step1Personal
              initialData={profile?.step1_personal}
              onNext={handleNextStep}
            />
          )}
          {currentStep === 2 && (
            <Step2Bank
              initialData={profile?.step2_bank}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
            />
          )}
          {currentStep === 3 && (
            <Step3Documents
              initialData={profile?.step3_documents}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
            />
          )}
          {currentStep === 4 && (
            <Step4Review
              profile={profile}
              userData={userData}
              onPrev={handlePrevStep}
              onSubmit={handleSubmitForApproval}
            />
          )}
        </div>
      </div>
    </div>
  );
}
