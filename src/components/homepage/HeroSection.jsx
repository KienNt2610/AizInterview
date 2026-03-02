import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import { useUserPlan } from '../../hooks/useUserPlan';

const HeroSection = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { plan, interviewCount, getRemainingInterviews } = useUserPlan();

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
          <span>Luyện tập phỏng vấn được hỗ trợ bởi AI</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          <span className="text-glow">
            Aiz by Zenith
          </span>
        </h1>

        <p className="text-2xl sm:text-3xl text-[#66FCF1] mb-4 font-semibold">
          Người bạn đồng hành phỏng vấn được hỗ trợ bởi AI của bạn
        </p>

        <p className="text-lg sm:text-xl text-[#C5C6C7] mb-4 font-medium">
          Luyện tập thông minh hơn. Phỏng vấn tốt hơn.
        </p>

        <p className="text-base text-[#C5C6C7]/80 mb-6 max-w-2xl mx-auto">
          Làm chủ cuộc phỏng vấn tiếp theo của bạn với phản hồi AI được cá nhân hóa và thông tin hiệu suất theo thời gian thực. 
          Sẵn sàng để đạt được công việc mơ ước của bạn.
        </p>

        {/* Plan Status */}
        {isLoggedIn && (
          <div className="mb-12">
            {plan === "FREE" ? (
              <p className="text-lg text-[#66FCF1] font-medium">
                Bạn còn {getRemainingInterviews()}/1 lượt phỏng vấn miễn phí.
              </p>
            ) : (
              <p className="text-lg text-[#66FCF1] font-medium">
                PRO — phỏng vấn không giới hạn
              </p>
            )}
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/interview')}
            className="px-8 py-6 text-lg group"
          >
            Bắt đầu
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
            Xem giá
          </Button>
          {!isLoggedIn && (
            <Button
              variant="ghost"
              size="lg"
              onClick={() => navigate('/login')}
              className="px-8 py-6 text-lg"
            >
              Đăng nhập
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="glass rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="text-3xl font-bold text-[#66FCF1] mb-2 text-glow">10K+</div>
            <div className="text-[#C5C6C7]">Phỏng vấn đã hoàn thành</div>
          </div>
          <div className="glass rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="text-3xl font-bold text-[#66FCF1] mb-2 text-glow">98%</div>
            <div className="text-[#C5C6C7]">Sự hài lòng của người dùng</div>
          </div>
          <div className="glass rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="text-3xl font-bold text-[#66FCF1] mb-2 text-glow">4.9/5</div>
            <div className="text-[#C5C6C7]">Đánh giá trung bình</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
