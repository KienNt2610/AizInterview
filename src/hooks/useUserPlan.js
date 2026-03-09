import { useState, useEffect, useCallback } from "react";
import { PLAN, resolvePlanFromData } from "../utils/plan";

const STORAGE_KEY_PLAN = "userPlan";

const normalizePlan = (value) => {
  if (!value) return null;
  const normalized = String(value).toUpperCase();
  if (normalized === PLAN.PRO) return PLAN.PRO;
  if (normalized === PLAN.FREE) return PLAN.FREE;
  return null;
};

export const useUserPlan = () => {
  const [plan, setPlan] = useState(() =>
    normalizePlan(localStorage.getItem(STORAGE_KEY_PLAN)),
  );
  const [interviewCount, setInterviewCount] = useState(0);
  const [loading] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
      const hasToken = Boolean(localStorage.getItem("token"));
      if (!hasToken) {
        localStorage.removeItem(STORAGE_KEY_PLAN);
        setPlan(null);
        setInterviewCount(0);
        return;
      }

      setPlan(normalizePlan(localStorage.getItem(STORAGE_KEY_PLAN)));
    };

    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  const canStartInterview = useCallback(() => true, []);

  const incrementInterviewCount = useCallback(() => {
    // Access control is backend-driven by start-interview.
  }, []);

  const getRemainingInterviews = useCallback(() => null, []);

  const hasReachedLimit = useCallback(() => false, []);

  const syncWithBackend = useCallback(async (payload) => {
    const normalized =
      typeof payload === "string"
        ? payload.trim().toLowerCase()
        : typeof payload?.data === "string"
        ? payload.data.trim().toLowerCase()
        : null;

    if (normalized === "freetrial") {
      localStorage.setItem(STORAGE_KEY_PLAN, PLAN.FREE);
      setPlan(PLAN.FREE);
      return { plan: PLAN.FREE };
    }

    // Never infer PRO from interview/session runtime payload.
    // Only update cached plan when backend explicitly returns a plan signal.
    const resolvedPlan =
      payload && typeof payload === "object" ? resolvePlanFromData(payload) : null;
    if (resolvedPlan === PLAN.FREE || resolvedPlan === PLAN.PRO) {
      localStorage.setItem(STORAGE_KEY_PLAN, resolvedPlan);
      setPlan(resolvedPlan);
      return { plan: resolvedPlan };
    }

    return { plan: normalizePlan(localStorage.getItem(STORAGE_KEY_PLAN)) };
  }, []);

  const refreshFromBackend = useCallback(async () => {
    // Backend has no stable public license/profile status endpoint.
    // start-interview remains the source of truth.
    return {
      payload: null,
      plan: normalizePlan(localStorage.getItem(STORAGE_KEY_PLAN)),
    };
  }, []);

  const upgradeToPro = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_PLAN, PLAN.PRO);
    setPlan(PLAN.PRO);
  }, []);

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
