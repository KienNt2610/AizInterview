import { Sparkles, TrendingUp, BarChart3, Shield, Zap, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';

const ValueSection = () => {
  const features = [
    {
      icon: Sparkles,
      title: 'AI-Driven Feedback',
      description: 'Get instant, personalized feedback powered by advanced AI algorithms that analyze your responses in real-time.',
      bgColor: 'bg-[#66FCF1]/10',
      borderColor: 'border-[#66FCF1]/30',
      textColor: 'text-[#66FCF1]',
    },
    {
      icon: TrendingUp,
      title: 'Real Interview Simulation',
      description: 'Practice with questions from real interviews at top tech companies, tailored to your target role.',
      bgColor: 'bg-[#45A29E]/10',
      borderColor: 'border-[#45A29E]/30',
      textColor: 'text-[#45A29E]',
    },
    {
      icon: BarChart3,
      title: 'Detailed Performance Reports',
      description: 'Receive comprehensive analytics and insights to identify strengths and areas for improvement.',
      bgColor: 'bg-[#66FCF1]/10',
      borderColor: 'border-[#66FCF1]/30',
      textColor: 'text-[#66FCF1]',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your interview data is encrypted and stored securely. Your privacy is our priority.',
      bgColor: 'bg-[#45A29E]/10',
      borderColor: 'border-[#45A29E]/30',
      textColor: 'text-[#45A29E]',
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Get feedback immediately after each interview session. No waiting, no delays.',
      bgColor: 'bg-[#66FCF1]/10',
      borderColor: 'border-[#66FCF1]/30',
      textColor: 'text-[#66FCF1]',
    },
    {
      icon: CheckCircle,
      title: 'Proven Results',
      description: 'Join thousands of users who have improved their interview skills and landed their dream jobs.',
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
            Why Choose Aiz by Zenith?
          </h2>
          <p className="text-lg text-[#C5C6C7] max-w-2xl mx-auto">
            Built for professionals who want to excel in their interviews
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
              Ready to Ace Your Next Interview?
            </h3>
            <p className="text-[#C5C6C7] mb-6">
              Join thousands of professionals who are already improving their interview skills with Aiz.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="primary"
                size="lg"
                className="bg-[#66FCF1] hover:bg-[#45A29E] text-[#0B0C10] px-8 glow-primary-hover"
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-[#66FCF1] text-[#66FCF1] hover:bg-[#66FCF1] hover:text-[#0B0C10] px-8"
              >
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValueSection;
