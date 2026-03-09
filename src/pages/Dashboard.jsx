import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video,
  CheckCircle,
  Clock,
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
import { useUserPlan } from "../hooks/useUserPlan";
import { interviewSessionAPI } from "../services/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const { plan, hasReachedLimit, getRemainingInterviews } = useUserPlan();

  const [recentInterviews, setRecentInterviews] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    void fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoadingHistory(true);
      const res = await interviewSessionAPI.history();

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

  const stats = useMemo(() => {
    const total = recentInterviews.length;

    const completed = recentInterviews.filter((x) => {
      const s = (x.status ?? x.state ?? "").toString().toLowerCase();
      return s.includes("complete") || s.includes("end") || s === "done";
    }).length;

    const remaining = getRemainingInterviews();

    return {
      totalInterviews: total,
      completedInterviews: completed,
      remainingQuota: plan === "PRO" ? "∞" : remaining ?? "-",
    };
  }, [getRemainingInterviews, plan, recentInterviews]);

  const statCards = [
    { title: "Tổng số phỏng vấn", value: stats.totalInterviews, icon: Video, tone: "blue" },
    { title: "Đã hoàn thành", value: stats.completedInterviews, icon: CheckCircle, tone: "green" },
    { title: "Hạn mức còn lại", value: stats.remainingQuota, icon: Clock, tone: "yellow" },
  ];

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

  const getPosition = (item) =>
    item.position ?? item.jobTitle ?? item.jobName ?? item.jobDescriptionTitle ?? "Interview";

  const getSessionId = (item) => item.sessionId ?? item.interviewSessionId ?? item.id;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {plan === "FREE" && hasReachedLimit() && (
        <Card className="border-2 border-red-500/30 bg-gradient-to-r from-red-900/40 to-red-800/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-red-500/20 p-3 rounded-full border border-red-500/30">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-lg mb-2">Đã đạt giới hạn phỏng vấn</h3>
                <p className="text-white/80 mb-4">
                  Bạn đã sử dụng hết lượt phỏng vấn miễn phí trong gói hiện tại. Nâng cấp để tiếp tục luyện tập.
                </p>
                <Button
                  variant="danger"
                  onClick={() => navigate("/payment")}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Nâng cấp gói
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {plan === "FREE" &&
        !hasReachedLimit() &&
        getRemainingInterviews() !== null &&
        getRemainingInterviews() <= 1 && (
        <Card className="border-2 border-yellow-500/30 bg-gradient-to-r from-yellow-900/40 to-yellow-800/30 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <div className="flex-1">
                <p className="text-white font-medium">
                  Chỉ còn {getRemainingInterviews()} lượt phỏng vấn. Hãy cân nhắc nâng cấp để tiếp tục không bị gián đoạn.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/payment")}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Xem gói
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-white">Bảng điều khiển</h1>
          <p className="text-white mt-1">Theo dõi hiệu suất và tiến trình phỏng vấn của bạn</p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate("/interview")}
          disabled={plan === "FREE" && hasReachedLimit()}
          className="flex items-center gap-2"
        >
          <Video className="w-5 h-5" />
          Phỏng vấn mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorMap = {
            blue: { bg: "from-blue-600/20 to-blue-500/10", border: "border-blue-500/30", icon: "text-blue-400", iconBg: "bg-blue-500/20" },
            green: { bg: "from-green-600/20 to-green-500/10", border: "border-green-500/30", icon: "text-green-400", iconBg: "bg-green-500/20" },
            yellow: { bg: "from-yellow-600/20 to-yellow-500/10", border: "border-yellow-500/30", icon: "text-yellow-400", iconBg: "bg-yellow-500/20" },
          };
          const colors = colorMap[stat.tone];

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

      <Card className="bg-[#1F2833]/50 border border-[#66FCF1]/20 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/10">
          <div>
            <CardTitle className="text-white">Phỏng vấn gần đây</CardTitle>
            <CardDescription className="text-white/70">Các phiên phỏng vấn mới nhất của bạn</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/history")} className="border-white/20 text-white hover:bg-white/10">
            Xem tất cả
          </Button>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="py-10 text-center text-white/70">Đang tải lịch sử...</div>
          ) : recentInterviews.length === 0 ? (
            <div className="py-10 text-center text-white/70">
              Chưa có phỏng vấn nào. Bắt đầu phỏng vấn đầu tiên của bạn!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white">Vị trí</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white">Ngày</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white">Trạng thái</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-white">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInterviews.slice(0, 5).map((interview) => {
                    const sessionId = getSessionId(interview);
                    if (!sessionId || typeof sessionId !== "string") {
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
                            Xem chi tiết
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card className="hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-indigo-600/20 to-indigo-500/10 border-2 border-indigo-500/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-indigo-500/20 p-3 rounded-xl border border-indigo-500/30">
                <Video className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-lg">Bắt đầu phỏng vấn mới</h3>
                <p className="text-sm text-white/70 mt-1 mb-4">
                  Luyện tập với câu hỏi phỏng vấn được hỗ trợ bởi AI
                </p>
                <Button variant="primary" size="sm" onClick={() => navigate("/interview")}>
                  Bắt đầu
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
                <h3 className="font-semibold text-white text-lg">Xem hiệu suất</h3>
                <p className="text-sm text-white/70 mt-1 mb-4">
                  Phân tích lịch sử và kết quả phỏng vấn của bạn
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate("/history")} className="border-white/20 text-white hover:bg-white/10">
                  Xem lịch sử
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
