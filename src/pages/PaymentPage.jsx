import { useNavigate } from 'react-router-dom';
import { usePaymentUiModel } from '../hooks/usePaymentUiModel';
import PlanSummaryCard from '../components/payment/PlanSummaryCard';
import SepayPaymentCard from '../components/payment/SepayPaymentCard';

const PaymentPage = () => {
  const navigate = useNavigate();
  const {
    plan,
    order,
    paymentStatus,
    setPaymentStatus,
    userInfo,
    onConfirmPaid,
    onCreateNewOrder,
    onContinueAfterPaid,
  } = usePaymentUiModel();

  // Handle continue after paid (placeholder navigation)
  const handleContinueAfterPaid = () => {
    onContinueAfterPaid();
    // Try to navigate to success page, fallback to dashboard
    const successRoute = '/payment/success';
    // For now, navigate to dashboard as fallback (will be replaced with real route later)
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Thanh toán
          </h1>
          <p className="text-[#C5C6C7]">
            Hoàn tất thanh toán để kích hoạt gói đăng ký của bạn
          </p>
        </div>

        {/* 2-Column Layout: Desktop stacked, Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Plan Summary */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <PlanSummaryCard plan={plan} userInfo={userInfo} />
          </div>

          {/* RIGHT: Sepay Payment */}
          <div>
            <SepayPaymentCard
              order={order}
              paymentStatus={paymentStatus}
              setPaymentStatus={setPaymentStatus}
              onConfirmPaid={onConfirmPaid}
              onCreateNewOrder={onCreateNewOrder}
              onContinueAfterPaid={handleContinueAfterPaid}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
