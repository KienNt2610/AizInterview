import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, LogOut, User, Settings, Home, Video, BarChart3, CreditCard } from 'lucide-react';
import { authAPI } from '../../services/api';

const AppHeader = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Safely parse user from localStorage
  let user = { name: "User", email: "user@example.com" };
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      user = JSON.parse(userStr);
    }
  } catch (e) {
    console.error('Failed to parse user from localStorage:', e);
  }
  
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local storage anyway
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3, requiresAuth: true },
    { path: '/history', label: 'History', icon: BarChart3, requiresAuth: true },
    { path: '/payment', label: 'Pricing', icon: CreditCard, requiresAuth: true },
    { path: '/interview', label: 'Interview', icon: Video },
  ];

  const filteredNavItems = navItems.filter(item => !item.requiresAuth || isAuthenticated);

  return (
    <header className="sticky top-0 z-50 bg-[#0B0C10] border-b border-[#66FCF1]/20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#66FCF1] to-[#45A29E] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-[#66FCF1]/50 transition-all duration-300">
                <span className="text-[#0B0C10] font-bold text-lg">AI</span>
              </div>
              <h1 className="text-xl font-bold text-white hidden sm:block">Interview AI</h1>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#66FCF1]/20 text-[#66FCF1] border border-[#66FCF1]/30'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Side - User Menu or Auth Buttons */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-white/60">{user.email}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-[#66FCF1] to-[#45A29E] rounded-full flex items-center justify-center text-[#0B0C10] font-semibold shadow-lg">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-[#1F2833] rounded-xl shadow-2xl border border-[#66FCF1]/20 py-2 z-20 backdrop-blur-sm">

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/dashboard/settings');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5 flex items-center gap-3 transition-colors"
                      >
                        <User className="w-4 h-4 text-[#66FCF1]" />
                        Profile
                      </button>
                      <hr className="my-2 border-white/10" />
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#66FCF1] to-[#45A29E] text-[#0B0C10] rounded-lg hover:shadow-lg hover:shadow-[#66FCF1]/50 transition-all duration-300"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#1F2833] backdrop-blur-sm">
          <div className="px-4 py-4 space-y-2">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#66FCF1]/20 text-[#66FCF1] border border-[#66FCF1]/30'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
