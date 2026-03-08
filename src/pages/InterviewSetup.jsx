import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video,
  Briefcase,
  ArrowRight,
  AlertCircle,
  CreditCard,
  RefreshCcw,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import { jobAPI, interviewSessionAPI, aiInterviewAPI } from "../services/api";
// Removed useUsageLimit - using useUserPlan instead
// import { useUsageLimit } from "../hooks/useUsageLimit";
import { useUserPlan } from "../hooks/useUserPlan";
import UpgradeModal from "../components/UpgradeModal";
import { extractAudioBase64 } from "../utils/aiAudio";
import { unlockTTS } from "../utils/tts";

const InterviewSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  // Removed useUsageLimit - using useUserPlan instead
  // const { hasReachedLimit, getRemainingInterviews, usage } = useUsageLimit();
  const {
    plan,
    interviewCount,
    canStartInterview,
    incrementInterviewCount,
    hasReachedLimit: hasReachedFreeLimit,
  } = useUserPlan();

  const [loading, setLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobsError, setJobsError] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [jobDescriptionId, setJobDescriptionId] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setJobsError("");
    setLoadingJobs(true);

    try {
      const res = await jobAPI.getAll();

      // Backend có thể trả { data: [], isSuccess: true, error: null }
      const payload = res.data?.data ?? res.data;

      const list = Array.isArray(payload)
        ? payload
        : payload?.items ?? payload?.results ?? [];

      setJobs(list);

      if (list.length > 0) {
        const first = list[0];
        const firstId =
          first.jobDescriptionId ?? first.id ?? first.jobId ?? first.Id;

        if (firstId) {
          setJobDescriptionId(String(firstId));
        }
      }
    } catch (err) {
      console.error("Failed to fetch JobDescription:", err);
      setJobs([]);
      setJobsError(
        err?.response?.data?.message ||
          "Không tải được JobDescription. Hãy kiểm tra backend/DB (API /api/JobDescription)."
      );
    } finally {
      setLoadingJobs(false);
    }
  };

  // Map đúng theo DB: Id, Sector, Level, Description, roleId
  const positionCards = useMemo(() => {
    return (jobs || []).map((j) => {
      const id =
        j.jobDescriptionId ?? j.id ?? j.jobId ?? j.Id ?? j.ID ?? j.JobDescriptionId;

      const sector = j.sector ?? j.Sector ?? "";
      const level = j.level ?? j.Level ?? "";
      const desc = j.description ?? j.Description ?? j.summary ?? j.shortDescription ?? "";
      
      // Extract roleId (required by AI API)
      const roleId = j.roleId ?? j.role_id ?? j.RoleId ?? j.roleID ?? null;

      // label ưu tiên theo DB, fallback nếu backend đổi field
      const label =
        (sector || level)
          ? `${sector}${level ? ` - ${level}` : ""}`
          : (j.title ?? j.jobTitle ?? j.name ?? "Job");

      return {
        id: String(id),
        label,
        description: desc || " ",
        roleId: roleId ? String(roleId) : null, // Required by AI API
        raw: j,
      };
    })
    // lọc bỏ record không có id (tránh crash)
    .filter((x) => x.id && x.id !== "undefined" && x.id !== "null");
  }, [jobs]);

  const selectedJob = useMemo(() => {
    if (!jobDescriptionId) return null;
    return positionCards.find((x) => x.id === jobDescriptionId) || null;
  }, [jobDescriptionId, positionCards]);

  // Debug: Log button disabled conditions
  useEffect(() => {
    const canStart = canStartInterview();
    const hasReachedLimit = hasReachedFreeLimit();
    const disabledConditions = {
      loading,
      hasReachedFreeLimit: hasReachedLimit,
      cannotStart: !canStart,
      loadingJobs,
      noJobs: positionCards.length === 0,
      noJobSelected: !jobDescriptionId,
    };
    
    const buttonDisabled = Object.values(disabledConditions).some(v => v === true);
    
    console.log("[InterviewSetup] Button state check:", {
      plan,
      interviewCount,
      canStartInterview: canStart,
      hasReachedFreeLimit: hasReachedLimit,
      loading,
      loadingJobs,
      positionCardsLength: positionCards.length,
      jobDescriptionId,
      buttonDisabled,
      disabledConditions,
      // Show which specific condition is causing the button to be disabled
      disabledReason: Object.entries(disabledConditions)
        .filter(([, value]) => value === true)
        .map(([key]) => key)
        .join(", ") || "NONE (button should be enabled)",
    });
  }, [plan, interviewCount, canStartInterview, hasReachedFreeLimit, loading, loadingJobs, positionCards.length, jobDescriptionId]);

  const handleStartInterview = async (retryOrEvent = false) => {
    const isRetry = retryOrEvent === true;
    console.log("=== handleStartInterview CALLED ===");
    console.log("Current state:", {
      isRetry,
      plan,
      interviewCount,
      canStartInterview: canStartInterview(),
      hasReachedFreeLimit: hasReachedFreeLimit(),
      loading,
      loadingJobs,
      positionCardsLength: positionCards.length,
      jobDescriptionId,
      selectedJob,
    });
    
    if (!jobDescriptionId) {
      console.warn("[handleStartInterview] No jobDescriptionId selected");
      toast("Vui lòng chọn Job Description (từ backend).", { type: "warning" });
      return;
    }

    // Check plan and interview count before starting
    if (!canStartInterview()) {
      console.warn("[handleStartInterview] Cannot start interview - showing upgrade modal");
      setShowUpgradeModal(true);
      return;
    }

    // Unlock TTS via user gesture (for fallback when AI audio not available)
    unlockTTS();

    setLoading(true);

    try {
      // Debug log before API call
      const id = Number(jobDescriptionId);
      console.log("=== START INTERVIEW DEBUG ===");
      console.log("jobDescriptionId (string):", jobDescriptionId);
      console.log("jobDescriptionId (number):", id);
      console.log("jobDescriptionId type:", typeof id);
      console.log("selectedJob:", selectedJob);
      console.log("token exists:", !!localStorage.getItem("token"));
      console.log("refreshToken exists:", !!localStorage.getItem("refreshToken"));

      // 1. Call BE to start interview session
      const res = await interviewSessionAPI.start(id);
      
      console.log("=== START INTERVIEW SUCCESS ===");
      console.log("Response status:", res.status);
      console.log("Response data:", res.data);
      
      const payload = res.data?.data ?? res.data;

      const sessionId =
        payload?.interviewSessionId ?? payload?.sessionId ?? payload?.id ?? payload;

      console.log("Extracted sessionId:", sessionId);

      if (!sessionId) {
        console.error("SessionId is missing in response:", payload);
        toast("Start interview succeeded but sessionId is missing.", { type: "error" });
        setLoading(false);
        return;
      }

      // 2. Validate roleId from selectedJob
      if (!selectedJob?.roleId) {
        console.error("roleId is missing in selectedJob:", selectedJob);
        toast("Job Description is missing roleId. Please contact support.", { type: "error" });
        setLoading(false);
        return;
      }

      // 3. Call AI API to start interview and get first question
      console.log("=== CALLING AI /api/start ===");
      console.log("AI API payload:", {
        role_id: selectedJob.roleId,
        mode: "simulation",
      });
      
      let aiRes;
      let aiPayload;
      try {
        aiRes = await aiInterviewAPI.start({
          role_id: selectedJob.roleId,
          mode: "simulation",
        });
        
        console.log("AI start response:", aiRes.data);
        aiPayload = aiRes.data?.data ?? aiRes.data;
        
        // Extract AI response data
        const currentQuestionId = aiPayload?.current_question_id ?? aiPayload?.questionId ?? aiPayload?.question?.id ?? null;
        const currentTopic = aiPayload?.current_topic ?? aiPayload?.topic ?? null;
        const currentDifficulty = aiPayload?.current_difficulty ?? aiPayload?.difficulty ?? 'intermediate';
        const askedIds = aiPayload?.asked_ids ?? aiPayload?.askedIds ?? [];
        const displayText = aiPayload?.display_text ?? aiPayload?.displayText ?? aiPayload?.question?.text ?? aiPayload?.question ?? '';
        const turnIndex = aiPayload?.turnIndex ?? 1;
        const mode = aiPayload?.mode ?? "simulation";

        console.log("=== AI RESPONSE PARSED ===");
        console.log("current_question_id:", currentQuestionId);
        console.log("current_topic:", currentTopic);
        console.log("current_difficulty:", currentDifficulty);
        console.log("asked_ids:", askedIds);
        console.log("display_text:", displayText);
        console.log("turnIndex:", turnIndex);

        // Extract audio_base64 from AI response (flexible location)
        const audioBase64 = extractAudioBase64(aiPayload) || extractAudioBase64({ question: aiPayload?.question });
        if (audioBase64) {
          console.log("[AI VOICE] Found audio_base64 for first question");
        } else {
          console.log("[AI VOICE] no audio_base64, fallback");
        }

        // Note: TTS will be handled in InterviewSession after hydration (not here to avoid cancel on navigate)

        // Save interview context to localStorage with AI state
        const interviewContext = {
          interviewSessionId: String(sessionId),
          jobDescriptionId: String(jobDescriptionId),
          jobTitle: selectedJob?.label ?? "",
          roleId: selectedJob.roleId,
          createdAt: new Date().toISOString(),
          // AI state
          current_question_id: currentQuestionId,
          current_topic: currentTopic,
          current_difficulty: currentDifficulty,
          asked_ids: askedIds,
          turnIndex: turnIndex,
          mode: mode,
          // First question display text
          currentQuestionText: displayText,
          // First question audio (if available)
          currentQuestionAudioBase64: audioBase64 || null,
        };

        localStorage.setItem("interviewContext", JSON.stringify(interviewContext));
        console.log("Saved interviewContext with AI state:", interviewContext);

        // Increment interview count for FREE users (before navigation)
        if (plan === "FREE") {
          incrementInterviewCount();
        }

        toast("Interview created successfully!", { type: "success" });
        
        // Navigate to interview session page
        const navigatePath = `/interview/${sessionId}/session`;
        console.log("Navigating to:", navigatePath);
        navigate(navigatePath);
      } catch (aiError) {
        // AI API failed - log but don't block navigation
        console.error("=== AI API ERROR ===");
        console.error("AI API failed:", aiError);
        console.error("AI Error response:", aiError.response?.data);
        console.error("AI Error status:", aiError.response?.status);
        
        // Show error toast but still navigate (backend session is created)
        toast("AI service unavailable. Interview session created but AI features may be limited.", { type: "warning" });
        
        // Save minimal context without AI state
        const interviewContext = {
          interviewSessionId: String(sessionId),
          jobDescriptionId: String(jobDescriptionId),
          jobTitle: selectedJob?.label ?? "",
          roleId: selectedJob.roleId,
          createdAt: new Date().toISOString(),
          // No AI state - will need to retry in session page
          aiError: true,
        };

        localStorage.setItem("interviewContext", JSON.stringify(interviewContext));
        
        // Still navigate - user can retry AI in session page
        const navigatePath = `/interview/${sessionId}/session`;
        console.log("Navigating to session despite AI error:", navigatePath);
        navigate(navigatePath);
      }
    } catch (error) {
      // Enhanced error logging
      console.error("=== START INTERVIEW ERROR ===");
      console.error("Error type:", error.constructor.name);
      console.error("Status:", error.response?.status);
      console.error("Status Text:", error.response?.statusText);
      console.error("Error Data (JSON):", JSON.stringify(error.response?.data, null, 2));
      console.error("Error Data (raw):", error.response?.data);
      console.error("Request URL:", error.config?.url);
      console.error("Full Request URL:", `${error.config?.baseURL}${error.config?.url}`);
      console.error("Request Params:", error.config?.params);
      console.error("Request Data:", error.config?.data);
      console.error("Request Headers:", error.config?.headers);
      console.error("Request Method:", error.config?.method);
      console.error("Is Retry:", error.config?._retry);
      console.error("Full Error:", error);

      const data = error.response?.data;
      
      // Parse error message from different response structures
      let errorMessage = null;
      let errorCode = null;
      
      // Structure 1: { error: { message: "...", code: "..." } }
      if (data?.error?.message) {
        errorMessage = data.error.message;
        errorCode = data.error.code;
      }
      // Structure 2: { message: "..." }
      else if (data?.message) {
        errorMessage = data.message;
      }
      // Structure 3: Validation errors
      else if (data?.errors) {
        errorMessage = Object.values(data.errors).flat().join(" | ");
      }
      // Structure 4: { title: "..." }
      else if (data?.title) {
        errorMessage = data.title;
      }
      // Structure 5: String response
      else if (typeof data === "string") {
        errorMessage = data;
      }
      // Fallback
      else {
        errorMessage = `Failed to create interview (Status: ${error.response?.status || "Network Error"})`;
      }

      console.log("Parsed error message:", errorMessage);
      console.log("Error code:", errorCode);
      
      // Handle specific error codes
      if (errorCode === "LICENSE_INVALID" || errorMessage?.toLowerCase().includes("license")) {
        const isFirstFreeAttempt = plan === "FREE" && interviewCount < 1;

        if (isFirstFreeAttempt) {
          const localSessionId = `demo-${Date.now()}`;
          try {
            const aiRes = await aiInterviewAPI.start({
              role_id: selectedJob?.roleId,
              mode: "simulation",
            });
            const aiPayload = aiRes.data?.data ?? aiRes.data;
            const currentQuestionId =
              aiPayload?.current_question_id ?? aiPayload?.questionId ?? aiPayload?.question?.id ?? null;
            const currentTopic = aiPayload?.current_topic ?? aiPayload?.topic ?? null;
            const currentDifficulty = aiPayload?.current_difficulty ?? aiPayload?.difficulty ?? "intermediate";
            const askedIds = aiPayload?.asked_ids ?? aiPayload?.askedIds ?? [];
            const displayText =
              aiPayload?.display_text ??
              aiPayload?.displayText ??
              aiPayload?.question?.text ??
              aiPayload?.question ??
              "";
            const audioBase64 =
              extractAudioBase64(aiPayload) || extractAudioBase64({ question: aiPayload?.question });

            localStorage.setItem(
              "interviewContext",
              JSON.stringify({
                interviewSessionId: String(localSessionId),
                jobDescriptionId: String(jobDescriptionId),
                jobTitle: selectedJob?.label ?? "",
                roleId: selectedJob?.roleId ?? null,
                createdAt: new Date().toISOString(),
                current_question_id: currentQuestionId,
                current_topic: currentTopic,
                current_difficulty: currentDifficulty,
                asked_ids: askedIds,
                turnIndex: 1,
                mode: "simulation",
                currentQuestionText: displayText,
                currentQuestionAudioBase64: audioBase64 || null,
                isLocalDemo: true,
              }),
            );
          } catch (aiError) {
            console.error("Failed to init local demo AI question:", aiError);
            localStorage.setItem(
              "interviewContext",
              JSON.stringify({
                interviewSessionId: String(localSessionId),
                jobDescriptionId: String(jobDescriptionId),
                jobTitle: selectedJob?.label ?? "",
                roleId: selectedJob?.roleId ?? null,
                createdAt: new Date().toISOString(),
                mode: "simulation",
                aiError: true,
                isLocalDemo: true,
              }),
            );
          }

          incrementInterviewCount();
          navigate(`/interview/${localSessionId}/session`);
        } else {
          toast(errorMessage, { type: "error" });
          setTimeout(() => {
            navigate("/payment");
          }, 1500);
        }
      } else {
        toast(errorMessage, { type: "error" });
      }
      
      // CRITICAL: Always set loading to false in catch block as well
      // This ensures UI never gets stuck even if finally block fails
      setLoading(false);
      console.log("=== START INTERVIEW ERROR HANDLED ===");
      console.log("Loading set to false in catch block");
    } finally {
      // Always set loading to false to prevent UI stuck
      // This is a safety net in case catch block doesn't execute
      setLoading(false);
      console.log("=== START INTERVIEW FINALLY ===");
      console.log("Loading set to false in finally block");
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {hasReachedFreeLimit() && plan === "FREE" && interviewCount >= 1 && (
        <Card className="border-2 border-red-500/30 bg-red-900/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-red-900/30 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-400 text-lg mb-2">Đã đạt giới hạn phỏng vấn</h3>
                <p className="text-red-300 mb-4">
                  Bạn đã sử dụng hết 1 lượt phỏng vấn miễn phí. Vui lòng nâng cấp gói PRO để tiếp tục luyện tập.
                </p>
                <Button
                  variant="danger"
                  onClick={() => navigate("/payment?plan=Pro&price=99")}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Nâng cấp gói PRO
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Thiết lập phỏng vấn của bạn</h1>
        <p className="text-[#C5C6C7] mt-2 text-sm sm:text-base">
          Chọn vị trí công việc và bắt đầu phiên phỏng vấn của bạn
          {plan === "FREE" && interviewCount < 1 && (
            <span className="block mt-1 text-[#66FCF1] font-medium">
              Bạn còn {1 - interviewCount}/1 lượt phỏng vấn miễn phí
            </span>
          )}
          {plan === "PRO" && (
            <span className="block mt-1 text-[#66FCF1] font-medium">
              PRO - phỏng vấn không giới hạn
            </span>
          )}
        </p>
      </div>

      {jobsError && (
        <Card className="border border-yellow-500/30 bg-yellow-900/20">
          <CardContent className="p-4 flex items-start justify-between gap-4">
            <div className="text-sm text-yellow-200">
              <div className="font-semibold text-yellow-100 mb-1">Tải danh sách công việc thất bại</div>
              <div>{jobsError}</div>
            </div>
            <Button
              variant="outline"
              onClick={fetchJobs}
              disabled={loadingJobs}
              className="border-yellow-400/30 text-yellow-200 hover:bg-yellow-500/10"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Thử lại
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#66FCF1]" />
            <CardTitle>Chọn mô tả công việc</CardTitle>
          </div>
          <CardDescription>
            Chọn công việc từ backend (JobDescription)
            {loadingJobs ? " • Đang tải..." : ""}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loadingJobs ? (
            <div className="text-[#C5C6C7] text-sm">Đang tải danh sách công việc...</div>
          ) : positionCards.length === 0 ? (
            <div className="text-[#C5C6C7] text-sm">
              Không có JobDescription. Hãy kiểm tra API /api/JobDescription và DB.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {positionCards.map((job) => (
                <button
                  key={job.id}
                  onClick={() => setJobDescriptionId(job.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                    jobDescriptionId === job.id
                      ? "border-[#66FCF1] bg-[#66FCF1]/10 shadow-md glow-border"
                      : "border-[#1F2833] hover:border-[#66FCF1]/50 hover:bg-[#1F2833]/50 hover:shadow-sm"
                  }`}
                >
                  <h3 className="font-semibold text-white">{job.label}</h3>
                  <p className="text-sm text-[#C5C6C7] mt-1 line-clamp-3">{job.description}</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-[#66FCF1]/10 to-[#45A29E]/10 border-[#66FCF1]/30 glow-border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-white text-lg">Sẵn sàng bắt đầu?</h3>
              <p className="text-sm text-[#C5C6C7] mt-1">
                Đảm bảo bạn đang ở môi trường yên tĩnh với microphone hoạt động tốt
              </p>
              {selectedJob?.label && (
                <p className="text-sm mt-2 text-[#66FCF1]">
                  Đã chọn: <span className="font-semibold">{selectedJob.label}</span>
                </p>
              )}
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                void handleStartInterview();
              }}
              disabled={
                loading ||
                hasReachedFreeLimit() ||
                !canStartInterview() ||
                loadingJobs ||
                positionCards.length === 0 ||
                !jobDescriptionId
              }
              className="flex items-center gap-2 bg-[#66FCF1] hover:bg-[#45A29E] text-[#0B0C10] glow-primary-hover"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  Bắt đầu phỏng vấn
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
};

export default InterviewSetup;
