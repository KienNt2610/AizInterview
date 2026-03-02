import { useState, useEffect, useCallback } from "react";

const FREE_LIMIT = 1;
const STORAGE_KEY_PLAN = "userPlan";
const STORAGE_KEY_INTERVIEW_COUNT = "interviewCount";
const STORAGE_KEY_USER_EMAIL = "userPlanEmail"; // Store email associated with plan

/**
 * Hook to manage user plan (FREE/PRO) and interview count
 * - Default: plan="FREE", interviewCount=0
 * - FREE users: max 1 interview (1 free trial)
 * - PRO users: unlimited interviews
 * - When user logs in again (if not PRO), reset to FREE with 0 interviews (1 free trial)
 */
export const useUserPlan = () => {
  const [plan, setPlan] = useState("FREE");
  const [interviewCount, setInterviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedPlan = localStorage.getItem(STORAGE_KEY_PLAN);
      const storedCount = localStorage.getItem(STORAGE_KEY_INTERVIEW_COUNT);
      
      // Safely parse user from localStorage
      let currentUserEmail = null;
      try {
        const currentUser = localStorage.getItem("user");
        if (currentUser) {
          const userObj = JSON.parse(currentUser);
          currentUserEmail = userObj?.email || null;
        }
      } catch (e) {
        // Invalid user data, ignore
        console.warn("[useUserPlan] Failed to parse user from localStorage:", e);
      }

      // Check if plan data belongs to current user by checking if user exists
      // If no user logged in, reset to defaults
      if (!currentUserEmail) {
        console.log("[useUserPlan] No user logged in, resetting to defaults");
        setPlan("FREE");
        setInterviewCount(0);
        localStorage.setItem(STORAGE_KEY_PLAN, "FREE");
        localStorage.setItem(STORAGE_KEY_INTERVIEW_COUNT, "0");
        setLoading(false);
        return;
      }

      // Check if email matches stored email
      const storedEmail = localStorage.getItem(STORAGE_KEY_USER_EMAIL);
      const isDifferentEmail = storedEmail && storedEmail !== currentUserEmail;
      
      // If email changed, reset to defaults (new user)
      if (isDifferentEmail) {
        console.log("[useUserPlan] Email changed from", storedEmail, "to", currentUserEmail, "- resetting to defaults");
        setPlan("FREE");
        setInterviewCount(0);
        localStorage.setItem(STORAGE_KEY_PLAN, "FREE");
        localStorage.setItem(STORAGE_KEY_INTERVIEW_COUNT, "0");
        localStorage.setItem(STORAGE_KEY_USER_EMAIL, currentUserEmail);
        setLoading(false);
        return;
      }
      
      // If we have stored plan, use it
      if (storedPlan === "PRO" || storedPlan === "FREE") {
        setPlan(storedPlan);
      } else {
        // Default for new users
        console.log("[useUserPlan] No stored plan found, defaulting to FREE");
        setPlan("FREE");
        localStorage.setItem(STORAGE_KEY_PLAN, "FREE");
      }

      let count = storedCount ? parseInt(storedCount, 10) : 0;
      if (isNaN(count) || count < 0) {
        count = 0;
      }
      
      // CRITICAL: For FREE plan, count can be 0 (can start) or 1 (used up, blocked)
      // Only reset if count > FREE_LIMIT (invalid state, should never happen)
      if (storedPlan === "FREE" && count > FREE_LIMIT) {
        console.warn("[useUserPlan] Invalid interviewCount detected:", count, "for FREE plan (should be 0-1), resetting to 0");
        count = 0;
        localStorage.setItem(STORAGE_KEY_INTERVIEW_COUNT, "0");
      }
      // If count === FREE_LIMIT (1), that's valid - user has used up their free interview
      
      // Store email if not already stored
      if (!storedEmail && currentUserEmail) {
        localStorage.setItem(STORAGE_KEY_USER_EMAIL, currentUserEmail);
      }
      
      console.log("[useUserPlan] Loaded plan:", storedPlan || "FREE", "interviewCount:", count, "for user:", currentUserEmail);
      setInterviewCount(count);
    } catch (error) {
      console.error("Failed to load user plan from localStorage:", error);
      setPlan("FREE");
      setInterviewCount(0);
      // Reset localStorage on error
      localStorage.setItem(STORAGE_KEY_PLAN, "FREE");
      localStorage.setItem(STORAGE_KEY_INTERVIEW_COUNT, "0");
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for auth-change events (login/logout) to reset state
  useEffect(() => {
    const handleAuthChange = () => {
      const token = localStorage.getItem("token");
      const currentUser = localStorage.getItem("user");
      
      if (!token) {
        // User logged out - keep plan data in localStorage for next login with same email
        // Don't reset interviewCount, it will be preserved for same email
        console.log("[useUserPlan] User logged out, keeping plan data in localStorage for next login");
        // Just update state to FREE (but keep localStorage values)
        setPlan("FREE");
        // Don't reset interviewCount state - it will be loaded from localStorage on next login
        // Don't clear localStorage - preserve for same email login
      } else if (currentUser) {
        // User logged in - check if email changed
        try {
          // Parse current user email
          let currentUserEmail = null;
          try {
            const userObj = JSON.parse(currentUser);
            currentUserEmail = userObj?.email || null;
          } catch (e) {
            console.warn("[useUserPlan] Failed to parse user from localStorage:", e);
          }
          
          const storedPlan = localStorage.getItem(STORAGE_KEY_PLAN);
          const storedEmail = localStorage.getItem(STORAGE_KEY_USER_EMAIL);
          
          // Check if this is a different email (new user or different account)
          const isDifferentEmail = storedEmail && currentUserEmail && storedEmail !== currentUserEmail;
          
          if (storedPlan === "PRO") {
            // PRO users keep their status regardless of email
            const storedCount = localStorage.getItem(STORAGE_KEY_INTERVIEW_COUNT);
            let count = storedCount ? parseInt(storedCount, 10) : 0;
            if (isNaN(count) || count < 0) {
              count = 0;
            }
            setPlan("PRO");
            setInterviewCount(count);
            // Update email if changed
            if (isDifferentEmail) {
              localStorage.setItem(STORAGE_KEY_USER_EMAIL, currentUserEmail);
            }
            console.log("[useUserPlan] Auth change: PRO user, keeping plan and count:", count);
          } else {
            // FREE users: only reset if email changed (different user)
            if (isDifferentEmail) {
              // Different email = new user, reset to 0 interviews (1 free trial)
              console.log("[useUserPlan] Auth change: Different email detected, resetting to FREE with 0 interviews (1 free trial)");
              setPlan("FREE");
              setInterviewCount(0);
              localStorage.setItem(STORAGE_KEY_PLAN, "FREE");
              localStorage.setItem(STORAGE_KEY_INTERVIEW_COUNT, "0");
              localStorage.setItem(STORAGE_KEY_USER_EMAIL, currentUserEmail);
            } else {
              // Same email = existing user, keep current state (including if they've used up their free interview)
              const storedCount = localStorage.getItem(STORAGE_KEY_INTERVIEW_COUNT);
              let count = storedCount ? parseInt(storedCount, 10) : 0;
              if (isNaN(count) || count < 0) {
                count = 0;
              }
              // Only reset if count exceeds limit (invalid state, should never happen)
              // If count === FREE_LIMIT (1), that's valid - user has used up their free interview
              if (count > FREE_LIMIT) {
                console.log("[useUserPlan] Auth change: Invalid count detected (>1), resetting to 0");
                count = 0;
                localStorage.setItem(STORAGE_KEY_INTERVIEW_COUNT, "0");
              }
              setPlan("FREE");
              setInterviewCount(count);
              // Update email if not stored
              if (!storedEmail) {
                localStorage.setItem(STORAGE_KEY_USER_EMAIL, currentUserEmail);
              }
              console.log("[useUserPlan] Auth change: Same email, keeping FREE plan and count:", count);
            }
          }
        } catch (e) {
          console.error("[useUserPlan] Failed to reload on auth change:", e);
          // On error, reset to defaults
          setPlan("FREE");
          setInterviewCount(0);
          localStorage.setItem(STORAGE_KEY_PLAN, "FREE");
          localStorage.setItem(STORAGE_KEY_INTERVIEW_COUNT, "0");
          if (currentUserEmail) {
            localStorage.setItem(STORAGE_KEY_USER_EMAIL, currentUserEmail);
          }
        }
      }
    };

    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  // Check if user can start interview
  const canStartInterview = useCallback(() => {
    if (plan === "PRO") {
      console.log("[useUserPlan] canStartInterview: PRO plan, allowed");
      return true;
    }
    if (plan === "FREE") {
      const canStart = interviewCount < FREE_LIMIT;
      console.log("[useUserPlan] canStartInterview: FREE plan, interviewCount:", interviewCount, "/", FREE_LIMIT, "->", canStart);
      return canStart;
    }
    console.log("[useUserPlan] canStartInterview: Unknown plan:", plan);
    return false;
  }, [plan, interviewCount]);

  // Increment interview count (only for FREE users)
  const incrementInterviewCount = useCallback(() => {
    if (plan === "FREE") {
      const newCount = interviewCount + 1;
      setInterviewCount(newCount);
      localStorage.setItem(STORAGE_KEY_INTERVIEW_COUNT, String(newCount));
      // Ensure email is stored
      try {
        const currentUser = localStorage.getItem("user");
        if (currentUser) {
          const userObj = JSON.parse(currentUser);
          const email = userObj?.email;
          if (email) {
            localStorage.setItem(STORAGE_KEY_USER_EMAIL, email);
          }
        }
      } catch (e) {
        // Ignore
      }
    }
  }, [plan, interviewCount]);

  // Update plan to PRO (after payment)
  const upgradeToPro = useCallback(() => {
    setPlan("PRO");
    localStorage.setItem(STORAGE_KEY_PLAN, "PRO");
    // Reset interview count when upgrading
    setInterviewCount(0);
    localStorage.setItem(STORAGE_KEY_INTERVIEW_COUNT, "0");
    // Store current user email
    try {
      const currentUser = localStorage.getItem("user");
      if (currentUser) {
        const userObj = JSON.parse(currentUser);
        const email = userObj?.email;
        if (email) {
          localStorage.setItem(STORAGE_KEY_USER_EMAIL, email);
        }
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  // Get remaining interviews for FREE users
  const getRemainingInterviews = useCallback(() => {
    if (plan === "PRO") return "unlimited";
    return Math.max(0, FREE_LIMIT - interviewCount);
  }, [plan, interviewCount]);

  // Check if user has reached limit
  const hasReachedLimit = useCallback(() => {
    if (plan === "PRO") return false;
    return interviewCount >= FREE_LIMIT;
  }, [plan, interviewCount]);

  // Sync with user data (for future use if backend endpoint is added)
  const syncWithBackend = useCallback(async (userData) => {
    try {
      // If backend returns plan, use it
      if (userData?.plan === "PRO" || userData?.plan === "FREE") {
        console.log("[useUserPlan] Syncing plan from userData:", userData.plan);
        setPlan(userData.plan);
        localStorage.setItem(STORAGE_KEY_PLAN, userData.plan);
      }
      // If backend returns interviewCount, use it (with validation)
      if (typeof userData?.interviewCount === "number" && userData.interviewCount >= 0) {
        // If plan is FREE, ensure interviewCount doesn't exceed limit
        const count = userData.plan === "FREE" ? Math.min(userData.interviewCount, FREE_LIMIT) : userData.interviewCount;
        console.log("[useUserPlan] Syncing interviewCount from userData:", userData.interviewCount, "-> using:", count);
        setInterviewCount(count);
        localStorage.setItem(STORAGE_KEY_INTERVIEW_COUNT, String(count));
      } else if (userData?.plan === "FREE") {
        // If backend doesn't return interviewCount but plan is FREE, default to 0
        console.log("[useUserPlan] No interviewCount from backend, defaulting to 0 for FREE plan");
        setInterviewCount(0);
        localStorage.setItem(STORAGE_KEY_INTERVIEW_COUNT, "0");
      }
    } catch (error) {
      console.error("Failed to sync user plan:", error);
    }
  }, []);

  // Manual refresh (placeholder for future backend integration)
  const refreshFromBackend = useCallback(async () => {
    // No-op: endpoint doesn't exist, using local state only
    console.log("[useUserPlan] refreshFromBackend called but endpoint not available, using local state");
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
