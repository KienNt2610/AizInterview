import axios from "axios";

const API_BASE_URL = "https://aizz.io.vn/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

/** ===== AUTH ===== */
export const authAPI = {
  login: (payload) => api.post("/Auth/login", payload),
  register: (payload) => api.post("/Auth/register", payload),

  refresh: (refreshToken) => {
    return api.post(
      "/Auth/refresh",
      { refreshToken },
      {
        _skipAuthRetry: true,
      },
    );
  },

  logout: () => {
    // Save email before removing user data (to preserve plan data for same email on next login)
    const userStr = localStorage.getItem("user");
    let userEmail = null;
    try {
      if (userStr) {
        const user = JSON.parse(userStr);
        userEmail = user?.email;
      }
    } catch {
      // Ignore parse errors
    }
    
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    
    // Keep plan data and email to preserve interviewCount for same email on next login
    // Only clear if we don't have email to preserve
    if (!userEmail) {
      localStorage.removeItem("userPlan");
      localStorage.removeItem("interviewCount");
      localStorage.removeItem("userPlanEmail");
    }
    // If we have email, keep userPlanEmail so we can check on next login
    
    // Dispatch event to notify components
    window.dispatchEvent(new Event('auth-change'));
    return Promise.resolve();
  },
};

/** ===== JOB DESCRIPTION ===== */
export const jobAPI = {
  getAll: () => api.get("/JobDescription"),
};

/** ===== INTERVIEW SESSION ===== */
export const interviewSessionAPI = {
  start: (jobDescriptionId) => {
    const id = Number(jobDescriptionId);
    // Backend route: /api/InterviewSesssion/start-interview
    // Backend expects [FromQuery] jobDescriptionId (int)
    // Method: POST
    return api.post("/InterviewSesssion/start-interview", null, {
      params: { jobDescriptionId: id },
    });
  },

  end: (interviewSessionId) => {
    // interviewSessionId can be GUID (string) or number
    // Convert to string to avoid NaN if it's a GUID
    const sessionIdStr = String(interviewSessionId);
    console.log("=== END INTERVIEW API CALL ===");
    console.log("interviewSessionId (raw):", interviewSessionId);
    console.log("interviewSessionId (type):", typeof interviewSessionId);
    console.log("interviewSessionId (string):", sessionIdStr);
    return api.post("/InterviewSesssion/end-interview", null, {
      params: { interviewSessionId: sessionIdStr },
    });
  },

  history: () => api.get("/InterviewSesssion/history"),
  detail: (sessionId) => api.get(`/InterviewSesssion/detail/${sessionId}`),
};

/** ===== INTERVIEW TURN / ANSWER / EVALUATION ===== */
export const interviewTurnAPI = {
  saveTurn: (dto) => api.post("/InterviewTurn/save-turn", dto),
};

export const interviewAnswerAPI = {
  saveAnswer: (dto) => api.post("/InterviewAnswer/save-answer", dto),
};

export const interviewEvaluationAPI = {
  saveEvaluation: (dto) =>
    api.post("/InterviewEvaluation/save-evaluation", dto),
};

/** ===== AI INTERVIEW API (Separate Instance) ===== */
// Create separate axios instance for AI API (no JWT, no interceptors)
const aiApiInstance = axios.create({
  baseURL: "https://ahntuann-ai-interview-backend.hf.space",
  headers: { "Content-Type": "application/json" },
});

export const aiInterviewAPI = {
  // Start AI interview - get first question
  start: (payload) => {
    const finalPayload = payload
      ? { ...payload, use_voice_ai: true }
      : { use_voice_ai: true };
    console.log("[AI VOICE] use_voice_ai enabled for /api/start");
    return aiApiInstance.post("/api/start", finalPayload);
  },

  // Submit user answer - get feedback and next question
  submit: (payload) => {
    const finalPayload = payload
      ? { ...payload, use_voice_ai: true }
      : { use_voice_ai: true };
    console.log("[AI VOICE] use_voice_ai enabled for /api/submit");
    return aiApiInstance.post("/api/submit", finalPayload);
  },
};

/** ===== USER ===== */
export const userAPI = {
  getCurrentProfile: async () => {
    const candidateEndpoints = [
      "/User/me",
      "/User/profile",
      "/User/current",
      "/Auth/me",
    ];

    let lastError = null;

    for (const endpoint of candidateEndpoints) {
      try {
        return await api.get(endpoint);
      } catch (error) {
        lastError = error;
        const status = error?.response?.status;
        if (status === 404) continue;
        throw error;
      }
    }

    if (lastError?.response?.status === 404) {
      const endpointError = new Error("PROFILE_ENDPOINT_NOT_FOUND");
      endpointError.code = "PROFILE_ENDPOINT_NOT_FOUND";
      throw endpointError;
    }

    if (lastError) throw lastError;
    throw new Error("No profile endpoint available");
  },
  updateProfile: (dto) => api.put("/User/update-profile", dto),
  changePassword: (dto) => api.put("/User/change-password", dto),
};

let isRefreshing = false;
let pending = [];

function onRefreshed(newToken) {
  pending.forEach((cb) => cb(newToken));
  pending = [];
}

function addPending(cb) {
  pending.push(cb);
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (original?._skipAuthRetry || original?.url?.includes("/Auth/refresh")) {
      console.log("Skipping interceptor for refresh endpoint");
      return Promise.reject(error);
    }

    if (status === 401 && !original?._retry) {
      console.log("=== 401 UNAUTHORIZED - Starting refresh flow ===");
      console.log("Request URL:", original.url);
      console.log("Is retry:", original._retry);

      original._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        console.error(
          "No refreshToken found, clearing storage and redirecting to login",
        );
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        console.log("Already refreshing, queueing request");
        return new Promise((resolve) => {
          addPending((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            console.log("Retrying queued request with new token");
            resolve(api(original));
          });
        });
      }

      // Start refresh process
      isRefreshing = true;
      console.log("Starting token refresh...");

      try {
        const r = await authAPI.refresh(refreshToken);
        console.log("Refresh API response:", r.status, r.data);

        const payload = r.data?.data ?? r.data;

        if (!payload?.accessToken) {
          throw new Error("Refresh response missing accessToken");
        }

        localStorage.setItem("token", payload.accessToken);
        if (payload.refreshToken) {
          localStorage.setItem("refreshToken", payload.refreshToken);
        }

        console.log("Token refreshed successfully");

        onRefreshed(payload.accessToken);

        original.headers.Authorization = `Bearer ${payload.accessToken}`;
        original._retry = false; // Reset retry flag for retry
        console.log("Retrying original request with new token");
        return api(original);
      } catch (e) {
        console.error("=== REFRESH TOKEN FAILED ===");
        console.error("Error:", e);
        console.error("Response:", e.response?.data);
        console.error("Status:", e.response?.status);

        isRefreshing = false;
        pending = [];
        localStorage.clear();

        // Use setTimeout to avoid navigation during error handling
        setTimeout(() => {
          window.location.href = "/login";
        }, 100);

        return Promise.reject(e);
      } finally {
        isRefreshing = false;
        console.log("Refresh process completed");
      }
    }

    return Promise.reject(error);
  },
);

export default api;
