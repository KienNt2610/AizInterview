import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { authAPI } from '../services/api';
import { PLAN, resolvePlanFromData } from '../utils/plan';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getBackendErrorMessage = (error) => {
    const data = error?.response?.data;

    // ASP.NET validation style: { errors: { Field: ["msg"] } }
    if (data?.errors && typeof data.errors === 'object') {
      const all = Object.values(data.errors).flat();
      if (all.length) return all.join(', ');
    }

    if (typeof data === 'string' && data.trim()) return data;
    if (data?.message) return data.message;

    return 'Login failed. Please try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast('Please fix the errors in the form', { type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const res = await authAPI.login({
        email: formData.email,
        password: formData.password,
      });

      // Backend can return either { data: {...} } or {...}
      const payload = res.data?.data ?? res.data ?? {};

      // Extract token from multiple key variants to avoid undefined
      const accessToken =
        payload.accessToken ??
        payload.token ??
        payload.jwt ??
        payload.access_token ??
        payload.accessTokenToken; // Fallback for backend typo

      const refreshToken =
        payload.refreshToken ?? payload.refresh_token ?? payload.refresh ?? null;

      if (!accessToken) {
        console.error('Login response payload:', payload);
        throw new Error('Missing access token in login response');
      }

      localStorage.setItem('token', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

      // Save user if present; otherwise still keep email for UI state
      const userObj =
        payload.user ??
        {
          userId: payload.userId ?? payload.id,
          email: payload.email ?? formData.email,
          fullName: payload.fullName ?? payload.name,
        };

      localStorage.setItem('user', JSON.stringify(userObj));
      const resolvedPlanFromLogin = resolvePlanFromData(payload) || resolvePlanFromData(userObj);

      // License state is backend-driven.
      // Frontend only stores plan as a cache if backend already returned one in login payload.
      if (resolvedPlanFromLogin === PLAN.PRO || resolvedPlanFromLogin === PLAN.FREE) {
        localStorage.setItem("userPlan", resolvedPlanFromLogin);
      } else {
        localStorage.removeItem("userPlan");
      }
      localStorage.removeItem("interviewCount");

      window.dispatchEvent(new Event('auth-change'));

      toast('Login successful! Redirecting...', { type: 'success' });
      navigate('/');
    } catch (error) {
      // If thrown by missing token, show a friendly error message
      const msg =
        error?.message === 'Missing access token in login response'
          ? 'Login succeeded but token was not returned by backend. Please check /Auth/login response fields.'
          : getBackendErrorMessage(error);

      toast(msg, { type: 'error' });
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#66FCF1] to-[#45A29E] rounded-2xl mb-6 shadow-lg glow-primary animate-pulse">
            <span className="text-[#0B0C10] font-bold text-3xl">AZ</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Welcome Back</h1>
          <p className="text-[#C5C6C7] text-lg">Sign in to continue your AI interview journey</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#1F2833] rounded-2xl shadow-2xl border border-[#66FCF1]/30 p-8 glow-border hover:border-[#66FCF1]/50 transition-all duration-300">
          {isLoggedIn && (
            <div className="mb-6 p-4 bg-[#66FCF1]/10 border border-[#66FCF1]/30 rounded-xl">
              <p className="text-sm text-[#C5C6C7] mb-3">
                You are already logged in. You can log in with a different account or go to your dashboard.
              </p>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="w-full text-[#66FCF1] hover:text-[#45A29E] hover:bg-[#66FCF1]/10"
              >
                Go to Dashboard
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#C5C6C7] mb-2">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => {
                  handleChange(e);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                className={errors.email ? 'border-red-500 focus:ring-red-500' : ''}
                required
              />
              {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#C5C6C7] mb-2">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => {
                  handleChange(e);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                className={errors.password ? 'border-red-500 focus:ring-red-500' : ''}
                required
              />
              {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-[#66FCF1] border-[#1F2833] rounded focus:ring-[#66FCF1] bg-[#1F2833]"
                />
                <span className="text-[#C5C6C7]">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-[#66FCF1] hover:text-[#45A29E] font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-[#66FCF1] hover:bg-[#45A29E] text-[#0B0C10] glow-primary-hover"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Sign In
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#C5C6C7]">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#66FCF1] hover:text-[#45A29E] font-medium transition-colors">
                Create one now
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#C5C6C7]/60">
            By signing in, you agree to our{' '}
            <a href="#" className="text-[#66FCF1] hover:text-[#45A29E] underline transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-[#66FCF1] hover:text-[#45A29E] underline transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
