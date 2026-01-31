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
  );
}

export default App;
