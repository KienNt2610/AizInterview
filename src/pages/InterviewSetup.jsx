import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Video, Briefcase, ArrowRight, RefreshCcw } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import { jobAPI, interviewSessionAPI, aiInterviewAPI, authAPI } from "../services/api";
import { useUserPlan } from "../hooks/useUserPlan";
import UpgradeModal from "../components/UpgradeModal";
import { extractAudioBase64 } from "../utils/aiAudio";
import { unlockTTS } from "../utils/tts";
import { PLAN, resolvePlanFromData } from "../utils/plan";

const STORAGE_KEY_PENDING_JOB = "pendingStartJobDescriptionId";

const InterviewSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { plan, getRemainingInterviews, syncWithBackend } = useUserPlan();

  const [loading, setLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobsError, setJobsError] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [autoRetryTriggered, setAutoRetryTriggered] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [jobDescriptionId, setJobDescriptionId] = useState("");

  useEffect(() => {
    void fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setJobsError("");
    setLoadingJobs(true);

    try {
      const res = await jobAPI.getAll();
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
          "Failed to load JobDescription. Please verify backend API /api/JobDescription.",
      );
    } finally {
      setLoadingJobs(false);
    }
  };

  const positionCards = useMemo(() => {
    return (jobs || [])
      .map((j) => {
        const id =
          j.jobDescriptionId ?? j.id ?? j.jobId ?? j.Id ?? j.ID ?? j.JobDescriptionId;

        const sector = j.sector ?? j.Sector ?? "";
        const level = j.level ?? j.Level ?? "";
        const desc = j.description ?? j.Description ?? j.summary ?? j.shortDescription ?? "";
        const roleId = j.roleId ?? j.role_id ?? j.RoleId ?? j.roleID ?? null;

        const label =
          sector || level
            ? `${sector}${level ? ` - ${level}` : ""}`
            : j.title ?? j.jobTitle ?? j.name ?? "Job";

        return {
          id: String(id),
          label,
          description: desc || " ",
          roleId: roleId ? String(roleId) : null,
          raw: j,
        };
      })
      .filter((x) => x.id && x.id !== "undefined" && x.id !== "null");
  }, [jobs]);

  const selectedJob = useMemo(() => {
    if (!jobDescriptionId) return null;
    return positionCards.find((x) => x.id === jobDescriptionId) || null;
  }, [jobDescriptionId, positionCards]);

  useEffect(() => {
    if (loadingJobs || positionCards.length === 0) return;
    const pendingJobId = localStorage.getItem(STORAGE_KEY_PENDING_JOB);
    if (!pendingJobId) return;

    const hasPendingJob = positionCards.some((x) => x.id === pendingJobId);
    if (hasPendingJob) {
      setJobDescriptionId(pendingJobId);
    }
  }, [loadingJobs, positionCards]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldRetry = params.get("retryStart") === "1";
    if (!shouldRetry || autoRetryTriggered || loading || loadingJobs) return;
    if (!jobDescriptionId || !selectedJob) return;

    setAutoRetryTriggered(true);
    toast("Retrying start-interview...", { type: "info" });
    void handleStartInterview(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, autoRetryTriggered, loading, loadingJobs, jobDescriptionId, selectedJob]);

  const resolveStartResult = (response) => {
    const payload = response?.data?.data ?? response?.data;
    const root = response?.data;

    const asString = (value) =>
      typeof value === "string" ? value.trim() : "";
    const isFreeTrialMarker = (value) => asString(value).toLowerCase() === "freetrial";

    const explicitMode =
      asString(payload?.licenseType) ||
      asString(payload?.type) ||
      asString(payload?.mode) ||
      asString(payload?.planType) ||
      asString(payload?.plan) ||
      asString(root?.licenseType) ||
      asString(root?.type) ||
      asString(root?.mode) ||
      asString(root?.planType) ||
      asString(root?.plan);

    if (isFreeTrialMarker(explicitMode)) {
      const extractedTrialSessionId =
        payload?.interviewSessionId ??
        payload?.sessionId ??
        payload?.id ??
        root?.interviewSessionId ??
        root?.sessionId ??
        root?.id ??
        `freetrial-${Date.now()}`;
      return { mode: "freetrial", sessionId: String(extractedTrialSessionId) };
    }

    const directString = asString(payload) || asString(root);
    if (isFreeTrialMarker(directString)) {
      return { mode: "freetrial", sessionId: `freetrial-${Date.now()}` };
    }
    if (directString) {
      return { mode: "licensed", sessionId: directString };
    }

    if (payload && typeof payload === "object") {
      const nestedData = asString(payload?.data);
      if (isFreeTrialMarker(nestedData)) {
        return {
          mode: "freetrial",
          sessionId:
            payload?.interviewSessionId ??
            payload?.sessionId ??
            payload?.id ??
            `freetrial-${Date.now()}`,
        };
      }

      const extractedSessionId =
        payload?.interviewSessionId ??
        payload?.sessionId ??
        payload?.id ??
        (nestedData || null);

      if (extractedSessionId) {
        return { mode: "licensed", sessionId: String(extractedSessionId) };
      }
    }

    return { mode: null, sessionId: null };
  };

  const handleStartInterview = async (isRetry = false) => {

    if (!jobDescriptionId) {
      toast("Please select a Job Description.", { type: "warning" });
      return;
    }

    if (!selectedJob?.roleId) {
      toast("Selected Job Description is missing roleId.", { type: "error" });
      return;
    }

    unlockTTS();
    setLoading(true);

    try {
      const id = Number(jobDescriptionId);
      const res = await interviewSessionAPI.start(id);

      const { mode: sessionMode, sessionId } = resolveStartResult(res);
      if (!sessionId) {
        toast("start-interview succeeded but no session id was returned.", { type: "error" });
        return;
      }

      let aiPayload = null;
      try {
        const aiRes = await aiInterviewAPI.start({
          role_id: selectedJob.roleId,
          mode: "simulation",
        });
        aiPayload = aiRes.data?.data ?? aiRes.data;
      } catch (aiError) {
        console.error("AI API failed:", aiError);
      }

      const currentQuestionId =
        aiPayload?.current_question_id ?? aiPayload?.questionId ?? aiPayload?.question?.id ?? null;
      const currentTopic = aiPayload?.current_topic ?? aiPayload?.topic ?? null;
      const currentDifficulty = aiPayload?.current_difficulty ?? aiPayload?.difficulty ?? "intermediate";
      const askedIds = aiPayload?.asked_ids ?? aiPayload?.askedIds ?? [];
      const displayText =
        aiPayload?.display_text ?? aiPayload?.displayText ?? aiPayload?.question?.text ?? aiPayload?.question ?? "";
      const turnIndex = aiPayload?.turnIndex ?? 1;
      const mode = aiPayload?.mode ?? "simulation";
      const audioBase64 =
        extractAudioBase64(aiPayload) || extractAudioBase64({ question: aiPayload?.question });

      const interviewContext = {
        interviewSessionId: String(sessionId),
        jobDescriptionId: String(jobDescriptionId),
        jobTitle: selectedJob?.label ?? "",
        roleId: selectedJob.roleId,
        createdAt: new Date().toISOString(),
        licenseType: sessionMode === "freetrial" ? "freetrial" : null,
        isLocalDemo: sessionMode === "freetrial",
        isTrialMode: sessionMode === "freetrial",
        current_question_id: currentQuestionId,
        current_topic: currentTopic,
        current_difficulty: currentDifficulty,
        asked_ids: askedIds,
        turnIndex,
        mode,
        currentQuestionText: displayText,
        currentQuestionAudioBase64: audioBase64 || null,
        aiError: !aiPayload,
      };

      localStorage.setItem("interviewContext", JSON.stringify(interviewContext));
      localStorage.removeItem(STORAGE_KEY_PENDING_JOB);

      // Keep plan cache in sync only when backend payload explicitly indicates plan/freetrial.
      // Do not infer PRO from successful session creation.
      await syncWithBackend(res?.data?.data ?? res?.data);

      if (sessionMode === "freetrial") {
        toast("Free trial session started.", { type: "info" });
      } else {
        toast("Interview created successfully.", { type: "success" });
      }

      navigate(`/interview/${sessionId}/session`);
    } catch (error) {
      const data = error?.response?.data;
      const errorCode = data?.error?.code ?? null;
      const errorMessage =
        data?.error?.message ??
        data?.message ??
        (typeof data === "string" ? data : "Failed to create interview");

      if (errorCode === "LICENSE_INVALID" || String(errorMessage).toLowerCase().includes("license")) {
        let syncedToPro = false;

        try {
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            const refreshedTokenRes = await authAPI.refresh(refreshToken);
            const tokenPayload = refreshedTokenRes?.data?.data ?? refreshedTokenRes?.data ?? {};

            if (tokenPayload?.accessToken) {
              localStorage.setItem("token", tokenPayload.accessToken);
            }
            if (tokenPayload?.refreshToken) {
              localStorage.setItem("refreshToken", tokenPayload.refreshToken);
            }

            const syncedFromRefresh = await syncWithBackend(tokenPayload);
            const refreshedPlan = syncedFromRefresh?.plan ?? resolvePlanFromData(tokenPayload);
            if (refreshedPlan === PLAN.PRO || localStorage.getItem("userPlan") === PLAN.PRO) {
              syncedToPro = true;
            }
          }
        } catch (syncErr) {
          console.warn("Failed to sync token payload before retry:", syncErr);
        }

        if (syncedToPro && !isRetry) {
          toast("Plan updated to PRO. Retrying start-interview...", { type: "info" });
          setLoading(false);
          await handleStartInterview(true);
          return;
        }

        localStorage.setItem(STORAGE_KEY_PENDING_JOB, String(jobDescriptionId));
        toast(errorMessage, { type: "error" });
        setShowUpgradeModal(true);
      } else {
        toast(errorMessage, { type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <div className="text-center mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Set up your interview</h1>
        <p className="text-[#C5C6C7] mt-2 text-sm sm:text-base">
          Select a job position and start your interview session
          {plan === "FREE" && getRemainingInterviews() !== null && (
            <span className="block mt-1 text-[#66FCF1] font-medium">
              Remaining free interviews: {getRemainingInterviews()}
            </span>
          )}
          {plan === "PRO" && (
            <span className="block mt-1 text-[#66FCF1] font-medium">
              PRO - unlimited interviews
            </span>
          )}
        </p>
      </div>

      {jobsError && (
        <Card className="border border-yellow-500/30 bg-yellow-900/20">
          <CardContent className="p-4 flex items-start justify-between gap-4">
            <div className="text-sm text-yellow-200">
              <div className="font-semibold text-yellow-100 mb-1">Failed to load jobs</div>
              <div>{jobsError}</div>
            </div>
            <Button
              variant="outline"
              onClick={fetchJobs}
              disabled={loadingJobs}
              className="border-yellow-400/30 text-yellow-200 hover:bg-yellow-500/10"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#66FCF1]" />
            <CardTitle>Choose job description</CardTitle>
          </div>
          <CardDescription>
            Select data from backend JobDescription API
            {loadingJobs ? " - loading..." : ""}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loadingJobs ? (
            <div className="text-[#C5C6C7] text-sm">Loading jobs...</div>
          ) : positionCards.length === 0 ? (
            <div className="text-[#C5C6C7] text-sm">
              No JobDescription found. Please check backend API /api/JobDescription.
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
              <h3 className="font-semibold text-white text-lg">Ready to start?</h3>
              <p className="text-sm text-[#C5C6C7] mt-1">
                Make sure you are in a quiet environment and your microphone is working.
              </p>
              {selectedJob?.label && (
                <p className="text-sm mt-2 text-[#66FCF1]">
                  Selected: <span className="font-semibold">{selectedJob.label}</span>
                </p>
              )}
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                void handleStartInterview(false);
              }}
              disabled={loading || loadingJobs || positionCards.length === 0 || !jobDescriptionId}
              className="flex items-center gap-2 bg-[#66FCF1] hover:bg-[#45A29E] text-[#0B0C10] glow-primary-hover"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  Start interview
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



