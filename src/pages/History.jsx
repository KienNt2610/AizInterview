import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video,
  Calendar,
  BarChart3,
  ArrowRight,
  Award,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import { interviewSessionAPI } from "../services/api";

const History = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await interviewSessionAPI.history();

      const payload = res.data?.data ?? res.data;
      const list = Array.isArray(payload)
        ? payload
        : payload?.items ?? payload?.results ?? [];

      setInterviews(list);
    } catch (error) {
      console.error("Failed to fetch interview history:", error);
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  const getSessionId = (item) =>
    item.sessionId ?? item.interviewSessionId ?? item.id;

  const getPosition = (item) =>
    item.position ?? item.jobTitle ?? item.jobName ?? "Interview";

  const getDate = (item) => {
    const raw = item.createdAt ?? item.startTime ?? item.date;
    if (!raw) return "-";
    try {
      return new Date(raw).toISOString().slice(0, 10);
    } catch {
      return String(raw);
    }
  };

  const getOverallScore = (item) => {
    // Try to get overallScore from various possible fields
    const score = 
      item.overallScore ?? 
      item.averageScore ?? 
      item.avgScore ?? 
      item.totalScore ?? 
      item.score ?? 
      null;
    
    // Return score if valid, otherwise return null (don't display)
    if (score !== null && score !== undefined) {
      const scoreNum = typeof score === "number" ? score : parseFloat(score);
      if (!Number.isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= 100) {
        return Math.round(scoreNum);
      }
    }
    return null;
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-white/70">Loading interview history...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Interview History</h1>
          <p className="text-white/70 mt-1">View all your past interview sessions</p>
        </div>
      </div>

      {interviews.length === 0 ? (
        <Card className="bg-[#1F2833]/50 border border-[#66FCF1]/20 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <div className="text-white/70 text-lg">No interviews found.</div>
            <Button
              variant="primary"
              onClick={() => navigate("/interview")}
              className="mt-4"
            >
              Start Your First Interview
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {interviews.map((item, index) => {
            const sessionId = getSessionId(item);
            
            return (
              <Card 
                key={sessionId ?? index} 
                className="hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 bg-gradient-to-r from-[#1F2833]/60 to-[#1F2833]/40 border border-[#66FCF1]/20 backdrop-blur-sm"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/30 to-indigo-600/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                        <Video className="w-7 h-7 text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-lg mb-2">
                          {getPosition(item)}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-white/70">
                          <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#66FCF1]" />
                            {getDate(item)}
                          </span>
                          {getOverallScore(item) !== null && (
                            <span className="flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-lg">
                              <Award className="w-4 h-4 text-[#66FCF1]" />
                              <span className="text-white font-medium">
                                Score: {getOverallScore(item)}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/interview/${sessionId}/summary`)}
                      className="flex items-center gap-2 border-[#66FCF1]/30 text-white hover:bg-[#66FCF1]/10 hover:border-[#66FCF1]/50"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;
