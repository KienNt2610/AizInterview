import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  BarChart3,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useUsageLimit } from "../hooks/useUsageLimit";
import { interviewSessionAPI } from "../services/api"; // ✅ dùng API thật

const Dashboard = () => {
  const navigate = useNavigate();
  const { usage, hasReachedLimit, getRemainingInterviews } = useUsageLimit();

  const [recentInterviews, setRecentInterviews] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoadingHistory(true);
      const res = await interviewSessionAPI.history();

      // backend có thể trả { data: [...] } hoặc { data: { items: [...] } } hoặc trực tiếp [...]
      const payload = res.data?.data ?? res.data;
      const list =
        Array.isArray(payload) ? payload : payload?.items ?? payload?.results ?? [];

      setRecentInterviews(list);
    } catch (error) {
      console.error("Failed to fetch interview history:", error);
      setRecentInterviews([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ✅ Tính stats từ recentInterviews (không cần dashboardAPI)
  const stats = useMemo(() => {
    const total = recentInterviews.length;

    // tùy backend đặt field status: "completed" | "ended" | ...
    const completed = recentInterviews.filter((x) => {
      const s = (x.status ?? x.state ?? "").toString().toLowerCase();
      return s.includes("complete") || s.includes("end") || s === "done";
    }).length;

    return {
      totalInterviews: total,
      completedInterviews: completed,
      remainingQuota: usage ? getRemainingInterviews() : 0,
    };
  }, [recentInterviews, usage, getRemainingInterviews]);

  const statCards = [
    {
      title: "Total Interviews",
      value: stats.totalInterviews,
      icon: Video,
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Completed",
      value: stats.completedInterviews,
      icon: CheckCircle,
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Remaining Quota",
      value: stats.remainingQuota,
      icon: Clock,
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
    },
  ];

  // ✅ Chuẩn hóa hiển thị date (fallback nếu backend trả createdAt/startTime)
  const formatDate = (item) => {
    const raw = item.date ?? item.createdAt ?? item.startTime ?? item.createdDate;
    if (!raw) return "-";
    try {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return String(raw);
      return d.toISOString().slice(0, 10);
    } catch {
      return String(raw);
    }
  };

  // ✅ Chuẩn hóa position/title
  const getPosition = (item) =>
    item.position ?? item.jobTitle ?? item.jobName ?? item.jobDescriptionTitle ?? "Interview";

  // ✅ Chuẩn hóa id/sessionId
  const getSessionId = (item) => item.sessionId ?? item.interviewSessionId ?? item.id;

  return (
    <div className="space-y-6">
      {/* Usage Limit Warning Banner */}
      {hasReachedLimit && (
        <Card className="border-2 border-red-500/30 bg-gradient-to-r from-red-900/40 to-red-800/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-red-500/20 p-3 rounded-full border border-red-500/30">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-lg mb-2">
                  Interview Limit Reached
                </h3>
                <p className="text-white/80 mb-4">
                  You've used all {usage?.total} interviews in your current plan.
                  Upgrade to continue practicing and improving your skills.
                </p>
                <Button
                  variant="danger"
                  onClick={() => navigate("/payment")}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Usage Warning */}
      {!hasReachedLimit && usage && getRemainingInterviews() <= 2 && (
        <Card className="border-2 border-yellow-500/30 bg-gradient-to-r from-yellow-900/40 to-yellow-800/30 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <div className="flex-1">
                <p className="text-white font-medium">
                  Only {getRemainingInterviews()} interview
                  {getRemainingInterviews() !== 1 ? "s" : ""} remaining. Consider upgrading to
                  continue without interruption.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/payment")} className="border-white/20 text-white hover:bg-white/10">
                View Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white mt-1">Track your interview performance and progress</p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate("/interview")}
          disabled={hasReachedLimit}
          className="flex items-center gap-2"
        >
          <Video className="w-5 h-5" />
          New Interview
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorMap = {
            blue: { bg: 'from-blue-600/20 to-blue-500/10', border: 'border-blue-500/30', icon: 'text-blue-400', iconBg: 'bg-blue-500/20' },
            green: { bg: 'from-green-600/20 to-green-500/10', border: 'border-green-500/30', icon: 'text-green-400', iconBg: 'bg-green-500/20' },
            indigo: { bg: 'from-indigo-600/20 to-indigo-500/10', border: 'border-indigo-500/30', icon: 'text-indigo-400', iconBg: 'bg-indigo-500/20' },
            yellow: { bg: 'from-yellow-600/20 to-yellow-500/10', border: 'border-yellow-500/30', icon: 'text-yellow-400', iconBg: 'bg-yellow-500/20' },
          };
          const colors = colorMap[stat.title === 'Total Interviews' ? 'blue' : stat.title === 'Completed' ? 'green' : 'yellow'];
          
          return (
            <Card key={index} className={`hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-gradient-to-br ${colors.bg} border ${colors.border} backdrop-blur-sm`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/70">{stat.title}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  </div>
                  <div className={`${colors.iconBg} p-3 rounded-xl border ${colors.border}`}>
                    <Icon className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Interviews */}
      <Card className="bg-[#1F2833]/50 border border-[#66FCF1]/20 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/10">
          <div>
            <CardTitle className="text-white">Recent Interviews</CardTitle>
            <CardDescription className="text-white/70">Your latest interview sessions</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/history")} className="border-white/20 text-white hover:bg-white/10">
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="py-10 text-center text-white/70">Loading history...</div>
          ) : recentInterviews.length === 0 ? (
            <div className="py-10 text-center text-white/70">
              No interviews yet. Start your first interview!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white">
                      Position
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-white">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentInterviews.slice(0, 5).map((interview, idx) => {
                    const sessionId = getSessionId(interview);
                    // Ensure sessionId is a valid string (Guid), skip if missing
                    if (!sessionId || typeof sessionId !== 'string') {
                      return null;
                    }
                    const position = getPosition(interview);
                    const date = formatDate(interview);
                    const status = interview.status ?? interview.state ?? "completed";

                    return (
                      <tr
                        key={sessionId}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                              <Video className="w-5 h-5 text-indigo-400" />
                            </div>
                            <span className="font-medium text-white">{position}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-white/70">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{date}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                            {String(status)}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/interview/${sessionId}/summary`)}
                            className="text-white hover:bg-white/10"
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-indigo-600/20 to-indigo-500/10 border-2 border-indigo-500/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-indigo-500/20 p-3 rounded-xl border border-indigo-500/30">
                <Video className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-lg">Start New Interview</h3>
                <p className="text-sm text-white/70 mt-1 mb-4">
                  Practice with AI-powered interview questions
                </p>
                <Button variant="primary" size="sm" onClick={() => navigate("/interview")}>
                  Get Started
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-purple-600/20 to-purple-500/10 border-2 border-purple-500/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-purple-500/20 p-3 rounded-xl border border-purple-500/30">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-lg">View Performance</h3>
                <p className="text-sm text-white/70 mt-1 mb-4">
                  Analyze your interview history and results
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate("/history")} className="border-white/20 text-white hover:bg-white/10">
                  View History
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
