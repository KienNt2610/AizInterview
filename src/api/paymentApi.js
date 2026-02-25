import api from "../services/api";

// FE-only payment API wrapper (no backend schema changes here)
// Backend expects a raw decimal in the body (not { amount: ... })
export const paymentAPI = {
  checkout: (amount) => api.post("/payments/checkout", amount),
};

