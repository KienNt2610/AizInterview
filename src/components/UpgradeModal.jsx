import { useNavigate } from "react-router-dom";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import { CreditCard, XCircle } from "lucide-react";

const UpgradeModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate("/payment?plan=Pro&price=99");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Đã hết lượt phỏng vấn miễn phí">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="bg-red-900/30 p-3 rounded-full flex-shrink-0">
            <XCircle className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-[#C5C6C7] text-base leading-relaxed">
              Bạn đã sử dụng hết 1 lượt phỏng vấn miễn phí. Vui lòng nâng cấp gói PRO để mở khóa phỏng vấn không giới hạn.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="primary"
            onClick={handleUpgrade}
            className="flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            Nâng cấp gói PRO
          </Button>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UpgradeModal;
