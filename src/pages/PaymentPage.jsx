import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import { paymentAPI } from "../api/paymentApi";
import { useUserPlan } from "../hooks/useUserPlan";
import { useToast } from "../components/ui/Toast";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { upgradeToPro } = useUserPlan();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  const selectedPlanName = searchParams.get("plan") || "Pro";
  const selectedPriceK = searchParams.get("price") || "99"; // Only PRO now: 99

  // Raw amount sent to backend as integer VND, e.g. 99000
  const packageAmount = useMemo(
    () => Number(selectedPriceK) * 1000,
    [selectedPriceK],
  );

  const displayPrice = `${selectedPriceK}.000đ / tháng`;

  const [loading, setLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState(null);
  const [transCode, setTransCode] = useState("");
  const [countdown, setCountdown] = useState(300); // 5 minutes countdown
  const [checkingPayment, setCheckingPayment] = useState(false);

  const handleCreateCheckout = async () => {
    try {
      setLoading(true);
      setQrUrl(null);
      setTransCode("");

      console.log("[PAYMENT] Creating checkout with amount:", packageAmount);

      const response = await paymentAPI.checkout(packageAmount);

      // Be flexible with backend shape, but NEVER modify the raw values
      const payload = response?.data?.data ?? response?.data ?? {};
      const nextQrUrl = payload.qrUrl ?? payload.qr_url ?? null;
      const nextTransCode = payload.transCode ?? payload.trans_code ?? "";

      setQrUrl(nextQrUrl || null);
      // Store transCode exactly as returned from BE (no formatting)
      if (typeof nextTransCode === "string") {
        setTransCode(nextTransCode);
      } else if (nextTransCode != null) {
        setTransCode(String(nextTransCode));
      }
    } catch (error) {
      console.error("Failed to create payment checkout:", error);
      if (error.response) {
        console.error("[PAYMENT] Backend error status:", error.response.status);
        console.error("[PAYMENT] Backend error body:", error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-create payment code when page loads so user sees QR ngay lập tức
  useEffect(() => {
    if (loading || qrUrl || transCode) return;
    void handleCreateCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageAmount]);

  // Countdown timer
  useEffect(() => {
    if (!transCode || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [transCode, countdown]);

  // Format countdown as MM:SS
  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Check payment status and update plan (local state only)
  const handleCheckPayment = async () => {
    try {
      setCheckingPayment(true);
      
      // Since backend endpoint doesn't exist, we upgrade locally after user confirms payment
      // In production, this would be replaced with actual payment verification
      upgradeToPro();
      toast("Thanh toán thành công! Gói PRO đã được kích hoạt.", { type: "success" });
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Failed to process payment:", error);
      toast("Có lỗi xảy ra. Vui lòng thử lại sau.", {
        type: "error",
      });
    } finally {
      setCheckingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Page Title */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Thanh toán gói dịch vụ
          </h1>
          <p className="text-[#C5C6C7]">
            Hoàn tất thanh toán để kích hoạt quyền truy cập Aiz của bạn.
          </p>
        </div>

        <Card className="bg-[#1F2833]/80 border-[#66FCF1]/20">
          <CardHeader>
            <CardTitle className="text-white text-lg sm:text-xl">
              Thông tin gói dịch vụ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selected package */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm text-[#C5C6C7]">Gói đã chọn</p>
                <p className="text-lg font-semibold text-white">
                  {selectedPlanName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#C5C6C7]">Giá</p>
                <p className="text-xl font-bold text-[#66FCF1]">
                  {displayPrice}
                </p>
              </div>
            </div>

            {/* Action: Create payment code */}
            <div className="pt-4 border-t border-[#66FCF1]/10">
              <Button
                variant="primary"
                size="lg"
                className="w-full px-6 py-4 text-base sm:text-lg glow-primary-hover"
                onClick={handleCreateCheckout}
                disabled={loading}
              >
                {loading
                  ? "Đang tạo mã thanh toán..."
                  : qrUrl || transCode
                  ? "Tạo lại mã thanh toán"
                  : "Tạo mã thanh toán"}
              </Button>
            </div>

            {/* Render backend response exactly */}
            {(qrUrl || transCode) && (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* QR image */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-[#C5C6C7]">
                      Mã QR thanh toán
                    </p>
                    <div className="bg-white rounded-lg p-3 flex items-center justify-center min-h-[220px]">
                      {qrUrl ? (
                        // Use qrUrl exactly as returned from backend
                        <img
                          src={qrUrl}
                          alt="QR thanh toán"
                          className="max-h-64 w-auto object-contain"
                        />
                      ) : (
                        <span className="text-xs text-gray-500">
                          Không có QR từ hệ thống
                        </span>
                      )}
                    </div>
                  </div>

                  {/* transCode */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-[#C5C6C7]">
                      Mã giao dịch (transCode)
                    </p>
                    <div className="px-4 py-3 rounded-lg bg-[#0B0C10] border border-[#66FCF1]/30">
                      <p className="text-sm text-[#C5C6C7] mb-1">
                        Sao chép chính xác nội dung này khi chuyển khoản:
                      </p>
                      <p className="font-mono text-base sm:text-lg text-white break-all">
                        {transCode || "Chưa có mã giao dịch"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Countdown and Payment Check */}
                <div className="pt-4 border-t border-[#66FCF1]/10">
                  {countdown > 0 && (
                    <div className="mb-4 text-center">
                      <p className="text-sm text-[#C5C6C7] mb-2">
                        Thời gian còn lại:{" "}
                        <span className="text-[#66FCF1] font-mono font-semibold text-lg">
                          {formatCountdown(countdown)}
                        </span>
                      </p>
                    </div>
                  )}
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full px-6 py-4 text-base sm:text-lg glow-primary-hover"
                    onClick={handleCheckPayment}
                    disabled={checkingPayment}
                  >
                    {checkingPayment ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Đang kiểm tra...
                      </>
                    ) : (
                      "Đã thanh toán"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentPage;
