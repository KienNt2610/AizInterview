import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import { paymentAPI } from "../api/paymentApi";
import { useToast } from "../components/ui/Toast";

const PAYMENT_BANK = "MBBank";
const PAYMENT_ACCOUNT = "2913069999";

const buildSepayQrUrl = ({ amount, transCode }) =>
  `https://qr.sepay.vn/img?bank=${encodeURIComponent(PAYMENT_BANK)}&acc=${encodeURIComponent(
    PAYMENT_ACCOUNT,
  )}&template=template&amount=${encodeURIComponent(String(amount))}&des=${encodeURIComponent(transCode)}`;

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const selectedPlanName = searchParams.get("plan") || "Pro";
  const selectedPriceK = searchParams.get("price") || "99";

  const packageAmount = useMemo(() => Number(selectedPriceK) * 1000, [selectedPriceK]);
  const displayPrice = `${selectedPriceK}.000 VND / month`;

  const [loading, setLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState(null);
  const [transCode, setTransCode] = useState("");
  const [checkoutId, setCheckoutId] = useState(null);

  const handleCreateCheckout = async () => {
    try {
      setLoading(true);
      setQrUrl(null);
      setTransCode("");
      setCheckoutId(null);

      const response = await paymentAPI.checkout(packageAmount);
      const payload = response?.data?.data ?? response?.data ?? {};
      const nextQrUrl = payload.qrUrl ?? payload.qr_url ?? null;
      const nextTransCode = payload.transCode ?? payload.trans_code ?? "";
      const nextCheckoutId =
        payload.checkoutId ?? payload.paymentId ?? payload.orderId ?? payload.transactionId ?? null;

      const normalizedTransCode =
        typeof nextTransCode === "string"
          ? nextTransCode
          : nextTransCode != null
          ? String(nextTransCode)
          : "";

      const clientQrUrl = normalizedTransCode
        ? buildSepayQrUrl({ amount: packageAmount, transCode: normalizedTransCode })
        : null;

      setQrUrl(clientQrUrl || nextQrUrl || null);
      setCheckoutId(nextCheckoutId);
      setTransCode(normalizedTransCode);
    } catch (error) {
      console.error("Failed to create payment checkout:", error);
      toast("Cannot create payment QR right now. Please try again.", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading || qrUrl || transCode) return;
    void handleCreateCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageAmount]);

  const handlePaidAndRetry = () => {
    toast("Payment action noted. Returning to interview setup for retry...", { type: "info" });
    navigate("/interview?retryStart=1");
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Upgrade payment</h1>
          <p className="text-[#C5C6C7]">Complete transfer, then retry start-interview.</p>
        </div>

        <Card className="bg-[#1F2833]/80 border-[#66FCF1]/20">
          <CardHeader>
            <CardTitle className="text-white text-lg sm:text-xl">Package details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm text-[#C5C6C7]">Selected plan</p>
                <p className="text-lg font-semibold text-white">{selectedPlanName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#C5C6C7]">Price</p>
                <p className="text-xl font-bold text-[#66FCF1]">{displayPrice}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#66FCF1]/10">
              <Button
                variant="primary"
                size="lg"
                className="w-full px-6 py-4 text-base sm:text-lg glow-primary-hover"
                onClick={handleCreateCheckout}
                disabled={loading}
              >
                {loading
                  ? "Creating payment QR..."
                  : qrUrl || transCode
                  ? "Regenerate payment QR"
                  : "Create payment QR"}
              </Button>
            </div>

            {(qrUrl || transCode) && (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-[#C5C6C7]">Payment QR</p>
                    <div className="bg-white rounded-lg p-3 flex items-center justify-center min-h-[220px]">
                      {qrUrl ? (
                        <img src={qrUrl} alt="Payment QR" className="max-h-64 w-auto object-contain" />
                      ) : (
                        <span className="text-xs text-gray-500">QR not available</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-[#C5C6C7]">Transaction code (transCode)</p>
                    <div className="px-4 py-3 rounded-lg bg-[#0B0C10] border border-[#66FCF1]/30">
                      <p className="text-sm text-[#C5C6C7] mb-1">Use this exact transfer note:</p>
                      <p className="font-mono text-base sm:text-lg text-white break-all">
                        {transCode || "No transaction code"}
                      </p>
                      {checkoutId && (
                        <p className="text-xs text-[#C5C6C7] mt-2">Checkout ID: {String(checkoutId)}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#66FCF1]/10 space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full px-6 py-4 text-base sm:text-lg glow-primary-hover"
                    onClick={handlePaidAndRetry}
                  >
                    I have paid - retry start interview
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full px-6 py-4 text-base sm:text-lg"
                    onClick={() => navigate("/interview")}
                  >
                    Back to interview setup
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
