import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';

const PlanSummaryCard = ({ plan, userInfo }) => {
  const navigate = useNavigate();

  const handleChangePlan = () => {
    // Try to navigate to pricing page, fallback to disabled button
    const pricingRoute = '/pricing';
    if (window.location.pathname !== pricingRoute) {
      navigate(pricingRoute);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price */}
        <div>
          <div className="text-3xl font-bold text-white">
            {plan.price}
          </div>
          <div className="text-sm text-[#C5C6C7] mt-1">
            / {plan.period}
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[#C5C6C7] uppercase tracking-wide">
            Quyền lợi
          </h4>
          <ul className="space-y-2">
            {plan.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="w-5 h-5 text-[#66FCF1] shrink-0 mt-0.5" />
                <span className="text-[#C5C6C7] text-sm">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Divider */}
        <div className="border-t border-[#1F2833]" />

        {/* Change Plan Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleChangePlan}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Đổi gói
        </Button>
      </CardContent>
    </Card>
  );
};

export default PlanSummaryCard;
