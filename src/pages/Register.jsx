import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { authAPI } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

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

    // Some APIs return { message: "..." } or plain string
    if (typeof data === 'string' && data.trim()) return data;
    if (data?.message) return data.message;

    return 'Registration failed. Please try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast('Please fix the errors in the form', { type: 'error' });
      return;
    }

    setLoading(true);

    try {
      // Map frontend -> backend DTO
      const payload = {
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        fullName: formData.name,
      };

      await authAPI.register(payload);

      // Note: BE automatically grants demo license (1 free interview) to new users
      // Frontend manages license state locally with email check to prevent duplicate grants
      
      // Clear any old plan data from localStorage (fresh start for new user)
      // Set default plan for new user (FREE with 0 interviews = 1 free interview remaining)
      localStorage.removeItem("userPlan");
      localStorage.removeItem("interviewCount");
      localStorage.removeItem("userPlanEmail");
      localStorage.setItem("userPlan", "FREE");
      localStorage.setItem("interviewCount", "0");
      // Note: email will be stored when user logs in

      toast('Registration successful! Redirecting to login...', { type: 'success' });
      navigate('/login');
    } catch (error) {
      console.error('Register error:', error);
      toast(getBackendErrorMessage(error), { type: 'error' });
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
          <h1 className="text-4xl font-bold text-white mb-3">Create Account</h1>
          <p className="text-[#C5C6C7] text-lg">Start your AI interview preparation today</p>
        </div>

        {/* Register Form */}
        <div className="bg-[#1F2833] rounded-2xl shadow-2xl border border-[#66FCF1]/30 p-8 glow-border hover:border-[#66FCF1]/50 transition-all duration-300">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#C5C6C7] mb-2">
                Full Name
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => {
                  handleChange(e);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                className={errors.name ? 'border-red-500 focus:ring-red-500' : ''}
                required
              />
              {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
            </div>

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
              <p className="mt-1 text-xs text-[#C5C6C7]/60">At least 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#C5C6C7] mb-2">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => {
                  handleChange(e);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                className={errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}
                required
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 w-4 h-4 text-[#66FCF1] border-[#1F2833] rounded focus:ring-[#66FCF1] bg-[#1F2833] cursor-pointer"
                required
              />
              <label htmlFor="terms" className="text-sm text-[#C5C6C7] cursor-pointer">
                I agree to the{' '}
                <a href="#" className="text-[#66FCF1] hover:text-[#45A29E] font-medium underline transition-colors">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-[#66FCF1] hover:text-[#45A29E] font-medium underline transition-colors">
                  Privacy Policy
                </a>
              </label>
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
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#C5C6C7]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#66FCF1] hover:text-[#45A29E] font-medium transition-colors">
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
