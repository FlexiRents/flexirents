// Flexi-Instalment Gauge (FIG) Scoring Logic

export interface FIGInput {
  monthly_net_income: number;
  target_rent: number;
  income_source: string; // salary, contract, business, informal
  employer_tier: string; // govt_tier1, sme, contract, self_employed, informal
  employment_duration_months: number;
  payment_behaviour: string; // clean, minor_volatility, frequent_issues
  gov_id_verified: boolean;
  bank_verified: boolean;
  employment_verified: boolean;
}

export interface FIGResult {
  income_score: number;
  affordability_score: number;
  employment_score: number;
  behaviour_score: number;
  verification_score: number;
  total_score: number;
  tier: string;
}

export const TIER_PLANS: Record<string, { allowed: string[]; locked: string[] }> = {
  A: { allowed: ["FlexiMonthly", "Flexi50", "Flexi75", "Full Payment"], locked: [] },
  B: { allowed: ["Flexi50", "Flexi75", "Full Payment"], locked: ["FlexiMonthly"] },
  C: { allowed: ["Flexi75", "Full Payment"], locked: ["FlexiMonthly", "Flexi50"] },
  D: { allowed: ["Full Payment"], locked: ["FlexiMonthly", "Flexi50", "Flexi75"] },
};

export function calculateFIGScore(input: FIGInput): FIGResult {
  const incomeRatio = input.target_rent > 0 ? input.monthly_net_income / input.target_rent : 0;

  // 1. Income Strength & Stability (max 35)
  let income_score = 0;
  if (incomeRatio >= 3) income_score = 35;
  else if (incomeRatio >= 2) income_score = 25;
  else if (incomeRatio >= 1.5) income_score = 15;
  else income_score = Math.min(10, Math.round(incomeRatio * 7));

  // Consistency bonus
  if (input.employment_duration_months >= 12) income_score = Math.min(35, income_score + 5);
  else if (input.employment_duration_months >= 6) income_score = Math.min(35, income_score + 2);

  // 2. Rent Affordability (max 25)
  const rentRatio = input.monthly_net_income > 0 ? input.target_rent / input.monthly_net_income : 1;
  let affordability_score = 0;
  if (rentRatio <= 0.3) affordability_score = 25;
  else if (rentRatio <= 0.4) affordability_score = 18;
  else if (rentRatio <= 0.5) affordability_score = 10;
  else affordability_score = Math.min(5, Math.round((1 - rentRatio) * 10));

  // 3. Employment Type (max 15)
  const employmentScores: Record<string, number> = {
    govt_tier1: 15,
    sme: 12,
    contract: 9,
    self_employed: 7,
    informal: 3,
  };
  const employment_score = employmentScores[input.employer_tier] ?? 3;

  // 4. Payment Behaviour (max 15)
  const behaviourScores: Record<string, number> = {
    clean: 15,
    minor_volatility: 10,
    frequent_issues: 3,
  };
  const behaviour_score = behaviourScores[input.payment_behaviour] ?? 3;

  // 5. Verification Strength (max 10)
  let verification_score = 0;
  if (input.gov_id_verified) verification_score += 4;
  if (input.bank_verified) verification_score += 3;
  if (input.employment_verified) verification_score += 3;

  const total_score = Math.min(100, income_score + affordability_score + employment_score + behaviour_score + verification_score);

  let tier = "D";
  if (total_score >= 70) tier = "A";
  else if (total_score >= 50) tier = "B";
  else if (total_score >= 25) tier = "C";

  return { income_score, affordability_score, employment_score, behaviour_score, verification_score, total_score, tier };
}
