import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Home,
  RotateCcw,
  Award,
  BarChart3,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import { interviewSessionAPI } from "../services/api";

const InterviewSummary = () => {
  const { interviewId: sessionId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchInterviewSummary();
    } else {
      setError({
        message: "Invalid interview session ID",
        status: null,
        code: "INVALID_SESSION_ID",
        canRetry: false,
      });
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const fetchInterviewSummary = async (isRetry = false) => {
    try {
      if (isRetry) {
        setRetrying(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Priority 1: Try to load from localStorage runtime data (optional, for current session)
      const runtimeKey = `interviewRuntime:${sessionId}`;
      const runtimeDataStr = localStorage.getItem(runtimeKey);
      let runtimeData = null;
      
      if (runtimeDataStr) {
        try {
          runtimeData = JSON.parse(runtimeDataStr);
          console.log("=== Summary: loaded from runtime localStorage ===");
          console.log("Runtime data:", runtimeData);
        } catch (parseError) {
          console.warn("Failed to parse runtime data from localStorage:", parseError);
        }
      }

      // Priority 2: Try to call BE API to get complete data (works for all sessions)
      let payload = null;
      let beDataAvailable = false;
      
      try {
        const res = await interviewSessionAPI.detail(sessionId);
        
        // Parse response wrapper: { data, error, isSuccess }
        const responseWrapper = res.data;
        const isSuccess = responseWrapper?.isSuccess ?? true;
        const errorData = responseWrapper?.error;
        payload = responseWrapper?.data ?? responseWrapper;

        // Check if API returned an error in the response wrapper
        if (!isSuccess || errorData) {
          console.warn("=== Summary: BE API returned error (non-critical) ===");
          console.warn("Error:", errorData);
          payload = null;
        } else if (payload && typeof payload === "object") {
          beDataAvailable = true;
          console.log("=== Summary: loaded from BE detail ===");
          console.log("BE payload:", payload);
        }
      } catch (beError) {
        console.warn("=== Summary: BE API call failed (non-critical) ===");
        console.warn("BE error:", beError);
        payload = null;
      }

      // Map detail -> summary UI
      // Priority: runtime data with evaluations > BE detail > empty state
      let mapped = null;
      
      if (runtimeData && Array.isArray(runtimeData.evaluations) && runtimeData.evaluations.length > 0) {
        // Use runtime evaluations if available (more complete for current session)
        console.log("=== Summary: using runtime evaluations ===");
        try {
          mapped = mapRuntimeToSummary(runtimeData);
        } catch (mapError) {
          console.warn("Failed to map runtime data:", mapError);
          mapped = null;
        }
      } else if (beDataAvailable && payload) {
        // Use BE detail data
        console.log("=== Summary: using BE detail data ===");
        try {
          mapped = mapDetailToSummary(payload);
        } catch (mapError) {
          console.warn("Failed to map BE detail data:", mapError);
          mapped = null;
        }
      }

      // If questionResults is empty but we have turns, create minimal breakdown
      if (mapped && (!mapped.questionResults || mapped.questionResults.length === 0)) {
        // Try to create minimal breakdown from turns if available
        const turns = payload?.turns ?? payload?.interviewTurns ?? [];
        if (turns.length > 0) {
          mapped.questionResults = turns.map((t, idx) => ({
            id: t?.turnIndex ?? t?.turn ?? idx + 1,
            question: t?.questionText ?? t?.questionContent ?? t?.question ?? `Question ${idx + 1}`,
            userAnswer: t?.userAnswer ?? t?.answerText ?? t?.answer ?? "",
            category: t?.category ?? t?.topic ?? "Interview",
            score: 0,
            feedback: "",
            result: null,
          }));
          // Recalculate overallScore for minimal breakdown
          mapped.overallScore = 0;
        }
      }

      // Fallback: Create empty summary model if no data available
      if (!mapped || !mapped.questionResults || mapped.questionResults.length === 0) {
        console.log("=== Summary: fallback empty state ===");
        
        // Try to load interviewContext for metadata
        let interviewContext = null;
        try {
          const contextStr = localStorage.getItem('interviewContext');
          if (contextStr) {
            interviewContext = JSON.parse(contextStr);
          }
        } catch (parseError) {
          console.warn("Failed to parse interviewContext:", parseError);
        }

        // Create empty summary model
        mapped = {
          overallScore: 0,
          position: interviewContext?.jobTitle || "Interview",
          completedAt: new Date().toISOString(),
          duration: "N/A",
          strengths: [],
          improvements: [],
          questionResults: [],
        };
      }

      setSummary(mapped);
      setError(null);
    } catch (err) {
      // This catch block should rarely be hit now since we handle errors gracefully above
      console.error("=== UNEXPECTED ERROR IN FETCH SUMMARY ===");
      console.error("Error type:", err.constructor.name);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
      
      // Even on unexpected error, try to create empty summary instead of showing error
      console.log("=== Summary: creating empty state due to unexpected error ===");
      
      // Try to load interviewContext for metadata
      let interviewContext = null;
      try {
        const contextStr = localStorage.getItem('interviewContext');
        if (contextStr) {
          interviewContext = JSON.parse(contextStr);
        }
      } catch (parseError) {
        console.warn("Failed to parse interviewContext:", parseError);
      }

      // Create empty summary model
      const emptySummary = {
        overallScore: 0,
        position: interviewContext?.jobTitle || "Interview",
        completedAt: new Date().toISOString(),
        duration: "N/A",
        strengths: [],
        improvements: [],
        questionResults: [],
      };
      
      setSummary(emptySummary);
      setError(null); // Don't show error, show empty state instead
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  const handleRetry = () => {
    fetchInterviewSummary(true);
  };

  const getResultBadge = (result) => {
    if (result === "PASS" || result === "Pass") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          PASS
        </span>
      );
    } else if (result === "FAIL" || result === "Fail") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
          <XCircle className="w-3 h-3" />
          FAIL
        </span>
      );
    }
    return null;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 80) return "bg-green-500/20 border-green-500/30 text-green-400";
    if (score >= 60) return "bg-yellow-500/20 border-yellow-500/30 text-yellow-400";
    return "bg-red-500/20 border-red-500/30 text-red-400";
  };

  if (loading && !retrying) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading interview summary...</p>
        </div>
      </div>
    );
  }

  // Show error state only if we have a critical error AND no summary data
  // (This should rarely happen now since we create empty summary on errors)
  if (error && !summary) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-900 mb-2">
              {error.status === 404 ? "Interview Not Found" : "Failed to Load Interview Summary"}
            </h2>
            <p className="text-red-700 mb-4">{error.message}</p>
            {error.status && (
              <p className="text-sm text-red-600 mb-4">
                Status: {error.status} {error.code && `(${error.code})`}
              </p>
            )}
            {error.url && (
              <p className="text-xs text-red-500 mb-6">
                URL: {error.url}
              </p>
            )}
            {error.canRetry && (
              <Button
                variant="primary"
                onClick={handleRetry}
                disabled={retrying}
                className="flex items-center gap-2 mx-auto"
              >
                {retrying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </>
                )}
              </Button>
            )}
            <div className="mt-6 pt-6 border-t border-red-200">
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 mx-auto"
              >
                <Home className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no summary, show loading (should not happen due to empty state fallback)
  if (!summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading interview summary...</p>
        </div>
      </div>
    );
  }

  // Calculate pass/fail counts with robust normalization
  // Match the same normalization logic used in mapDetailToSummary
  const passCount = summary.questionResults.filter(
    (q) => {
      const r = String(q.result || "").toUpperCase().trim();
      return r === "PASS" || r === "P" || r === "TRUE" || r === "1";
    }
  ).length;
  const failCount = summary.questionResults.filter(
    (q) => {
      const r = String(q.result || "").toUpperCase().trim();
      return r === "FAIL" || r === "F" || r === "FALSE" || r === "0";
    }
  ).length;
  const totalQuestions = summary.questionResults.length;
  

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-full mb-4">
          <Award className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Interview Complete!</h1>
        <p className="text-white mt-2">
          {summary.position || "Interview"} • {summary.duration || "N/A"}
        </p>
        <p className="text-sm text-white mt-1">
          Total Questions: {totalQuestions}
        </p>
      </div>

      {/* Average Score & Pass/Fail Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average Score Card */}
        <Card className="bg-gradient-to-br from-indigo-600/20 to-indigo-500/10 border-2 border-indigo-500/30">
          <CardContent className="p-6 text-center">
            <div className="text-sm text-[#66FCF1] mb-2 font-medium">Average Score</div>
            <div className="text-5xl font-bold text-white mb-1">
              {summary.overallScore ?? 0}
            </div>
            <div className="text-xs text-white/70 mt-1">out of 100</div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-2 border-green-100">
          <CardContent className="p-6 text-center">
            <div className="text-sm text-green-600 mb-2">Passed</div>
            <div className="text-4xl font-bold text-green-700">
              {passCount}
            </div>
            <div className="text-xs text-green-600 mt-1">
              {totalQuestions > 0 ? `${Math.round((passCount / totalQuestions) * 100)}%` : "0%"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-2 border-red-100">
          <CardContent className="p-6 text-center">
            <div className="text-sm text-red-600 mb-2">Failed</div>
            <div className="text-4xl font-bold text-red-700">
              {failCount}
            </div>
            <div className="text-xs text-red-600 mt-1">
              {totalQuestions > 0 ? `${Math.round((failCount / totalQuestions) * 100)}%` : "0%"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strengths and Improvements */}
      {summary.strengths && summary.strengths.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <CardTitle className="text-white">Strengths</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {summary.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-white">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {summary.improvements && summary.improvements.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-yellow-600" />
                  <CardTitle className="text-white">Areas for Improvement</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {summary.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-white">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Question by Question Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <CardTitle>Question-by-Question Breakdown</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {summary.questionResults && summary.questionResults.length > 0 ? (
            <div className="space-y-6">
              {summary.questionResults.map((result, index) => (
              <div key={result.id ?? index} className="border-b border-slate-200 last:border-0 pb-6 last:pb-0">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-700 rounded-full font-semibold text-sm">
                        {index + 1}
                      </span>
                      <h4 className="font-semibold text-white">{result.question}</h4>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                        {result.category || "Interview"}
                      </span>
                      {getResultBadge(result.result)}
                      {result.score !== null && result.score !== undefined && (
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getScoreBadgeColor(result.score)}`}>
                          <Award className="w-3 h-3" />
                          {typeof result.score === "number" ? result.score : parseFloat(result.score) || 0}/100
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* User Answer */}
                {result.userAnswer && (
                  <div className="mb-3 pl-11">
                    <p className="text-xs font-semibold text-white mb-1">Your Answer:</p>
                    <p className="text-white text-sm bg-[#2A3441] p-3 rounded-lg border border-[#3A4551]">
                      {result.userAnswer}
                    </p>
                  </div>
                )}
                
                {/* Evaluation Feedback */}
                {result.feedback && (
                  <div className="pl-11">
                    <p className="text-xs font-semibold text-white mb-1">Feedback:</p>
                    <p className="text-white text-sm">{result.feedback}</p>
                  </div>
                )}
              </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-white text-lg font-medium mb-2">
                Chưa có câu trả lời
              </p>
              <p className="text-white/70 text-sm">
                Bạn đã kết thúc phỏng vấn trước khi trả lời câu hỏi nào.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error banner (if retrying) */}
      {retrying && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-yellow-800">Retrying to fetch interview summary...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4 justify-center pb-8">
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2"
        >
          <Home className="w-5 h-5" />
          Back to Dashboard
        </Button>

        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate("/interview")}
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Practice Again
        </Button>
      </div>
    </div>
  );
};

// ===== Helpers =====
// Map runtime data from localStorage to UI summary format
function mapRuntimeToSummary(runtimeData) {
  if (!runtimeData) {
    throw new Error("Invalid runtime data: runtimeData is missing");
  }
  
  // Allow empty evaluations array (user ended interview early)
  if (!Array.isArray(runtimeData.evaluations)) {
    throw new Error("Invalid runtime data: evaluations is not an array");
  }

  const evaluations = runtimeData.evaluations;
  
  // Sort by turnIndex
  const sortedEvaluations = [...evaluations].sort((a, b) => (a.turnIndex || 0) - (b.turnIndex || 0));
  
  // Map to questionResults format
  const questionResults = sortedEvaluations.map((evaluationItem, idx) => ({
    id: evaluationItem.turnIndex || idx + 1,
    question: evaluationItem.questionText || `Question ${idx + 1}`,
    userAnswer: evaluationItem.userAnswer || '',
    category: evaluationItem.category || 'Interview',
    score: evaluationItem.score || (evaluationItem.result === 'PASS' || evaluationItem.result === 'Pass' ? 75 : evaluationItem.result === 'FAIL' || evaluationItem.result === 'Fail' ? 40 : 0),
    feedback: evaluationItem.feedback || '',
    result: evaluationItem.result || null,
  }));
  
  // Calculate stats
  const passCount = questionResults.filter(q => {
    const r = String(q.result || "").toUpperCase().trim();
    return r === "PASS" || r === "P" || r === "TRUE" || r === "1";
  }).length;
  const failCount = questionResults.filter(q => {
    const r = String(q.result || "").toUpperCase().trim();
    return r === "FAIL" || r === "F" || r === "FALSE" || r === "0";
  }).length;
  const totalQuestions = questionResults.length;
  
  // Calculate overallScore
  const validScores = questionResults
    .map(q => {
      const s = q.score;
      if (typeof s === "number" && !Number.isNaN(s)) return s;
      const parsed = parseFloat(s);
      return !Number.isNaN(parsed) ? parsed : null;
    })
    .filter(s => s !== null && s !== undefined);
  const overallScore = validScores.length > 0
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : totalQuestions > 0 ? Math.round((passCount / totalQuestions) * 100) : 0;
  
  return {
    overallScore,
    position: runtimeData.position || "Interview",
    completedAt: runtimeData.lastUpdated || null,
    duration: runtimeData.duration || "N/A",
    strengths: runtimeData.strengths || [],
    improvements: runtimeData.improvements || [],
    questionResults,
  };
}

// Map detail payload from backend to UI summary format
// NO FALLBACK - only processes real data
function mapDetailToSummary(detail) {
  if (!detail || typeof detail !== "object") {
    throw new Error("Invalid detail data: detail is not an object");
  }

  // Processing detail from backend API

  // Extract job title/position
  const position =
    detail.position ??
    detail.jobTitle ??
    detail.jobName ??
    detail.jobDescriptionTitle ??
    detail.jobDescription?.title ??
    "Interview";

  // Extract duration
  const duration =
    detail.duration ??
    detail.totalDuration ??
    detail.timeSpent ??
    "N/A";

  // Extract turns/evaluations/answers with safe optional chaining
  const turns = Array.isArray(detail?.turns)
    ? detail.turns
    : Array.isArray(detail?.data?.turns)
    ? detail.data.turns
    : Array.isArray(detail?.interviewTurns)
    ? detail.interviewTurns
    : Array.isArray(detail?.items)
    ? detail.items
    : [];

  const evaluations = Array.isArray(detail?.evaluations)
    ? detail.evaluations
    : Array.isArray(detail?.interviewEvaluations)
    ? detail.interviewEvaluations
    : [];

  const answers = Array.isArray(detail?.answers)
    ? detail.answers
    : Array.isArray(detail?.interviewAnswers)
    ? detail.interviewAnswers
    : [];

  // Determine data source for mapping
  const dataSource = turns.length > 0 ? "turns" : evaluations.length > 0 ? "evaluations" : "none";

  // Map question results from turns with evaluations and answers
  // Safe optional chaining to prevent crashes if data is missing
  const questionResults = turns.length > 0
    ? turns.map((t, idx) => {
        // Safe access to turn properties
        const turnIndex = t?.turnIndex ?? t?.turn ?? t?.index ?? idx + 1;
        const turnId = t?.turnId ?? t?.id;
        
        // Find matching answer FIRST (before using it in evaluation lookup)
        const turnAnswer = Array.isArray(answers) && answers.length > 0
          ? answers.find(
              (a) => 
                a?.turnIndex === turnIndex ||
                a?.turnId === turnId ||
                a?.interviewTurnId === turnId
            ) || t?.answer || null
          : t?.answer || null;

        // Find matching evaluation with safe optional chaining
        // Priority: evaluations array > t.evaluation > turnAnswer.evaluation
        const evaluationObj = Array.isArray(evaluations) && evaluations.length > 0
          ? evaluations.find(
              (e) => 
                e?.turnIndex === turnIndex ||
                e?.turnId === turnId ||
                e?.interviewTurnId === turnId
            ) || t?.evaluation || turnAnswer?.evaluation || null
          : t?.evaluation || turnAnswer?.evaluation || null;

        // Extract question text with safe optional chaining
        const questionText = 
          t?.questionText ?? 
          t?.questionContent ?? 
          t?.question ?? 
          t?.questionTextContent ??
          `Question ${idx + 1}`;

        // Extract user answer with safe optional chaining
        const userAnswerText = 
          turnAnswer?.userAnswer ?? 
          turnAnswer?.answerText ?? 
          turnAnswer?.answer ??
          t?.userAnswer ??
          t?.answerText ??
          t?.answer ??
          "";

        // Extract evaluation result (PASS/FAIL) with safe optional chaining
        // Check: evaluationObj.result > turnAnswer.evaluation.result > t.result
        const result = 
          evaluationObj?.result ?? 
          evaluationObj?.Result ??
          turnAnswer?.evaluation?.result ??
          turnAnswer?.evaluation?.Result ??
          t?.result ??
          t?.Result ??
          null;

        // Extract score with safe optional chaining
        // Check: evaluationObj.score > turnAnswer.evaluation.score > t.score
        const score = 
          evaluationObj?.score ?? 
          evaluationObj?.Score ??
          turnAnswer?.evaluation?.score ??
          turnAnswer?.evaluation?.Score ??
          t?.score ?? 
          t?.evaluationScore ?? 
          t?.Score ??
          (result === "PASS" || result === "Pass" ? 75 : result === "FAIL" || result === "Fail" ? 40 : 0);

        // Extract feedback with safe optional chaining
        // Check: evaluationObj.feedback > turnAnswer.evaluation.feedback > t.feedback
        const feedback = 
          evaluationObj?.feedback ?? 
          evaluationObj?.Feedback ??
          turnAnswer?.evaluation?.feedback ??
          turnAnswer?.evaluation?.Feedback ??
          t?.feedback ?? 
          t?.evaluationFeedback ??
          t?.Feedback ??
          "";

        // Extract category/topic/difficulty with safe optional chaining
        const category = 
          t?.category ?? 
          t?.topic ?? 
          t?.difficulty ?? 
          t?.Difficulty ??
          evaluationObj?.topic ??
          evaluationObj?.difficulty ??
          "Interview";

        return {
          id: turnIndex ?? t?.id ?? idx + 1,
          question: questionText,
          userAnswer: userAnswerText,
          category: category,
          score: typeof score === "number" ? score : parseInt(score) || 0,
          feedback: feedback,
          result: result,
        };
      })
    : Array.isArray(evaluations) && evaluations.length > 0
    ? evaluations.map((e, idx) => {
        // Find matching turn for question text with safe optional chaining
        const turn = Array.isArray(turns) && turns.length > 0
          ? turns.find(
              (t) => 
                t?.turnIndex === (e?.turnIndex ?? e?.turn ?? idx + 1) ||
                t?.turnId === (e?.turnId ?? e?.id) ||
                t?.id === (e?.turnId ?? e?.id)
            ) || null
          : null;

        // Find matching answer if available
        const turnAnswer = Array.isArray(answers) && answers.length > 0
          ? answers.find(
              (a) => 
                a?.turnIndex === (e?.turnIndex ?? e?.turn ?? idx + 1) ||
                a?.turnId === (e?.turnId ?? e?.id) ||
                a?.interviewTurnId === (e?.turnId ?? e?.id)
            ) || null
          : null;

        const questionText = 
          turn?.questionText ?? 
          turn?.questionContent ?? 
          turn?.question ??
          e?.questionText ??
          e?.questionContent ??
          e?.question ??
          `Question ${idx + 1}`;

        // Extract user answer (from turnAnswer or turn)
        const userAnswerText = 
          turnAnswer?.userAnswer ?? 
          turnAnswer?.answerText ?? 
          turnAnswer?.answer ??
          turn?.userAnswer ??
          turn?.answerText ??
          turn?.answer ??
          "";

        // Normalize result field - handle multiple variations
        // Check: result, Result, isPassed, passed, isPass, passFail, PassFail
        // Priority: e.result > turnAnswer.evaluation.result > turn.result
        let result = null;
        if (e?.result !== null && e?.result !== undefined) {
          result = e.result;
        } else if (e?.Result !== null && e?.Result !== undefined) {
          result = e.Result;
        } else if (turnAnswer?.evaluation?.result !== null && turnAnswer?.evaluation?.result !== undefined) {
          result = turnAnswer.evaluation.result;
        } else if (turnAnswer?.evaluation?.Result !== null && turnAnswer?.evaluation?.Result !== undefined) {
          result = turnAnswer.evaluation.Result;
        } else if (e?.isPassed !== null && e?.isPassed !== undefined) {
          result = e.isPassed === true || e.isPassed === "true" || e.isPassed === 1 ? "PASS" : "FAIL";
        } else if (e?.passed !== null && e?.passed !== undefined) {
          result = e.passed === true || e.passed === "true" || e.passed === 1 ? "PASS" : "FAIL";
        } else if (e?.isPass !== null && e?.isPass !== undefined) {
          result = e.isPass === true || e.isPass === "true" || e.isPass === 1 ? "PASS" : "FAIL";
        } else if (e?.passFail !== null && e?.passFail !== undefined) {
          result = String(e.passFail).toUpperCase();
        } else if (e?.PassFail !== null && e?.PassFail !== undefined) {
          result = String(e.PassFail).toUpperCase();
        } else if (turn?.result !== null && turn?.result !== undefined) {
          result = turn.result;
        } else if (turn?.Result !== null && turn?.Result !== undefined) {
          result = turn.Result;
        }
        
        // Normalize result string to PASS/FAIL
        if (result !== null) {
          const resultStr = String(result).toUpperCase().trim();
          if (resultStr === "PASS" || resultStr === "P" || resultStr === "TRUE" || resultStr === "1") {
            result = "PASS";
          } else if (resultStr === "FAIL" || resultStr === "F" || resultStr === "FALSE" || resultStr === "0") {
            result = "FAIL";
          } else {
            result = resultStr; // Keep as-is if it's already PASS/FAIL or other value
          }
        }

        // Normalize score field - handle multiple variations and scales
        // Check: score, Score, evaluationScore, EvaluationScore
        // Priority: e.score > turnAnswer.evaluation.score > turn.score
        // Handle both 0-100 scale and 0-1 scale (0/1 for PASS/FAIL)
        let score = null;
        if (e?.score !== null && e?.score !== undefined) {
          score = e.score;
        } else if (e?.Score !== null && e?.Score !== undefined) {
          score = e.Score;
        } else if (e?.evaluationScore !== null && e?.evaluationScore !== undefined) {
          score = e.evaluationScore;
        } else if (e?.EvaluationScore !== null && e?.EvaluationScore !== undefined) {
          score = e.EvaluationScore;
        } else if (turnAnswer?.evaluation?.score !== null && turnAnswer?.evaluation?.score !== undefined) {
          score = turnAnswer.evaluation.score;
        } else if (turnAnswer?.evaluation?.Score !== null && turnAnswer?.evaluation?.Score !== undefined) {
          score = turnAnswer.evaluation.Score;
        } else if (turn?.score !== null && turn?.score !== undefined) {
          score = turn.score;
        } else if (turn?.Score !== null && turn?.Score !== undefined) {
          score = turn.Score;
        } else if (turn?.evaluationScore !== null && turn?.evaluationScore !== undefined) {
          score = turn.evaluationScore;
        }
        
        // Convert score to number and handle different scales
        if (score !== null && score !== undefined) {
          const scoreNum = typeof score === "number" ? score : parseFloat(score);
          if (!Number.isNaN(scoreNum)) {
            // If score is 0 or 1, assume it's PASS/FAIL scale and convert to 0-100
            if (scoreNum === 0 || scoreNum === 1) {
              score = scoreNum === 1 ? 75 : 40; // PASS = 75, FAIL = 40 (default scores)
            } else if (scoreNum >= 0 && scoreNum <= 100) {
              score = scoreNum; // Already 0-100 scale
            } else {
              score = scoreNum; // Keep as-is (might be > 100 or negative)
            }
          } else {
            score = null;
          }
        }
        
        // Fallback: derive score from result if score is missing
        if (score === null || score === undefined) {
          if (result === "PASS" || result === "Pass") {
            score = 75; // Default PASS score
          } else if (result === "FAIL" || result === "Fail") {
            score = 40; // Default FAIL score
          } else {
            score = 0; // Unknown result
          }
        }

        // Normalize feedback field (check both Feedback and feedback)
        // Priority: e.feedback > turnAnswer.evaluation.feedback > turn.feedback
        const feedback = 
          e?.feedback ?? 
          e?.Feedback ??
          turnAnswer?.evaluation?.feedback ??
          turnAnswer?.evaluation?.Feedback ??
          turn?.feedback ??
          turn?.evaluationFeedback ??
          turn?.Feedback ??
          "";

        // Extract category/topic/difficulty
        const category = 
          e?.category ?? 
          e?.topic ?? 
          e?.difficulty ??
          turn?.category ??
          turn?.topic ??
          turn?.difficulty ??
          "Interview";


        return {
          id: e?.turnIndex ?? e?.turnId ?? e?.id ?? idx + 1,
          question: questionText,
          userAnswer: userAnswerText,
          category: category,
          score: typeof score === "number" ? score : parseInt(score) || 0,
          feedback: feedback,
          result: result,
        };
      })
    : [];

  // Calculate stats from questionResults
  const totalQuestions = questionResults.length;
  const passCount = questionResults.filter(q => {
    const r = String(q.result || "").toUpperCase().trim();
    return r === "PASS" || r === "P" || r === "TRUE" || r === "1";
  }).length;
  const failCount = questionResults.filter(q => {
    const r = String(q.result || "").toUpperCase().trim();
    return r === "FAIL" || r === "F" || r === "FALSE" || r === "0";
  }).length;

  // Calculate overallScore
  // Priority: backend-provided > computed from scores > computed from pass/fail ratio
  let overallScore =
    detail.overallScore ??
    detail.averageScore ??
    detail.avgScore ??
    detail.totalScore ??
    detail.score ??
    null;

  if (overallScore === null || overallScore === undefined) {
    // Compute from questionResults scores
    const scores = questionResults
      .map((q) => {
        const s = q.score;
        // Ensure score is a valid number
        if (typeof s === "number" && !Number.isNaN(s)) {
          return s;
        }
        const parsed = parseFloat(s);
        return !Number.isNaN(parsed) ? parsed : null;
      })
      .filter((s) => s !== null && s !== undefined);
    
    if (scores.length > 0) {
      overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    } else {
      // Fallback: calculate from pass/fail ratio
      overallScore = totalQuestions > 0 ? Math.round((passCount / Math.max(1, totalQuestions)) * 100) : 0;
    }
  }


  // Extract strengths/improvements (only if provided by backend)
  const strengths = detail.strengths ?? detail.strengthPoints ?? null;
  const improvements = detail.improvements ?? detail.improvementAreas ?? null;

  return {
    overallScore,
    position,
    completedAt: detail.completedAt ?? detail.endTime ?? null,
    duration,
    strengths: strengths || [],
    improvements: improvements || [],
    questionResults,
  };
}

export default InterviewSummary;
