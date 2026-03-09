import { useMemo } from "react";
import { useUserPlan } from "./useUserPlan";
import { PLAN } from "../utils/plan";

export const useUsageLimit = () => {
  const {
    plan,
    interviewCount,
    loading,
    hasReachedLimit,
    getRemainingInterviews: getRemainingFromPlan,
    refreshFromBackend,
  } =
    useUserPlan();

  const usage = useMemo(() => {
    if (plan === PLAN.PRO) {
      return {
        used: interviewCount,
        total: null,
        resetDate: null,
      };
    }

    const remaining = getRemainingFromPlan();

    return {
      used: interviewCount,
      total: remaining == null ? null : interviewCount + remaining,
      resetDate: null,
    };
  }, [getRemainingFromPlan, interviewCount, plan]);

  const checkLimit = () => {
    return hasReachedLimit();
  };

  const getRemainingInterviews = () => {
    const remaining = usage?.total == null ? null : Math.max(0, usage.total - usage.used);
    return remaining ?? 0;
  };

  const getUsagePercentage = () => {
    if (!usage || usage.total == null || usage.total === 0) return 0;
    return (usage.used / usage.total) * 100;
  };

  const refreshUsage = () => {
    void refreshFromBackend();
  };

  return {
    usage,
    loading,
    hasReachedLimit: hasReachedLimit(),
    checkLimit,
    getRemainingInterviews,
    getUsagePercentage,
    refreshUsage,
  };
};
