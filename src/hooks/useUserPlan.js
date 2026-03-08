import { useState, useEffect, useCallback } from "react";
import { userAPI } from "../services/api";
import { PLAN, resolvePlanFromData } from "../utils/plan";

const FREE_LIMIT = 1;
const STORAGE_KEY_PLAN = "userPlan";
const STORAGE_KEY_INTERVIEW_COUNT = "interviewCount";
const STORAGE_KEY_USER_EMAIL = "userPlanEmail";
const STORAGE_KEY_PROFILE_ENDPOINT_UNAVAILABLE = "profileEndpointUnavailable";

let hasCheckedProfileEndpoint = false;

const getCurrentUserEmail = () => {
  try {
    const currentUser = localStorage.getItem("user");
    if (!currentUser) return null;
    const userObj = JSON.parse(currentUser);
    return userObj?.email || null;
  } catch {
    return null;
  }
};

const normalizeInterviewCount = (count) => {
  const parsed = Number.parseInt(count ?? "0", 10);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return parsed;
};

export const useUserPlan = () => {
  const [plan, setPlan] = useState(PLAN.FREE);
  const [interviewCount, setInterviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const currentUserEmail = getCurrentUserEmail();
      const storedPlan = localStorage.getItem(STORAGE_KEY_PLAN);
      const storedCount = localStorage.getItem(STORAGE_KEY_INTERVIEW_COUNT);
      const storedEmail = localStorage.getItem(STORAGE_KEY_USER_EMAIL);

      if (!currentUserEmail) {
        setPlan(PLAN.FREE);
        setInterviewCount(0);
        localStorage.setItem(STORAGE_KEY_PLAN, PLAN.FREE);
        localStorage.setItem(STORAGE_KEY_INTERVIEW_COUNT, "0");
        return;
      }

      if (storedEmail && storedEmail !== currentUserEmail) {
        setPlan(PLAN.FREE);
        setInterviewCount(0);
        localStorage.setItem(STORAGE_KEY_PLAN, PLAN.FREE);
        localStorage.setItem(STORAGE_KEY_INTERVIEW_COUNT, "0");
        localStorage.setItem(STORAGE_KEY_USER_EMAIL, currentUserEmail);
        return;
      }

      const nextPlan = storedPlan === PLAN.PRO ? PLAN.PRO : PLAN.FREE;
      const count = normalizeInterviewCount(storedCount);
      const boundedCount = nextPlan === PLAN.FREE ? Math.min(count, FREE_LIMIT) : count;

      setPlan(nextPlan);
      setInterviewCount(boundedCount);

      localStorage.setItem(STORAGE_KEY_PLAN, nextPlan);
      localStorage.setItem(STORAGE_KEY_INTERVIEW_COUNT, String(boundedCount));
      if (!storedEmail) {
        localStorage.setItem(STORAGE_KEY_USER_EMAIL, currentUserEmail);
      }
    } catch (error) {
      console.error("Failed to load user plan from localStorage:", error);
      setPlan(PLAN.FREE);
      setInterviewCount(0);
      localStorage.setItem(STORAGE_KEY_PLAN, PLAN.FREE);
      localStorage.setItem(STORAGE_KEY_INTERVIEW_COUNT, "0");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setPlan(PLAN.FREE);
        return;
      }

      const currentUserEmail = getCurrentUserEmail();
      if (!currentUserEmail) return;

      const storedEmail = localStorage.getItem(STORAGE_KEY_USER_EMAIL);
      const storedPlan = localStorage.getItem(STORAGE_KEY_PLAN);
      const isDifferentEmail = storedEmail && storedEmail !== currentUserEmail;

      if (isDifferentEmail) {
        setPlan(PLAN.FREE);
        setInterviewCount(0);
        localStorage.setItem(STORAGE_KEY_PLAN, PLAN.FREE);
        localStorage.setItem(STORAGE_KEY_INTERVIEW_COUNT, "0");
        localStorage.setItem(STORAGE_KEY_USER_EMAIL, currentUserEmail);
        return;
      }

      const normalizedCount = normalizeInterviewCount(
        localStorage.getItem(STORAGE_KEY_INTERVIEW_COUNT),
      );

      if (storedPlan === PLAN.PRO) {
        setPlan(PLAN.PRO);
        setInterviewCount(normalizedCount);
      } else {
        const boundedCount = Math.min(normalizedCount, FREE_LIMIT);
        setPlan(PLAN.FREE);
        setInterviewCount(boundedCount);
        localStorage.setItem(STORAGE_KEY_INTERVIEW_COUNT, String(boundedCount));
      }

      localStorage.setItem(STORAGE_KEY_USER_EMAIL, currentUserEmail);
    };

    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  const canStartInterview = useCallback(() => {
    if (plan === PLAN.PRO) return true;
    return interviewCount < FREE_LIMIT;
  }, [interviewCount, plan]);

  const incrementInterviewCount = useCallback(() => {
    if (plan !== PLAN.FREE) return;
    const nextCount = interviewCount + 1;
    setInterviewCount(nextCount);
    localStorage.setItem(STORAGE_KEY_INTERVIEW_COUNT, String(nextCount));

    const currentUserEmail = getCurrentUserEmail();
    if (currentUserEmail) {
      localStorage.setItem(STORAGE_KEY_USER_EMAIL, currentUserEmail);
    }
  }, [interviewCount, plan]);

  const upgradeToPro = useCallback(() => {
    setPlan(PLAN.PRO);
    setInterviewCount(0);
    localStorage.setItem(STORAGE_KEY_PLAN, PLAN.PRO);
    localStorage.setItem(STORAGE_KEY_INTERVIEW_COUNT, "0");

    const currentUserEmail = getCurrentUserEmail();
    if (currentUserEmail) {
      localStorage.setItem(STORAGE_KEY_USER_EMAIL, currentUserEmail);
    }
  }, []);

  const getRemainingInterviews = useCallback(() => {
    if (plan === PLAN.PRO) return "unlimited";
    return Math.max(0, FREE_LIMIT - interviewCount);
  }, [interviewCount, plan]);

  const hasReachedLimit = useCallback(() => {
    if (plan === PLAN.PRO) return false;
    return interviewCount >= FREE_LIMIT;
  }, [interviewCount, plan]);

  const syncWithBackend = useCallback(async (userData) => {
    try {
      const resolvedPlan = resolvePlanFromData(userData);
      if (resolvedPlan) {
        setPlan(resolvedPlan);
        localStorage.setItem(STORAGE_KEY_PLAN, resolvedPlan);
      }

      if (typeof userData?.interviewCount === "number" && userData.interviewCount >= 0) {
        const targetPlan =
          resolvedPlan || localStorage.getItem(STORAGE_KEY_PLAN) || PLAN.FREE;
        const boundedCount =
          targetPlan === PLAN.FREE
            ? Math.min(userData.interviewCount, FREE_LIMIT)
            : userData.interviewCount;

        setInterviewCount(boundedCount);
        localStorage.setItem(STORAGE_KEY_INTERVIEW_COUNT, String(boundedCount));
      } else if (resolvedPlan === PLAN.FREE) {
        setInterviewCount(0);
        localStorage.setItem(STORAGE_KEY_INTERVIEW_COUNT, "0");
      }

      return resolvedPlan;
    } catch (error) {
      console.error("Failed to sync user plan:", error);
      return null;
    }
  }, []);

  const refreshFromBackend = useCallback(async () => {
    const endpointUnavailable =
      localStorage.getItem(STORAGE_KEY_PROFILE_ENDPOINT_UNAVAILABLE) === "1";
    if (endpointUnavailable) {
      return {
        payload: null,
        plan: localStorage.getItem(STORAGE_KEY_PLAN) || PLAN.FREE,
      };
    }

    try {
      const res = await userAPI.getCurrentProfile();
      const payload = res.data?.data ?? res.data ?? {};
      localStorage.removeItem(STORAGE_KEY_PROFILE_ENDPOINT_UNAVAILABLE);

      if (payload && typeof payload === "object") {
        const oldUser = localStorage.getItem("user");
        try {
          const parsedOld = oldUser ? JSON.parse(oldUser) : {};
          localStorage.setItem("user", JSON.stringify({ ...parsedOld, ...payload }));
        } catch {
          localStorage.setItem("user", JSON.stringify(payload));
        }
      }

      const resolvedPlan = await syncWithBackend(payload);
      return {
        payload,
        plan: resolvedPlan || localStorage.getItem(STORAGE_KEY_PLAN) || PLAN.FREE,
      };
    } catch (error) {
      if (error?.code === "PROFILE_ENDPOINT_NOT_FOUND") {
        localStorage.setItem(STORAGE_KEY_PROFILE_ENDPOINT_UNAVAILABLE, "1");
      } else {
        console.warn("[useUserPlan] refreshFromBackend failed:", error?.message || error);
      }
      return {
        payload: null,
        plan: localStorage.getItem(STORAGE_KEY_PLAN) || PLAN.FREE,
      };
    }
  }, [syncWithBackend]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const endpointUnavailable =
      localStorage.getItem(STORAGE_KEY_PROFILE_ENDPOINT_UNAVAILABLE) === "1";

    if (!token || endpointUnavailable || hasCheckedProfileEndpoint) return;
    hasCheckedProfileEndpoint = true;
    void refreshFromBackend();
  }, [refreshFromBackend]);

  return {
    plan,
    interviewCount,
    loading,
    canStartInterview,
    incrementInterviewCount,
    upgradeToPro,
    getRemainingInterviews,
    hasReachedLimit,
    syncWithBackend,
    refreshFromBackend,
  };
};
