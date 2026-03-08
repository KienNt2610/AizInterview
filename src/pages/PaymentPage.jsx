import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import { paymentAPI } from "../api/paymentApi";
import { useUserPlan } from "../hooks/useUserPlan";
import { useToast } from "../components/ui/Toast";
import { PLAN } from "../utils/plan";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 90000;

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { plan, upgradeToPro, refreshFromBackend } = useUserPlan();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  const selectedPlanName = searchParams.get("plan") || "Pro";
  const selectedPriceK = searchParams.get("price") || "99";

  const packageAmount = useMemo(
    () => Number(selectedPriceK) * 1000,
    [selectedPriceK],
  );

  const displayPrice = `${selectedPriceK}.000đ / tháng`;

  const [loading, setLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState(null);
  const [transCode, setTransCode] = useState("");
  const [checkoutId, setCheckoutId] = useState(null);
  const [countdown, setCountdown] = useState(300);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentPhase, setPaymentPhase] = useState("PENDING");
  const [pollingError, setPollingError] = useState("");
  const stopPollingRef = useRef(false);

  const handleCreateCheckout = async () => {
    try {
      setLoading(true);
      setQrUrl(null);
      setTransCode("");
      setCheckoutId(null);
      setCountdown(300);
      setPaymentPhase("PENDING");
      setPollingError("");

      const response = await paymentAPI.checkout(packageAmount);
      const payload = response?.data?.data ?? response?.data ?? {};
      const nextQrUrl = payload.qrUrl ?? payload.qr_url ?? null;
      const nextTransCode = payload.transCode ?? payload.trans_code ?? "";
      const nextCheckoutId =
        payload.checkoutId ??
        payload.paymentId ??
        payload.orderId ??
        payload.transactionId ??
        null;

      setQrUrl(nextQrUrl || null);
      setCheckoutId(nextCheckoutId);
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
      toast("Không thể tạo mã thanh toán. Vui lòng thử lại.", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const parsePaymentPayload = (payload) => {
    const normalizedStatus = String(
      payload?.status ?? payload?.paymentStatus ?? payload?.state ?? "",
    ).toUpperCase();

    const isPaid =
      payload?.isPaid === true ||
      payload?.paid === true ||
      ["PAID", "SUCCESS", "COMPLETED", "CONFIRMED"].includes(normalizedStatus);

    const isFailed =
      payload?.isFailed === true ||
      ["FAILED", "EXPIRED", "CANCELLED", "ERROR"].includes(normalizedStatus);

    return { isPaid, isFailed };
  };

  const startPaymentPolling = useCallback(async () => {
    setCheckingPayment(true);
    setPaymentPhase("PROCESSING");
    setPollingError("");

    const startedAt = Date.now();
    let statusEndpointUnavailable = false;

    try {
      while (!stopPollingRef.current && Date.now() - startedAt <= POLL_TIMEOUT_MS) {
        let isPaid = false;
        let isFailed = false;

        if (!statusEndpointUnavailable) {
          try {
            const statusRes = await paymentAPI.checkStatus({ transCode, checkoutId });
            const statusPayload = statusRes?.data?.data ?? statusRes?.data ?? {};
            const parsedStatus = parsePaymentPayload(statusPayload);
            isPaid = parsedStatus.isPaid;
            isFailed = parsedStatus.isFailed;
          } catch (error) {
            if (error?.code === "PAYMENT_STATUS_ENDPOINT_NOT_FOUND") {
              statusEndpointUnavailable = true;
            } else {
              throw error;
            }
          }
        }

        const refreshed = await refreshFromBackend();
        const isPlanProNow =
          refreshed?.plan === PLAN.PRO || localStorage.getItem("userPlan") === PLAN.PRO;

        if (isPlanProNow || isPaid) {
          if (!isPlanProNow) {
            upgradeToPro();
          }
          setPaymentPhase("SUCCESS");
          toast("Thanh toán đã được xác nhận. Tài khoản của bạn đã nâng cấp PRO.", {
            type: "success",
          });
          setTimeout(() => navigate("/dashboard"), 1200);
          return;
        }

        if (isFailed) {
          setPaymentPhase("FAILED");
          setPollingError("Thanh toán chưa thành công hoặc đã hết hạn. Vui lòng tạo mã mới.");
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }

      setPaymentPhase("TIMEOUT");
      setPollingError(
        "Chưa nhận được xác nhận từ hệ thống. Bạn có thể bấm kiểm tra lại hoặc tải lại trang sau vài giây.",
      );
    } catch (error) {
      console.error("Failed to poll payment status:", error);
      setPaymentPhase("FAILED");
      setPollingError(
        error?.response?.data?.message ||
          "Có lỗi khi xác nhận thanh toán. Vui lòng thử lại.",
      );
    } finally {
      setCheckingPayment(false);
    }
  }, [checkoutId, navigate, refreshFromBackend, toast, transCode, upgradeToPro]);

  useEffect(() => {
    if (plan === PLAN.PRO || loading || qrUrl || transCode) return;
    void handleCreateCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageAmount, plan]);

  useEffect(() => {
    if (!transCode || countdown <= 0 || checkingPayment) return;

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
  }, [transCode, countdown, checkingPayment]);

  useEffect(() => {
    stopPollingRef.current = false;
    return () => {
      stopPollingRef.current = true;
    };
  }, []);

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleCheckPayment = async () => {
    if (!transCode && !checkoutId) {
      toast("Chưa có mã thanh toán để kiểm tra.", { type: "warning" });
      return;
    }

    stopPollingRef.current = false;
    await startPaymentPolling();
  };

  const renderStatusNotice = () => {
    if (paymentPhase === "SUCCESS") {
      return (
        <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/10">
          <p className="text-green-300 font-medium">
            Thanh toán thành công. Gói PRO đã được kích hoạt.
          </p>
        </div>
      );
    }

    if (paymentPhase === "PROCESSING") {
      return (
        <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
          <p className="text-yellow-300 font-medium">
            Hệ thống đang chờ webhook xác nhận thanh toán. Vui lòng đợi trong giây lát.
          </p>
        </div>
      );
    }

    if (paymentPhase === "FAILED" || paymentPhase === "TIMEOUT") {
      return (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10">
          <p className="text-red-300 font-medium">
            {pollingError ||
              "Không thể xác nhận thanh toán ngay lúc này. Vui lòng thử lại sau."}
          </p>
        </div>
      );
    }

    return null;
  };

  if (plan === PLAN.PRO) {
    return (
      <div className="min-h-screen bg-[#0B0C10] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-[#1F2833]/80 border-[#66FCF1]/20">
            <CardHeader>
              <CardTitle className="text-white text-xl">Tài khoản PRO đang hoạt động</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[#C5C6C7]">
                Bạn đã là thành viên PRO. Không cần thanh toán lại.
              </p>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => navigate("/dashboard")}
              >
                Quay về Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0C10] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm text-[#C5C6C7]">Gói đã chọn</p>
                <p className="text-lg font-semibold text-white">{selectedPlanName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#C5C6C7]">Giá</p>
                <p className="text-xl font-bold text-[#66FCF1]">{displayPrice}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#66FCF1]/10">
              <Button
                variant="primary"
                size="lg"
                className="w-full px-6 py-4 text-base sm:text-lg glow-primary-hover"
                onClick={handleCreateCheckout}
                disabled={loading || checkingPayment}
              >
                {loading
                  ? "Đang tạo mã thanh toán..."
                  : qrUrl || transCode
                  ? "Tạo lại mã thanh toán"
                  : "Tạo mã thanh toán"}
              </Button>
            </div>

            {(qrUrl || transCode) && (
              <div className="mt-6 space-y-6">
                {renderStatusNotice()}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-[#C5C6C7]">Mã QR thanh toán</p>
                    <div className="bg-white rounded-lg p-3 flex items-center justify-center min-h-[220px]">
                      {qrUrl ? (
                        <img
                          src={qrUrl}
                          alt="QR thanh toán"
                          className="max-h-64 w-auto object-contain"
                        />
                      ) : (
                        <span className="text-xs text-gray-500">Không có QR từ hệ thống</span>
                      )}
                    </div>
                  </div>

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
                      "Đã thanh toán, kiểm tra trạng thái"
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
