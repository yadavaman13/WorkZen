import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Step1Personal from './Step1Personal';
import Step2Bank from './Step2Bank';
import Step3Documents from './Step3Documents';
import Step4Review from './Step4Review';

export default function OnboardingWizard() {
  const { token } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [candidateInfo, setCandidateInfo] = useState(null);

  useEffect(() => {
    validateToken();
    setupEventListeners();

    return () => {
      window.removeEventListener('nextStep', handleNextStep);
      window.removeEventListener('prevStep', handlePrevStep);
    };
  }, []);

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/onboarding/validate/${token}`);
      if (response.ok) {
        const data = await response.json();
        setCandidateInfo(data);
      } else {
        toast.error('Invalid or expired onboarding link');
      }
    } catch (error) {
      toast.error('Error validating link');
    } finally {
      setLoading(false);
    }
  };

  const setupEventListeners = () => {
    window.addEventListener('nextStep', handleNextStep);
    window.addEventListener('prevStep', handlePrevStep);
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (loading) {
    return <div className="text-center py-20">Loading...</div>;
  }

  if (!candidateInfo) {
    return <div className="text-center py-20 text-red-600">Invalid onboarding link</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome to WorkZen</h1>
          <p className="text-gray-600">Complete your onboarding in 4 simple steps</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map(step => (
              <div
                key={step}
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                  step === currentStep
                    ? 'bg-blue-600 text-white'
                    : step < currentStep
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-gray-600 mb-4">
            Step {currentStep} of 4
          </div>
        </div>

        {/* Candidate Info Card */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 text-center">
          <p className="text-gray-700">
            <span className="font-semibold">{candidateInfo.candidate_name}</span> joining as{' '}
            <span className="font-semibold">{candidateInfo.position}</span> in{' '}
            <span className="font-semibold">{candidateInfo.department}</span>
          </p>
        </div>

        {/* Step Content */}
        {currentStep === 1 && <Step1Personal />}
        {currentStep === 2 && <Step2Bank />}
        {currentStep === 3 && <Step3Documents />}
        {currentStep === 4 && <Step4Review token={token} />}
      </div>
    </div>
  );
}
