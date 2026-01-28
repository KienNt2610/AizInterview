import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Zap, User, Settings, LogOut, LayoutDashboard, History } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from '../ui/Button';
import { authAPI } from '../../services/api';
import { useToast } from '../ui/Toast';

const Dashbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    setIsLoggedIn(!!token);
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        setUser(null);
      }
    }
  }, []);

  // Listen for storage changes (when login/logout in another tab or same tab)
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      setIsLoggedIn(!!token);
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    // Listen for custom auth event (from same tab)
    const handleAuthChange = () => {
      handleStorageChange();
    };

    // Listen for storage events (from other tabs)
    window.addEventListener('storage', handleStorageChange);
    // Listen for custom auth events (from same tab)
    window.addEventListener('auth-change', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      setIsLoggedIn(false);
      setUser(null);
      setUserDropdownOpen(false);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('auth-change'));
      
      toast('Logged out successfully', { type: 'success' });
      navigate('/');
    } catch (error) {
      toast('Logout failed', { type: 'error' });
    }
  };

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/interview', label: 'Interview' },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0C10]/95 backdrop-blur-md border-b border-[#1F2833]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-[#66FCF1] to-[#45A29E] rounded-xl flex items-center justify-center shadow-lg glow-primary group-hover:glow-primary-hover transition-all duration-300">
              <Zap className="w-6 h-6 text-[#0B0C10]" />
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">
              Aiz by <span className="text-[#66FCF1]">Zenith</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'text-[#C5C6C7] hover:text-[#66FCF1] transition-all duration-300 text-sm font-medium relative',
                  isActive(item.to) && 'text-[#66FCF1]'
                )}
              >
                {item.label}
                {isActive(item.to) && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#66FCF1] glow-primary" />
                )}
              </Link>
            ))}
          </div>

          {/* CTA Buttons / User Menu */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-[#1F2833] transition-colors group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-[#66FCF1] to-[#45A29E] rounded-full flex items-center justify-center text-[#0B0C10] font-bold text-sm shadow-lg glow-primary group-hover:glow-primary-hover transition-all duration-300">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                </button>

                {/* User Dropdown */}
                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-[#1F2833] rounded-xl shadow-2xl border border-[#66FCF1]/30 py-2 z-20 glow-border">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-[#66FCF1]/20">
                        <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                        <p className="text-xs text-[#C5C6C7] truncate">{user?.email || 'user@example.com'}</p>
                      </div>

                      {/* Menu Items */}
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate('/dashboard');
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-[#C5C6C7] hover:text-[#66FCF1] hover:bg-[#66FCF1]/10 flex items-center gap-3 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </button>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate('/history');
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-[#C5C6C7] hover:text-[#66FCF1] hover:bg-[#66FCF1]/10 flex items-center gap-3 transition-colors"
                      >
                        <History className="w-4 h-4" />
                        History
                      </button>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate('/dashboard/settings');
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-[#C5C6C7] hover:text-[#66FCF1] hover:bg-[#66FCF1]/10 flex items-center gap-3 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <hr className="my-2 border-[#66FCF1]/20" />
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="text-[#C5C6C7] hover:text-[#66FCF1]"
                >
                  Log In
                </Button>
                <Button
                  variant="primary"
                  onClick={() => navigate('/interview')}
                  className="bg-[#66FCF1] hover:bg-[#45A29E] text-[#0B0C10] font-semibold glow-primary-hover"
                >
                  Start Interview
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#C5C6C7] hover:text-[#66FCF1] rounded-lg hover:bg-[#1F2833] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#1F2833]">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'text-[#C5C6C7] hover:text-[#66FCF1] px-4 py-2 rounded-lg hover:bg-[#1F2833] transition-colors',
                    isActive(item.to) && 'text-[#66FCF1] bg-[#1F2833]'
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="px-4 pt-4 border-t border-[#1F2833]">
                {isLoggedIn ? (
                  <div className="flex flex-col gap-2">
                    {/* User Info */}
                    <div className="px-4 py-3 bg-[#1F2833] rounded-lg mb-2">
                      <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                      <p className="text-xs text-[#C5C6C7] truncate">{user?.email || 'user@example.com'}</p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        navigate('/dashboard');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start text-[#C5C6C7] hover:text-[#66FCF1]"
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        navigate('/history');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start text-[#C5C6C7] hover:text-[#66FCF1]"
                    >
                      <History className="w-4 h-4 mr-2" />
                      History
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        navigate('/dashboard/settings');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start text-[#C5C6C7] hover:text-[#66FCF1]"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start text-red-400 hover:text-red-300"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        navigate('/login');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start text-[#C5C6C7] hover:text-[#66FCF1]"
                    >
                      Log In
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        navigate('/interview');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-[#66FCF1] hover:bg-[#45A29E] text-[#0B0C10] font-semibold glow-primary-hover"
                    >
                      Start Interview
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Dashbar;
