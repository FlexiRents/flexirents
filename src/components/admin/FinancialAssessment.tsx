import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Lock, CheckCircle, AlertTriangle, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { calculateFIGScore, TIER_PLANS, type FIGResult } from "@/lib/figScoring";
import { useAuth } from "@/contexts/AuthContext";

interface Assessment {
  id: string;
  user_id: string;
  monthly_net_income: number;
  income_source: string;
  employer_tier: string;
  employment_duration_months: number;
  target_rent: number;
  payment_behaviour: string;
  has_prior_flexirent_history: boolean;
  gov_id_verified: boolean;
  bank_verified: boolean;
  employment_verified: boolean;
  income_score: number;
  affordability_score: number;
  employment_score: number;
  behaviour_score: number;
  verification_score: number;
  total_score: number;
  tier: string;
  is_overridden: boolean;
  override_tier: string | null;
  override_reason: string | null;
  score_frozen: boolean;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string | null } | null;
}

export default function FinancialAssessment() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Assessment | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Assessment>>({});
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideTier, setOverrideTier] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => { fetchAssessments(); }, []);

  const fetchAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from("financial_assessments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = data?.map((d: any) => d.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);
      const enriched = data?.map((a: any) => ({ ...a, profiles: profileMap.get(a.user_id) || null })) || [];
      setAssessments(enriched);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      toast({ title: "Error", description: "Failed to load assessments", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAssessment = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      const scores = calculateFIGScore({
        monthly_net_income: Number(editForm.monthly_net_income) || 0,
        target_rent: Number(editForm.target_rent) || 0,
        income_source: editForm.income_source || "salary",
        employer_tier: editForm.employer_tier || "sme",
        employment_duration_months: Number(editForm.employment_duration_months) || 0,
        payment_behaviour: editForm.payment_behaviour || "clean",
        gov_id_verified: editForm.gov_id_verified || false,
        bank_verified: editForm.bank_verified || false,
        employment_verified: editForm.employment_verified || false,
      });

      const { error } = await supabase
        .from("financial_assessments")
        .update({
          monthly_net_income: Number(editForm.monthly_net_income) || 0,
          target_rent: Number(editForm.target_rent) || 0,
          income_source: editForm.income_source,
          employer_tier: editForm.employer_tier,
          employment_duration_months: Number(editForm.employment_duration_months) || 0,
          payment_behaviour: editForm.payment_behaviour,
          gov_id_verified: editForm.gov_id_verified,
          bank_verified: editForm.bank_verified,
          employment_verified: editForm.employment_verified,
          ...scores,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selected.id);
      if (error) throw error;
      toast({ title: "Success", description: "Assessment updated & score recalculated" });
      setEditing(false);
      setSelected(null);
      fetchAssessments();
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to save assessment", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleOverride = async () => {
    if (!selected || !overrideTier || !overrideReason.trim()) {
      toast({ title: "Error", description: "Select a tier and provide a reason", variant: "destructive" });
      return;
    }
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("financial_assessments")
        .update({
          is_overridden: true,
          override_tier: overrideTier,
          override_reason: overrideReason,
          overridden_by: user?.id,
          overridden_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", selected.id);
      if (error) throw error;
      toast({ title: "Success", description: `Tier overridden to ${overrideTier}` });
      setSelected(null);
      setOverrideReason("");
      setOverrideTier("");
      fetchAssessments();
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Override failed", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const getTierBadge = (tier: string, overridden?: boolean) => {
    const colors: Record<string, string> = {
      A: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      B: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      C: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      D: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return (
      <Badge className={`${colors[tier] || ""} ${overridden ? "ring-2 ring-orange-400" : ""}`}>
        Tier {tier} {overridden && "(Override)"}
      </Badge>
    );
  };

  const ScoreBar = ({ label, score, max }: { label: string; score: number; max: number }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score}/{max}</span>
      </div>
      <Progress value={(score / max) * 100} className="h-2" />
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Financial Assessment (FIG)</h2>
        <p className="text-muted-foreground mt-2">
          Flexi-Instalment Gauge — review scores, tiers, and manage overrides
        </p>
      </div>

      {assessments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No financial assessments found. Assessments are created when users complete verification.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assessments.map((a) => {
            const effectiveTier = a.is_overridden && a.override_tier ? a.override_tier : a.tier;
            const plans = TIER_PLANS[effectiveTier] || TIER_PLANS.D;
            return (
              <Card key={a.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{a.profiles?.full_name || "Unknown User"}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Score: {a.total_score}% • Updated: {new Date(a.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.score_frozen && <Badge variant="outline"><Lock className="h-3 w-3 mr-1" />Frozen</Badge>}
                      {getTierBadge(effectiveTier, a.is_overridden)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    <ScoreBar label="Income" score={a.income_score} max={35} />
                    <ScoreBar label="Affordability" score={a.affordability_score} max={25} />
                    <ScoreBar label="Employment" score={a.employment_score} max={15} />
                    <ScoreBar label="Behaviour" score={a.behaviour_score} max={15} />
                    <ScoreBar label="Verification" score={a.verification_score} max={10} />
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {plans.allowed.map((p) => (
                      <Badge key={p} variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />{p}
                      </Badge>
                    ))}
                    {plans.locked.map((p) => (
                      <Badge key={p} variant="secondary" className="opacity-60">
                        <Lock className="h-3 w-3 mr-1" />{p}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => {
                      setSelected(a);
                      setEditForm(a);
                      setEditing(true);
                    }}>
                      Edit Assessment
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      setSelected(a);
                      setOverrideTier(a.override_tier || "");
                      setOverrideReason(a.override_reason || "");
                    }}>
                      <Shield className="h-4 w-4 mr-1" />Override Tier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Assessment Dialog */}
      <Dialog open={editing} onOpenChange={() => setEditing(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Financial Assessment</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Monthly Net Income (GHS)</Label>
              <Input type="number" value={editForm.monthly_net_income || ""} onChange={(e) => setEditForm({ ...editForm, monthly_net_income: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Target Rent (GHS)</Label>
              <Input type="number" value={editForm.target_rent || ""} onChange={(e) => setEditForm({ ...editForm, target_rent: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Income Source</Label>
              <Select value={editForm.income_source || "salary"} onValueChange={(v) => setEditForm({ ...editForm, income_source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="informal">Informal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Employer Tier</Label>
              <Select value={editForm.employer_tier || "sme"} onValueChange={(v) => setEditForm({ ...editForm, employer_tier: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="govt_tier1">Govt / Tier-1 Corp</SelectItem>
                  <SelectItem value="sme">SME</SelectItem>
                  <SelectItem value="contract">Contract / Consultant</SelectItem>
                  <SelectItem value="self_employed">Self-employed</SelectItem>
                  <SelectItem value="informal">Informal / Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Employment Duration (months)</Label>
              <Input type="number" value={editForm.employment_duration_months || ""} onChange={(e) => setEditForm({ ...editForm, employment_duration_months: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Payment Behaviour</Label>
              <Select value={editForm.payment_behaviour || "clean"} onValueChange={(v) => setEditForm({ ...editForm, payment_behaviour: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="clean">Clean & Consistent</SelectItem>
                  <SelectItem value="minor_volatility">Minor Volatility</SelectItem>
                  <SelectItem value="frequent_issues">Frequent Issues</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={editForm.gov_id_verified || false} onCheckedChange={(v) => setEditForm({ ...editForm, gov_id_verified: v })} />
                <Label>Gov ID Verified</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editForm.bank_verified || false} onCheckedChange={(v) => setEditForm({ ...editForm, bank_verified: v })} />
                <Label>Bank Verified</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editForm.employment_verified || false} onCheckedChange={(v) => setEditForm({ ...editForm, employment_verified: v })} />
                <Label>Employment Verified</Label>
              </div>
            </div>
          </div>
          {editForm.monthly_net_income && editForm.target_rent ? (
            <div className="mt-4 p-4 rounded-lg border bg-muted/50">
              <p className="text-sm font-medium mb-2">Live Score Preview</p>
              {(() => {
                const preview = calculateFIGScore({
                  monthly_net_income: Number(editForm.monthly_net_income) || 0,
                  target_rent: Number(editForm.target_rent) || 0,
                  income_source: editForm.income_source || "salary",
                  employer_tier: editForm.employer_tier || "sme",
                  employment_duration_months: Number(editForm.employment_duration_months) || 0,
                  payment_behaviour: editForm.payment_behaviour || "clean",
                  gov_id_verified: editForm.gov_id_verified || false,
                  bank_verified: editForm.bank_verified || false,
                  employment_verified: editForm.employment_verified || false,
                });
                return (
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold">{preview.total_score}%</span>
                    {getTierBadge(preview.tier)}
                  </div>
                );
              })()}
            </div>
          ) : null}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={handleSaveAssessment} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save & Recalculate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Override Dialog */}
      <Dialog open={!!selected && !editing} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <AlertTriangle className="h-5 w-5 inline mr-2 text-orange-500" />
              Override Tier — {selected?.profiles?.full_name}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Current calculated score: {selected?.total_score}% (Tier {selected?.tier}). Overrides are logged and auditable.
          </p>
          <div className="space-y-4 mt-4">
            <div>
              <Label>New Tier</Label>
              <Select value={overrideTier} onValueChange={setOverrideTier}>
                <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Tier A</SelectItem>
                  <SelectItem value="B">Tier B</SelectItem>
                  <SelectItem value="C">Tier C</SelectItem>
                  <SelectItem value="D">Tier D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason (required, logged)</Label>
              <Textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Provide justification for this override..." rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={handleOverride} disabled={processing} className="bg-orange-600 hover:bg-orange-700">
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
              Apply Override
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
