import api from "../services/api";

export const paymentAPI = {
  checkout: (amount) => api.post("/payments/checkout", amount),
};

