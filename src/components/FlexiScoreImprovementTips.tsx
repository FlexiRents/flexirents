import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  Wallet,
  TrendingUp,
  Briefcase,
  CreditCard,
  ShieldCheck,
  Target,
  ArrowUp,
} from "lucide-react";

interface FlexiScoreImprovementTipsProps {
  incomeScore: number;
  affordabilityScore: number;
  employmentScore: number;
  behaviourScore: number;
  verificationScore: number;
  totalScore: number;
  tier: string;
  isPendingEmployerTier: boolean;
  isPendingBehaviour: boolean;
  isPendingBankVerified: boolean;
  isPendingEmploymentVerified: boolean;
  isIdVerified: boolean;
  monthlyIncome: number;
  targetRent: number;
  employmentDurationMonths: number;
}

interface Tip {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  potentialPoints: number;
}

export const FlexiScoreImprovementTips = ({
  incomeScore,
  affordabilityScore,
  employmentScore,
  behaviourScore,
  verificationScore,
  totalScore,
  tier,
  isPendingEmployerTier,
  isPendingBehaviour,
  isPendingBankVerified,
  isPendingEmploymentVerified,
  isIdVerified,
  monthlyIncome,
  targetRent,
  employmentDurationMonths,
}: FlexiScoreImprovementTipsProps) => {
  const tips = useMemo((): Tip[] => {
    const generated: Tip[] = [];

    // Sort factors by gap (max - current) to find weakest areas
    const factors = [
      { key: "income", score: incomeScore, max: 35 },
      { key: "affordability", score: affordabilityScore, max: 25 },
      { key: "employment", score: employmentScore, max: 15 },
      { key: "behaviour", score: behaviourScore, max: 15 },
      { key: "verification", score: verificationScore, max: 10 },
    ].sort((a, b) => (b.max - b.score) - (a.max - a.score));

    const weakest = factors[0];

    // Income tips
    if (incomeScore < 25) {
      const gap = 35 - incomeScore;
      generated.push({
        id: "income",
        icon: Wallet,
        title: "Boost Your Income Score",
        description: monthlyIncome > 0 && targetRent > 0
          ? `Your income-to-rent ratio is ${(monthlyIncome / targetRent).toFixed(1)}x. Aim for 3x or higher to maximize this score. Consider additional income streams or a lower rent target.`
          : "Enter your income and target rent to see personalized advice on improving this score.",
        impact: gap > 15 ? "high" : gap > 8 ? "medium" : "low",
        potentialPoints: gap,
      });
    }

    if (employmentDurationMonths < 12 && incomeScore < 35) {
      generated.push({
        id: "tenure",
        icon: Briefcase,
        title: "Build Employment Tenure",
        description: employmentDurationMonths < 6
          ? `At ${employmentDurationMonths} months, you're missing the stability bonus. Reaching 6 months adds +2 points, and 12 months adds +5 points.`
          : `At ${employmentDurationMonths} months, you earn a +2 bonus. Reaching 12 months will upgrade this to +5 points.`,
        impact: "medium",
        potentialPoints: employmentDurationMonths < 6 ? 5 : 3,
      });
    }

    // Affordability tips
    if (affordabilityScore < 18 && monthlyIncome > 0 && targetRent > 0) {
      const rentRatio = targetRent / monthlyIncome;
      generated.push({
        id: "affordability",
        icon: TrendingUp,
        title: "Improve Rent Affordability",
        description: `Your rent is ${Math.round(rentRatio * 100)}% of income. Keeping rent under 30% of income earns the maximum 25 points. Consider properties with lower rent to improve this score.`,
        impact: affordabilityScore < 10 ? "high" : "medium",
        potentialPoints: 25 - affordabilityScore,
      });
    }

    // Verification tips
    if (verificationScore < 10) {
      const missing: string[] = [];
      if (!isIdVerified) missing.push("Government ID");
      if (isPendingBankVerified) missing.push("Bank Account");
      if (isPendingEmploymentVerified) missing.push("Employment");

      if (missing.length > 0) {
        generated.push({
          id: "verification",
          icon: ShieldCheck,
          title: "Complete Your Verifications",
          description: `Verify your ${missing.join(", ")} to earn up to ${10 - verificationScore} more points. ${!isIdVerified ? "Start by submitting your Government ID in the Identity Verification tab." : "Pending verifications will be reviewed by an administrator."}`,
          impact: missing.length >= 2 ? "high" : "medium",
          potentialPoints: 10 - verificationScore,
        });
      }
    }

    // Admin-dependent tips
    if (isPendingEmployerTier) {
      generated.push({
        id: "employer",
        icon: Briefcase,
        title: "Get Your Employer Tier Verified",
        description: "Your employer tier is set to 'Informal' by default. Once an administrator verifies your employer, your Employment Type score could increase from 3 to up to 15 points.",
        impact: "high",
        potentialPoints: 15 - employmentScore,
      });
    }

    if (isPendingBehaviour) {
      generated.push({
        id: "behaviour",
        icon: CreditCard,
        title: "Build a Clean Payment Record",
        description: "Your payment behaviour defaults to 'Frequent Issues' until verified. A clean payment history can boost this score from 3 to 15 points. Pay all bills on time consistently.",
        impact: "high",
        potentialPoints: 15 - behaviourScore,
      });
    }

    // Tier-based encouragement
    if (tier === "D" && totalScore < 25) {
      generated.push({
        id: "tier-up-d",
        icon: Target,
        title: "Reach Tier C for More Plans",
        description: `You need ${25 - totalScore} more points to unlock Tier C and access the Flexi75 payment plan. Focus on the highest-impact tips above.`,
        impact: "high",
        potentialPoints: 25 - totalScore,
      });
    } else if (tier === "C" && totalScore < 50) {
      generated.push({
        id: "tier-up-c",
        icon: Target,
        title: "Reach Tier B for Flexi50",
        description: `You're ${50 - totalScore} points away from Tier B, which unlocks the Flexi50 payment plan. Keep improving your weakest factors.`,
        impact: "medium",
        potentialPoints: 50 - totalScore,
      });
    } else if (tier === "B" && totalScore < 70) {
      generated.push({
        id: "tier-up-b",
        icon: Target,
        title: "Push for Tier A – Premium",
        description: `Only ${70 - totalScore} points to Tier A! This unlocks FlexiMonthly, the most flexible payment plan available.`,
        impact: "medium",
        potentialPoints: 70 - totalScore,
      });
    }

    // Sort by potential points descending, take top 4
    return generated.sort((a, b) => b.potentialPoints - a.potentialPoints).slice(0, 4);
  }, [incomeScore, affordabilityScore, employmentScore, behaviourScore, verificationScore, totalScore, tier, isPendingEmployerTier, isPendingBehaviour, isPendingBankVerified, isPendingEmploymentVerified, isIdVerified, monthlyIncome, targetRent, employmentDurationMonths]);

  const getImpactBadge = (impact: Tip["impact"]) => {
    switch (impact) {
      case "high":
        return <Badge variant="destructive" className="text-xs">High Impact</Badge>;
      case "medium":
        return <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">Medium Impact</Badge>;
      case "low":
        return <Badge variant="outline" className="text-xs">Low Impact</Badge>;
    }
  };

  if (tips.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">How to Improve Your Score</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {tips.length} Tip{tips.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <CardDescription>
          {tier === "A"
            ? "Great job! Maintain your score to keep Tier A benefits."
            : "Focus on these areas to unlock better payment plans."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tips.map((tip) => (
            <div
              key={tip.id}
              className="flex gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
            >
              <div className="flex-shrink-0">
                <div
                  className={`p-2 rounded-full ${
                    tip.impact === "high"
                      ? "bg-red-500/10"
                      : tip.impact === "medium"
                      ? "bg-yellow-500/10"
                      : "bg-green-500/10"
                  }`}
                >
                  <tip.icon
                    className={`h-5 w-5 ${
                      tip.impact === "high"
                        ? "text-red-500"
                        : tip.impact === "medium"
                        ? "text-yellow-500"
                        : "text-green-500"
                    }`}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-medium text-sm">{tip.title}</h4>
                  {getImpactBadge(tip.impact)}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ArrowUp className="h-3 w-3" />
                    +{tip.potentialPoints} pts
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
