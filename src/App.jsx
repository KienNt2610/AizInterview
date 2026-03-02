import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import MainLayout from './layouts/MainLayout';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Content from './pages/Content';
import InterviewSetup from './pages/InterviewSetup';
import InterviewSession from './pages/InterviewSession';
import InterviewSummary from './pages/InterviewSummary';
import History from './pages/History';
import Payment from './pages/Payment';
import PaymentPage from './pages/PaymentPage';
import Settings from './pages/Settings';
import { Component } from 'react';

// Error Boundary component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#1F2833] rounded-xl border border-red-500/30 p-6">
            <h2 className="text-xl font-bold text-red-400 mb-4">Đã xảy ra lỗi</h2>
            <p className="text-[#C5C6C7] mb-4">
              {this.state.error?.message || 'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-[#66FCF1] text-[#0B0C10] rounded-lg hover:bg-[#45A29E] transition-colors"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <Routes>
          {/* Public Routes with Layout */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Homepage />} />
            <Route path="pricing" element={<Homepage />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="interview" element={<InterviewSetup />} />
            <Route path="interview/:interviewId/session" element={<InterviewSession />} />
            <Route path="interview/:interviewId/summary" element={<InterviewSummary />} />
            <Route path="history" element={<History />} />
          </Route>

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="content" element={<Content />} />
            <Route path="interview" element={<InterviewSetup />} />
            <Route path="interview/:interviewId/session" element={<InterviewSession />} />
            <Route path="interview/:interviewId/summary" element={<InterviewSummary />} />
            <Route path="history" element={<History />} />
            <Route path="payment" element={<Payment />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Standalone Protected Route for Sepay Payment */}
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PaymentPage />} />
          </Route>

          {/* 404 - Redirect to homepage */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
