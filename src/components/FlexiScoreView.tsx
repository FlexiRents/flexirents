import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Lock, CheckCircle2, ShieldCheck, Briefcase, Wallet, CreditCard, TrendingUp, Clock, AlertCircle, Save } from "lucide-react";
import { TIER_PLANS, calculateFIGScore, type FIGInput } from "@/lib/figScoring";
import { toast } from "sonner";

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
  monthly_net_income: number | null;
  target_rent: number | null;
  income_source: string | null;
  employer_tier: string | null;
  employment_duration_months: number | null;
  payment_behaviour: string | null;
  gov_id_verified: boolean | null;
  bank_verified: boolean | null;
  employment_verified: boolean | null;
  score_frozen: boolean | null;
}

interface VerificationStatus {
  status: string;
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
  { key: "employment_score", label: "Employment Type", max: 15, icon: Briefcase, needsApproval: true },
  { key: "behaviour_score", label: "Payment Behaviour", max: 15, icon: CreditCard, needsApproval: true },
  { key: "verification_score", label: "Verification Strength", max: 10, icon: ShieldCheck, needsApproval: true },
];

export default function FlexiScoreView() {
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string>("not_verified");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // User-editable form fields
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [targetRent, setTargetRent] = useState("");
  const [incomeSource, setIncomeSource] = useState("salary");
  const [employmentDuration, setEmploymentDuration] = useState("");

  useEffect(() => {
    if (user) {
      Promise.all([fetchAssessment(), fetchVerificationStatus()]);

      // Subscribe to realtime changes on financial_assessments for notifications
      const channel = supabase
        .channel('flexi-score-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'financial_assessments',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newData = payload.new as any;
            const oldData = payload.old as any;
            
            // Check if admin-managed fields changed
            const adminFields = ['employer_tier', 'payment_behaviour', 'bank_verified', 'employment_verified', 'gov_id_verified', 'is_overridden', 'override_tier', 'score_frozen'];
            const changed = adminFields.filter(f => newData[f] !== oldData[f]);
            
            if (changed.length > 0) {
              toast.success("Your Flexi Score has been updated by an administrator. Refreshing...");
            }
            
            // Refresh data
            fetchAssessment();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchAssessment = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("financial_assessments")
        .select("total_score, tier, income_score, affordability_score, employment_score, behaviour_score, verification_score, is_overridden, override_tier, monthly_net_income, target_rent, income_source, employer_tier, employment_duration_months, payment_behaviour, gov_id_verified, bank_verified, employment_verified, score_frozen")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setAssessment(data);
        setMonthlyIncome(data.monthly_net_income?.toString() || "");
        setTargetRent(data.target_rent?.toString() || "");
        setIncomeSource(data.income_source || "salary");
        setEmploymentDuration(data.employment_duration_months?.toString() || "");
      }
    } catch (error) {
      console.error("Error fetching assessment:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVerificationStatus = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("user_verification")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) setVerificationStatus(data.status);
    } catch (error) {
      console.error("Error fetching verification:", error);
    }
  };

  // Live preview score from user-editable fields
  const liveScore = useMemo(() => {
    const income = parseFloat(monthlyIncome) || 0;
    const rent = parseFloat(targetRent) || 0;
    const duration = parseInt(employmentDuration) || 0;

    // Use existing admin-set values for fields that need approval
    const input: FIGInput = {
      monthly_net_income: income,
      target_rent: rent,
      income_source: incomeSource,
      employer_tier: assessment?.employer_tier || "informal",
      employment_duration_months: duration,
      payment_behaviour: assessment?.payment_behaviour || "frequent_issues",
      gov_id_verified: assessment?.gov_id_verified || verificationStatus === "verified",
      bank_verified: assessment?.bank_verified || false,
      employment_verified: assessment?.employment_verified || false,
    };

    return calculateFIGScore(input);
  }, [monthlyIncome, targetRent, incomeSource, employmentDuration, assessment, verificationStatus]);

  const handleSave = async () => {
    if (!user) return;

    const income = parseFloat(monthlyIncome);
    const rent = parseFloat(targetRent);
    const duration = parseInt(employmentDuration);

    if (!income || income <= 0) {
      toast.error("Please enter a valid monthly income");
      return;
    }
    if (!rent || rent <= 0) {
      toast.error("Please enter a valid target rent");
      return;
    }

    setSaving(true);
    try {
      const upsertData = {
        user_id: user.id,
        monthly_net_income: income,
        target_rent: rent,
        income_source: incomeSource,
        employment_duration_months: duration || 0,
        // Auto-score these fields
        income_score: liveScore.income_score,
        affordability_score: liveScore.affordability_score,
        // Recalculate total with existing admin fields
        total_score: liveScore.total_score,
        tier: liveScore.tier,
        // Link verification status
        gov_id_verified: verificationStatus === "verified",
        // Keep existing admin-managed fields
        ...(assessment ? {} : {
          employer_tier: "informal",
          payment_behaviour: "frequent_issues",
          bank_verified: false,
          employment_verified: false,
          employment_score: liveScore.employment_score,
          behaviour_score: liveScore.behaviour_score,
          verification_score: liveScore.verification_score,
        }),
      };

      // If assessment exists, update; otherwise insert
      if (assessment) {
        const { error } = await supabase
          .from("financial_assessments")
          .update({
            monthly_net_income: income,
            target_rent: rent,
            income_source: incomeSource,
            employment_duration_months: duration || 0,
            income_score: liveScore.income_score,
            affordability_score: liveScore.affordability_score,
            total_score: liveScore.total_score,
            tier: liveScore.tier,
            gov_id_verified: verificationStatus === "verified",
            verification_score: liveScore.verification_score,
          })
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("financial_assessments")
          .insert({
            user_id: user.id,
            monthly_net_income: income,
            target_rent: rent,
            income_source: incomeSource,
            employment_duration_months: duration || 0,
            income_score: liveScore.income_score,
            affordability_score: liveScore.affordability_score,
            employment_score: liveScore.employment_score,
            behaviour_score: liveScore.behaviour_score,
            verification_score: liveScore.verification_score,
            total_score: liveScore.total_score,
            tier: liveScore.tier,
            employer_tier: "informal",
            payment_behaviour: "frequent_issues",
            gov_id_verified: verificationStatus === "verified",
            bank_verified: false,
            employment_verified: false,
          });
        if (error) throw error;
      }

      toast.success("Financial data saved and score updated");
      await fetchAssessment();
    } catch (error) {
      console.error("Error saving assessment:", error);
      toast.error("Failed to save financial data");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const effectiveTier = assessment?.is_overridden && assessment?.override_tier
    ? assessment.override_tier
    : liveScore.tier;
  const totalScore = liveScore.total_score;
  const tierInfo = tierConfig[effectiveTier] || tierConfig.D;
  const plans = TIER_PLANS[effectiveTier] || TIER_PLANS.D;

  const isFrozen = assessment?.score_frozen === true;

  // Determine which fields are pending admin approval
  const isPendingEmployerTier = !assessment?.employer_tier || assessment.employer_tier === "informal";
  const isPendingBehaviour = !assessment?.payment_behaviour || assessment.payment_behaviour === "frequent_issues";
  const isPendingBankVerified = !assessment?.bank_verified;
  const isPendingEmploymentVerified = !assessment?.employment_verified;
  const isIdVerificationPending = verificationStatus === "pending";
  const isIdVerified = verificationStatus === "verified";

  return (
    <div className="space-y-6">
      {/* Data Entry Section */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Information</CardTitle>
          <CardDescription>
            Enter your financial details to calculate your Flexi Score. Some fields require admin verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isFrozen && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
              <Lock className="h-4 w-4 flex-shrink-0" />
              <span>Your score is currently frozen by an administrator. Data cannot be modified.</span>
            </div>
          )}

          {/* User-Editable Fields */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your Financial Data</h4>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="monthly_income">Monthly Net Income (GHS)</Label>
                <Input
                  id="monthly_income"
                  type="number"
                  min="0"
                  step="0.01"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="e.g. 3000"
                  disabled={isFrozen}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_rent">Target Monthly Rent (GHS)</Label>
                <Input
                  id="target_rent"
                  type="number"
                  min="0"
                  step="0.01"
                  value={targetRent}
                  onChange={(e) => setTargetRent(e.target.value)}
                  placeholder="e.g. 800"
                  disabled={isFrozen}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="income_source">Income Source</Label>
                <Select value={incomeSource} onValueChange={setIncomeSource} disabled={isFrozen}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select income source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salary">Salary</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="informal">Informal</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Auto-linked from your identity verification employment status</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employment_duration">Employment Duration (months)</Label>
                <Input
                  id="employment_duration"
                  type="number"
                  min="0"
                  value={employmentDuration}
                  onChange={(e) => setEmploymentDuration(e.target.value)}
                  placeholder="e.g. 24"
                  disabled={isFrozen}
                />
              </div>
            </div>
          </div>

          {/* Admin-Managed Fields (Read-only with Pending Approval indicators) */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Admin-Verified Fields</h4>
            
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Employer Tier */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div>
                  <p className="text-sm font-medium text-foreground">Employer Tier</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {assessment?.employer_tier?.replace("_", " ") || "Not set"}
                  </p>
                </div>
                {isPendingEmployerTier ? (
                  <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-700 text-xs gap-1">
                    <Clock className="h-3 w-3" />
                    Pending Approval
                  </Badge>
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
              </div>

              {/* Payment Behaviour */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div>
                  <p className="text-sm font-medium text-foreground">Payment Behaviour</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {assessment?.payment_behaviour?.replace("_", " ") || "Not assessed"}
                  </p>
                </div>
                {isPendingBehaviour ? (
                  <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-700 text-xs gap-1">
                    <Clock className="h-3 w-3" />
                    Pending Approval
                  </Badge>
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
              </div>

              {/* Gov ID Verification */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div>
                  <p className="text-sm font-medium text-foreground">Government ID</p>
                  <p className="text-xs text-muted-foreground">
                    {isIdVerified ? "Verified" : isIdVerificationPending ? "Submitted for review" : "Not submitted"}
                  </p>
                </div>
                {isIdVerified ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : isIdVerificationPending ? (
                  <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-700 text-xs gap-1">
                    <Clock className="h-3 w-3" />
                    Pending Approval
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 border-red-300 text-red-700 text-xs gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Not Submitted
                  </Badge>
                )}
              </div>

              {/* Bank Verification */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div>
                  <p className="text-sm font-medium text-foreground">Bank Verified</p>
                  <p className="text-xs text-muted-foreground">
                    {assessment?.bank_verified ? "Verified" : "Not verified"}
                  </p>
                </div>
                {assessment?.bank_verified ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-700 text-xs gap-1">
                    <Clock className="h-3 w-3" />
                    Pending Approval
                  </Badge>
                )}
              </div>

              {/* Employment Verification */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div>
                  <p className="text-sm font-medium text-foreground">Employment Verified</p>
                  <p className="text-xs text-muted-foreground">
                    {assessment?.employment_verified ? "Verified" : "Not verified"}
                  </p>
                </div>
                {assessment?.employment_verified ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-700 text-xs gap-1">
                    <Clock className="h-3 w-3" />
                    Pending Approval
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving || isFrozen} className="w-full">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save & Update Score
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Live Score Gauge */}
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
          {/* Main Score Gauge */}
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke={totalScore >= 70 ? "hsl(142, 76%, 36%)" : totalScore >= 50 ? "hsl(217, 91%, 60%)" : totalScore >= 25 ? "hsl(45, 93%, 47%)" : "hsl(0, 84%, 60%)"}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(totalScore / 100) * 327} 327`}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold text-foreground">{totalScore}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Overall Flexi Score</p>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Score Breakdown</h4>
            {scoreBreakdown.map(({ key, label, max, icon: Icon, needsApproval }) => {
              const value = (liveScore as any)[key] || 0;
              const pct = max > 0 ? (value / max) * 100 : 0;
              const isDefaultPending = needsApproval && assessment && (
                (key === "employment_score" && isPendingEmployerTier) ||
                (key === "behaviour_score" && isPendingBehaviour) ||
                (key === "verification_score" && (isPendingBankVerified || isPendingEmploymentVerified || !isIdVerified))
              );

              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground flex items-center gap-2">
                          {label}
                          {isDefaultPending && (
                            <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-700 text-[10px] px-1.5 py-0 gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              Pending
                            </Badge>
                          )}
                        </span>
                        <span className="text-muted-foreground">{value}/{max}</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
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
