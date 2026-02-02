import { Sparkles, TrendingUp, BarChart3, Shield, Zap, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';

const ValueSection = () => {
  const features = [
    {
      icon: Sparkles,
      title: 'Phản hồi được hỗ trợ bởi AI',
      description: 'Nhận phản hồi tức thì, được cá nhân hóa được hỗ trợ bởi các thuật toán AI tiên tiến phân tích phản hồi của bạn theo thời gian thực.',
      bgColor: 'bg-[#66FCF1]/10',
      borderColor: 'border-[#66FCF1]/30',
      textColor: 'text-[#66FCF1]',
    },
    {
      icon: TrendingUp,
      title: 'Mô phỏng phỏng vấn thực tế',
      description: 'Luyện tập với các câu hỏi từ các cuộc phỏng vấn thực tế tại các công ty công nghệ hàng đầu, được điều chỉnh theo vai trò mục tiêu của bạn.',
      bgColor: 'bg-[#45A29E]/10',
      borderColor: 'border-[#45A29E]/30',
      textColor: 'text-[#45A29E]',
    },
    {
      icon: BarChart3,
      title: 'Báo cáo hiệu suất chi tiết',
      description: 'Nhận phân tích và thông tin chi tiết toàn diện để xác định điểm mạnh và các lĩnh vực cần cải thiện.',
      bgColor: 'bg-[#66FCF1]/10',
      borderColor: 'border-[#66FCF1]/30',
      textColor: 'text-[#66FCF1]',
    },
    {
      icon: Shield,
      title: 'Bảo mật & Riêng tư',
      description: 'Dữ liệu phỏng vấn của bạn được mã hóa và lưu trữ an toàn. Quyền riêng tư của bạn là ưu tiên của chúng tôi.',
      bgColor: 'bg-[#45A29E]/10',
      borderColor: 'border-[#45A29E]/30',
      textColor: 'text-[#45A29E]',
    },
    {
      icon: Zap,
      title: 'Kết quả tức thì',
      description: 'Nhận phản hồi ngay sau mỗi phiên phỏng vấn. Không chờ đợi, không trì hoãn.',
      bgColor: 'bg-[#66FCF1]/10',
      borderColor: 'border-[#66FCF1]/30',
      textColor: 'text-[#66FCF1]',
    },
    {
      icon: CheckCircle,
      title: 'Kết quả đã được chứng minh',
      description: 'Tham gia cùng hàng nghìn người dùng đã cải thiện kỹ năng phỏng vấn và đạt được công việc mơ ước của họ.',
      bgColor: 'bg-[#45A29E]/10',
      borderColor: 'border-[#45A29E]/30',
      textColor: 'text-[#45A29E]',
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0B0C10] to-[#1F2833]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Tại sao chọn Aiz by Zenith?
          </h2>
          <p className="text-lg text-[#C5C6C7] max-w-2xl mx-auto">
            Được xây dựng cho các chuyên gia muốn xuất sắc trong các cuộc phỏng vấn của họ
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="glass rounded-xl p-6 hover:scale-105 hover:border-[#66FCF1]/50 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bgColor} border ${feature.borderColor} flex items-center justify-center mb-4 group-hover:glow-border transition-all duration-300`}>
                  <Icon className={`w-6 h-6 ${feature.textColor}`} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-[#C5C6C7] text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="glass rounded-xl p-8 max-w-3xl mx-auto border-[#66FCF1]/30 glow-border">
            <h3 className="text-2xl font-bold text-white mb-4">
              Sẵn sàng để đạt được cuộc phỏng vấn tiếp theo của bạn?
            </h3>
            <p className="text-[#C5C6C7] mb-6">
              Tham gia cùng hàng nghìn chuyên gia đang cải thiện kỹ năng phỏng vấn của họ với Aiz.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="primary"
                size="lg"
                className="bg-[#66FCF1] hover:bg-[#45A29E] text-[#0B0C10] px-8 glow-primary-hover"
              >
                Bắt đầu
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-[#66FCF1] text-[#66FCF1] hover:bg-[#66FCF1] hover:text-[#0B0C10] px-8"
              >
                Xem giá
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValueSection;
