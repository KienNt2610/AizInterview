import { QrCode } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import PaymentStatusBadge from './PaymentStatusBadge';
import CopyField from './CopyField';
import { cn } from '../../utils/cn';

const SepayPaymentCard = ({
  order,
  paymentStatus,
  setPaymentStatus,
  onConfirmPaid,
  onCreateNewOrder,
  onContinueAfterPaid,
}) => {
  const isDev = import.meta.env.DEV;

  const handlePrimaryAction = () => {
    if (paymentStatus === 'PENDING') {
      onConfirmPaid();
    } else if (paymentStatus === 'PAID') {
      onContinueAfterPaid();
    } else if (paymentStatus === 'EXPIRED') {
      onCreateNewOrder();
    }
  };

  const getPrimaryButtonText = () => {
    if (paymentStatus === 'PENDING') return 'Tôi đã thanh toán';
    if (paymentStatus === 'PAID') return 'Tiếp tục';
    if (paymentStatus === 'EXPIRED') return 'Tạo lại đơn';
    return 'Xử lý';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quét mã QR để thanh toán</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Placeholder */}
        <div className="space-y-2">
          <div className="relative aspect-square bg-white rounded-lg border-2 border-[#66FCF1]/30 p-8 flex items-center justify-center">
            <div className="text-center space-y-3">
              <QrCode className="w-16 h-16 text-[#0B0C10] mx-auto opacity-20" />
              <p className="text-sm text-[#0B0C10] font-medium">
                QR
              </p>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#C5C6C7]">Số tiền</label>
          <div className="px-4 py-2.5 bg-[#0B0C10] border border-[#1F2833] rounded-lg">
            <span className="text-xl font-bold text-white">
              {order.amount} {order.currency}
            </span>
          </div>
        </div>

        {/* Transfer Content */}
        <CopyField
          label="Nội dung chuyển khoản"
          value={order.transferContent}
        />

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#C5C6C7]">Trạng thái</span>
          <PaymentStatusBadge status={paymentStatus} />
        </div>

        {/* Primary Action Button */}
        <Button
          variant="primary"
          className="w-full"
          onClick={handlePrimaryAction}
          disabled={false}
        >
          {getPrimaryButtonText()}
        </Button>

      </CardContent>
    </Card>
  );
};

export default SepayPaymentCard;
