import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { useEffect } from 'react';

function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center  px-4">
      <div className="text-center w-full animate-fade-in">
        {/* Logo Text */}
        <h1 
          className="text-7xl md:text-8xl font-bold mb-8 animate-slide-down"
          style={{ 
            color: '#A24689'
          }}
        >
          WorkZen
        </h1>

        {/* Subtitle */}
        <h1 className="text-3xl md:text-5xl font-semibold text-gray-800 mb-6 leading-tight">
          Simplify HR operations with intelligence.
        </h1>
        
        {/* Description */}
        <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed">
          Leave approvals, attendance & payroll — all in harmony.
        </p>
        
        {/* Get Started Button */}
        <button 
          onClick={handleGetStarted}
          style={{ 
            backgroundColor: '#A24689'
          }}
          className="hover:bg-opacity-80 text-white font-semibold text-lg px-12 py-4 rounded-full shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 ease-in-out"
        >
          Get Started
        </button>
        
        {/* Tagline */}
        <p className="mt-8 text-base text-gray-500 font-medium">
          Smart HR · Calm Decisions
        </p>
      </div>
    </div>
  );
}

export default LandingPage;
