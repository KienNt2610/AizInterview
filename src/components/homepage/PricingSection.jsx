import { Check, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import Button from '../ui/Button';

const PricingSection = () => {
  const plans = [
    {
      name: 'Basic',
      price: '59',
      period: 'per month',
      description: 'Perfect for trying out the platform',
      features: [
        '5 demo interviews per month',
        'Basic question sets',
        'Sample feedback',
        'No audio recording',
        'Community support',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Pro',
      price: '99',
      period: 'per month',
      description: 'For serious interview preparation',
      features: [
        'Unlimited interviews',
        'Audio recording & analysis',
        'AI-powered feedback',
        'Performance reports',
        'Interview history',
        'Priority support',
        'Custom question sets',
      ],
      cta: 'Get Started',
      popular: true,
    },
    {
      name: 'Premium',
      price: '199',
      period: 'per month',
      description: 'For teams and organizations',
      features: [
        'Everything in Pro',
        'Team collaboration',
        'Advanced analytics',
        'Custom branding',
        'API access',
        'Dedicated support',
        'Training sessions',
        'Custom integrations',
      ],
      cta: 'Contact Sales',
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
            <span>Pricing Plans</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg text-[#C5C6C7] max-w-2xl mx-auto">
            Start free and upgrade as you grow. All plans include our core features.
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
                    Most Popular
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
            All plans include our AI-powered interview platform. Upgrade or downgrade at any time.
          </p>
          <p className="text-[#C5C6C7]/60 text-sm mt-2">
            Need a custom plan? <a href="#" className="text-[#66FCF1] hover:text-[#45A29E] transition-colors">Contact us</a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
