import { cn } from '../../utils/cn';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

const PaymentStatusBadge = ({ status }) => {
  const config = {
    PENDING: {
      label: 'Đang chờ',
      icon: Clock,
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    },
    PAID: {
      label: 'Đã thanh toán',
      icon: CheckCircle,
      className: 'bg-green-500/20 text-green-400 border-green-500/30',
    },
    EXPIRED: {
      label: 'Hết hạn',
      icon: XCircle,
      className: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
  };

  const { label, icon: Icon, className } = config[status] || config.PENDING;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg border',
        className
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
};

export default PaymentStatusBadge;
