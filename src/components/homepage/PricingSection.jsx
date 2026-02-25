import { Check, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import Button from '../ui/Button';

const PricingSection = () => {
  const navigate = useNavigate();
  const plans = [
    {
      name: 'Basic',
      price: '59',
      period: 'tháng',
      description: 'Hoàn hảo để thử nghiệm nền tảng',
      features: [
        '5 lượt phỏng vấn demo mỗi tháng',
        'Bộ câu hỏi cơ bản',
        'Phản hồi mẫu',
        'Không ghi âm',
        'Hỗ trợ cộng đồng',
      ],
      cta: 'Bắt đầu',
      popular: false,
    },
    {
      name: 'Pro',
      price: '99',
      period: 'tháng',
      description: 'Dành cho việc chuẩn bị phỏng vấn nghiêm túc',
      features: [
        'Phỏng vấn không giới hạn',
        'Ghi âm & phân tích',
        'Phản hồi được hỗ trợ bởi AI',
        'Báo cáo hiệu suất',
        'Lịch sử phỏng vấn',
        'Hỗ trợ ưu tiên',
        'Bộ câu hỏi tùy chỉnh',
      ],
      cta: 'Bắt đầu',
      popular: true,
    },
    {
      name: 'Premium',
      price: '199',
      period: 'tháng',
      description: 'Dành cho nhóm và tổ chức',
      features: [
        'Tất cả tính năng Pro',
        'Cộng tác nhóm',
        'Phân tích nâng cao',
        'Thương hiệu tùy chỉnh',
        'Truy cập API',
        'Hỗ trợ chuyên dụng',
        'Buổi đào tạo',
        'Tích hợp tùy chỉnh',
      ],
      cta: 'Liên hệ bán hàng',
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0B0C10]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#66FCF1]/10 border border-[#66FCF1]/30 text-[#66FCF1] text-sm font-medium mb-4 glow-border">
            <Sparkles className="w-4 h-4" />
            <span>Gói giá</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Chọn gói của bạn
          </h2>
          <p className="text-lg text-[#C5C6C7] max-w-2xl mx-auto">
            Bắt đầu miễn phí và nâng cấp khi bạn phát triển. Tất cả các gói đều bao gồm các tính năng cốt lõi của chúng tôi.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative transition-all duration-300 ${
                plan.popular
                  ? 'border-[#66FCF1] glow-border scale-105'
                  : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#66FCF1] text-[#0B0C10] px-4 py-1 rounded-full text-xs font-semibold glow-primary">
                    Phổ biến nhất
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-white text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-[#C5C6C7]">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-[#66FCF1] text-glow">{plan.price}k</span>
                    <span className="text-[#C5C6C7]">/{plan.period}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#66FCF1] flex-shrink-0 mt-0.5" />
                      <span className="text-[#C5C6C7] text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  variant={plan.popular ? 'primary' : 'outline'}
                  className={`w-full ${
                    plan.popular
                      ? 'bg-[#66FCF1] hover:bg-[#45A29E] text-[#0B0C10] glow-primary-hover'
                      : 'border-[#66FCF1] text-[#66FCF1] hover:bg-[#66FCF1] hover:text-[#0B0C10]'
                  }`}
                  size="lg"
                  onClick={() => {
                    if (plan.cta === 'Bắt đầu') {
                      navigate(
                        `/payment?plan=${encodeURIComponent(
                          plan.name,
                        )}&price=${encodeURIComponent(plan.price)}`,
                      );
                    }
                  }}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ / Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-[#C5C6C7]">
            Tất cả các gói đều bao gồm nền tảng phỏng vấn được hỗ trợ bởi AI của chúng tôi. Nâng cấp hoặc hạ cấp bất cứ lúc nào.
          </p>
          <p className="text-[#C5C6C7]/60 text-sm mt-2">
            Cần gói tùy chỉnh? <a href="#" className="text-[#66FCF1] hover:text-[#45A29E] transition-colors">Liên hệ chúng tôi</a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
