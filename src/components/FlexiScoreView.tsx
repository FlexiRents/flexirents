import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Lock, CheckCircle2, ShieldCheck, Briefcase, Wallet, CreditCard, TrendingUp } from "lucide-react";
import { TIER_PLANS } from "@/lib/figScoring";

interface Assessment {
  total_score: number | null;
  tier: string | null;
  income_score: number | null;
  affordability_score: number | null;
  employment_score: number | null;
  behaviour_score: number | null;
  verification_score: number | null;
  is_overridden: boolean | null;
  override_tier: string | null;
}

const tierConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  A: { label: "Tier A – Premium", color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
  B: { label: "Tier B – Standard", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  C: { label: "Tier C – Basic", color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
  D: { label: "Tier D – Limited", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
};

const scoreBreakdown = [
  { key: "income_score", label: "Income Strength", max: 35, icon: Wallet },
  { key: "affordability_score", label: "Rent Affordability", max: 25, icon: TrendingUp },
  { key: "employment_score", label: "Employment Type", max: 15, icon: Briefcase },
  { key: "behaviour_score", label: "Payment Behaviour", max: 15, icon: CreditCard },
  { key: "verification_score", label: "Verification Strength", max: 10, icon: ShieldCheck },
];

export default function FlexiScoreView() {
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAssessment();
  }, [user]);

  const fetchAssessment = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("financial_assessments")
        .select("total_score, tier, income_score, affordability_score, employment_score, behaviour_score, verification_score, is_overridden, override_tier")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setAssessment(data);
    } catch (error) {
      console.error("Error fetching assessment:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flexi Score</CardTitle>
          <CardDescription>Your financial eligibility assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No assessment yet</p>
            <p className="text-sm mt-1">Your Flexi Score will appear here once an assessment has been completed by an admin.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const effectiveTier = assessment.is_overridden && assessment.override_tier
    ? assessment.override_tier
    : assessment.tier || "D";
  const totalScore = assessment.total_score || 0;
  const tierInfo = tierConfig[effectiveTier] || tierConfig.D;
  const plans = TIER_PLANS[effectiveTier] || TIER_PLANS.D;

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Flexi Score</CardTitle>
              <CardDescription>Your financial eligibility for payment plans</CardDescription>
            </div>
            <div className={`px-3 py-1.5 rounded-full border font-semibold text-sm ${tierInfo.bg} ${tierInfo.border} ${tierInfo.color}`}>
              {tierInfo.label}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Score */}
          <div className="text-center">
            <div className="text-5xl font-bold text-foreground">{totalScore}%</div>
            <p className="text-sm text-muted-foreground mt-1">Overall Flexi Score</p>
            <Progress value={totalScore} className="mt-3 h-3" />
          </div>

          {/* Score Breakdown */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Score Breakdown</h4>
            {scoreBreakdown.map(({ key, label, max, icon: Icon }) => {
              const value = (assessment as any)[key] || 0;
              const pct = max > 0 ? (value / max) * 100 : 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground">{label}</span>
                      <span className="text-muted-foreground">{value}/{max}</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Eligible Payment Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Eligible Payment Plans</CardTitle>
          <CardDescription>Plans available based on your Flexi Score tier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {plans.allowed.map((plan) => (
              <div key={plan} className="flex items-center gap-3 p-3 rounded-lg border bg-green-50/50 border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="font-medium text-foreground">{plan}</span>
              </div>
            ))}
            {plans.locked.map((plan) => (
              <div key={plan} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50 border-muted opacity-60">
                <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-muted-foreground line-through">{plan}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
