import { useState, useEffect, useCallback } from "react";

export const useUsageLimit = () => {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true);

      // TODO: Replace with real API when backend provides it
      // const response = await paymentAPI.getUsage();
      // const data = response.data?.data ?? response.data;

      const mockUsage = {
        used: 7,
        total: 10,
        resetDate: "2026-02-01",
      };

      setUsage(mockUsage);
      setHasReachedLimit(mockUsage.used >= mockUsage.total);
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const checkLimit = () => {
    if (!usage) return false;
    return usage.used >= usage.total;
  };

  const getRemainingInterviews = () => {
    if (!usage) return 0;
    return Math.max(0, usage.total - usage.used);
  };

  const getUsagePercentage = () => {
    if (!usage || usage.total === 0) return 0;
    return (usage.used / usage.total) * 100;
  };

  const refreshUsage = () => {
    fetchUsage();
  };

  return {
    usage,
    loading,
    hasReachedLimit,
    checkLimit,
    getRemainingInterviews,
    getUsagePercentage,
    refreshUsage,
  };
};
