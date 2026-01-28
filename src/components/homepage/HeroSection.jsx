import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';

const HeroSection = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    // Listen for auth changes
    const handleAuthChange = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B0C10] via-[#1F2833] to-[#0B0C10]">
        {/* Animated Glow Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#66FCF1]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#45A29E]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2366FCF1' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#66FCF1]/10 border border-[#66FCF1]/30 text-[#66FCF1] text-sm font-medium mb-8 glow-border">
          <Sparkles className="w-4 h-4" />
          <span>AI-Powered Interview Practice</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          <span className="text-glow">
            Aiz by Zenith
          </span>
        </h1>

        <p className="text-2xl sm:text-3xl text-[#66FCF1] mb-4 font-semibold">
          Your AI-powered interview companion
        </p>

        <p className="text-lg sm:text-xl text-[#C5C6C7] mb-4 font-medium">
          Practice smarter. Interview better.
        </p>

        <p className="text-base text-[#C5C6C7]/80 mb-12 max-w-2xl mx-auto">
          Master your next interview with personalized AI feedback and real-time performance insights. 
          Get ready to ace your dream job.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/interview')}
            className="px-8 py-6 text-lg group"
          >
            Get Started
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-8 py-6 text-lg"
          >
            View Pricing
          </Button>
          {!isLoggedIn && (
            <Button
              variant="ghost"
              size="lg"
              onClick={() => navigate('/login')}
              className="px-8 py-6 text-lg"
            >
              Log In
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="glass rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="text-3xl font-bold text-[#66FCF1] mb-2 text-glow">10K+</div>
            <div className="text-[#C5C6C7]">Interviews Completed</div>
          </div>
          <div className="glass rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="text-3xl font-bold text-[#66FCF1] mb-2 text-glow">98%</div>
            <div className="text-[#C5C6C7]">User Satisfaction</div>
          </div>
          <div className="glass rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="text-3xl font-bold text-[#66FCF1] mb-2 text-glow">4.9/5</div>
            <div className="text-[#C5C6C7]">Average Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
