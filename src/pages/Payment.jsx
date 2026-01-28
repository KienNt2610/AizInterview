import { useEffect, useState } from "react";
import { CheckCircle, CreditCard, Star } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";

const Payment = () => {
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    // Mock fetch payment info
    setTimeout(() => {
      setCurrentPlan({
        name: "Free Plan",
        interviewsUsed: 7,
        interviewsTotal: 10,
      });
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-slate-600">Loading plans...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-slate-900 text-center">
        Choose Your Plan
      </h1>

      {/* Current Plan */}
      <Card className="border-2 border-indigo-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Current Plan
              </h3>
              <p className="text-slate-600 mt-1">
                {currentPlan.name} • {currentPlan.interviewsUsed}/
                {currentPlan.interviewsTotal} interviews used
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Free Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600">✔ 10 interviews / month</p>
            <p className="text-slate-600">✔ Basic AI feedback</p>
            <p className="text-slate-600">✔ Interview history</p>
            <Button variant="outline" disabled className="w-full">
              Current Plan
            </Button>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="border-2 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Pro Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600">✔ Unlimited interviews</p>
            <p className="text-slate-600">✔ Advanced AI evaluation</p>
            <p className="text-slate-600">✔ Priority processing</p>
            <Button
              variant="primary"
              className="w-full"
              onClick={() =>
                alert("Payment flow will be implemented later")
              }
            >
              Upgrade (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payment;
