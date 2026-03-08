import api from "../services/api";

// FE-only payment API wrapper (no backend schema changes here)
// Backend expects a raw decimal in the body (not { amount: ... })
export const paymentAPI = {
  checkout: (amount) => api.post("/payments/checkout", amount),
  checkStatus: async ({ transCode, checkoutId }) => {
    const candidateRequests = [
      {
        url: "/payments/status",
        params: { transCode, checkoutId },
      },
      {
        url: "/payments/check-status",
        params: { transCode, checkoutId },
      },
      {
        url: "/payments/check-payment",
        params: { transCode, checkoutId },
      },
    ];

    let lastError = null;

    for (const req of candidateRequests) {
      try {
        return await api.get(req.url, { params: req.params });
      } catch (error) {
        lastError = error;
        const status = error?.response?.status;
        if (status === 404) continue;
        throw error;
      }
    }

    const fallbackError =
      lastError || new Error("No payment status endpoint available");
    fallbackError.code = "PAYMENT_STATUS_ENDPOINT_NOT_FOUND";
    throw fallbackError;
  },
};

