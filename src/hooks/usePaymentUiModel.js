import { useState } from 'react';

/**
 * UI-only payment model hook (no API calls)
 * Returns mock data and placeholder handlers for future Sepay integration
 */
export const usePaymentUiModel = () => {
  const [paymentStatus, setPaymentStatus] = useState('PENDING'); // 'PENDING' | 'PAID' | 'EXPIRED'

  // Mock plan data
  const plan = {
    name: 'AI Interview Pro',
    price: '299.000đ',
    period: 'tháng',
    benefits: [
      'Phỏng vấn không giới hạn',
      'Đánh giá AI nâng cao',
      'Xử lý ưu tiên',
      'Lịch sử phỏng vấn đầy đủ',
      'Hỗ trợ 24/7',
    ],
  };

  // Mock order data (will be replaced with real Sepay API response)
  const order = {
    orderId: 'ORD-' + Date.now(),
    amount: '299.000',
    currency: 'VND',
    transferContent: 'PAYMENT_ORD_' + Date.now(),
    qrPlaceholder: true, // Indicates QR is not loaded yet
  };

  // Get user info from localStorage (fallback to mock)
  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          email: user.email || user.username || 'user@example.com',
          username: user.username || user.email || 'user',
        };
      }
    } catch (e) {
      console.warn('[Payment] Failed to parse user from localStorage:', e);
    }
    return {
      email: 'user@example.com',
      username: 'user',
    };
  };

  const userInfo = getUserInfo();

  // Placeholder handlers (will be replaced with real API calls)
  const onConfirmPaid = () => {
    console.log('[TODO][PAYMENT API] confirm paid for orderId', order.orderId);
    // TODO: Call Sepay API to confirm payment
    // This will trigger polling to check payment status
  };

  const onCreateNewOrder = () => {
    console.log('[TODO][PAYMENT API] create new order for plan', plan.name);
    // TODO: Call backend to create new Sepay order
    // This will return new orderId, QR code, transferContent
    setPaymentStatus('PENDING');
  };

  const onContinueAfterPaid = () => {
    console.log('[TODO][PAYMENT API] continue after payment confirmed');
    // TODO: Navigate to success page or activate subscription
  };

  return {
    plan,
    order,
    paymentStatus,
    setPaymentStatus,
    userInfo,
    onConfirmPaid,
    onCreateNewOrder,
    onContinueAfterPaid,
  };
};
