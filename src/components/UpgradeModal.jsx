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
    <Modal isOpen={isOpen} onClose={onClose} title="License inactive or expired">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="bg-red-900/30 p-3 rounded-full flex-shrink-0">
            <XCircle className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-[#C5C6C7] text-base leading-relaxed">
              You cannot start a new interview because the backend returned LICENSE_INVALID.
              Please complete payment and retry starting interview.
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
            Upgrade to PRO
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UpgradeModal;
