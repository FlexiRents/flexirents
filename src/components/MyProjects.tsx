import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Building2, Camera, CheckCircle2, AlertTriangle, 
  ChevronRight, Clock, MapPin, Calendar
} from "lucide-react";

const phases = ["Land", "Found.", "Structure", "Roof", "MEP", "Plaster", "Finish", "Handover"];

interface Project {
  id: string;
  name: string;
  subtitle: string;
  location: string;
  percentComplete: number;
  currentPhase: number;
  estimatedHandover: string;
  totalBudget: number;
  paidToDate: number;
  tranchesPaid: number;
  nextPayment: number;
  nextPaymentLabel: string;
  remaining: number;
  tranchesLeft: number;
  recentActivity: {
    icon: "camera" | "check" | "warning";
    title: string;
    meta: string;
    detail: string;
  }[];
  nextSteps: {
    label: string;
    timeline: string;
    badgeVariant: "next" | "soon" | "then" | "date";
  }[];
}

const sampleProject: Project = {
  id: "1",
  name: "Adenta Rise — Block A",
  subtitle: "3-bedroom · Adenta, Greater Accra",
  location: "Adenta, Greater Accra",
  percentComplete: 52,
  currentPhase: 4,
  estimatedHandover: "Dec '25",
  totalBudget: 620000,
  paidToDate: 310000,
  tranchesPaid: 3,
  nextPayment: 95000,
  nextPaymentLabel: "Tranche 4 · roofing",
  remaining: 215000,
  tranchesLeft: 4,
  recentActivity: [
    {
      icon: "camera",
      title: "18 site photos uploaded — roofing",
      meta: "2 days ago · Site supervisor · Auto-synced",
      detail: "Trusses 70% complete on north wing. Building on schedule.",
    },
    {
      icon: "check",
      title: "Phase 3 completion certificate issued",
      meta: "6 weeks ago · QS Darko & Associates",
      detail: "Structural sign-off on superstructure complete.",
    },
    {
      icon: "warning",
      title: "Material advisory — within contingency",
      meta: "3 weeks ago · FlexiRents",
      detail: "Roofing sheets +9%. No extra cost to you — within buffer.",
    },
  ],
  nextSteps: [
    { label: "Roofing completed", timeline: "~3 weeks", badgeVariant: "next" },
    { label: "Tranche 4 invoice — ₵95K", timeline: "Auto-generated on sign-off", badgeVariant: "soon" },
    { label: "MEP rough-in begins", timeline: "Electricians & plumbers", badgeVariant: "then" },
    { label: "Estimated handover", timeline: "December 2025", badgeVariant: "date" },
  ],
};

const formatCedi = (amount: number) => {
  if (amount >= 1000) return `₵${Math.round(amount / 1000)}K`;
  return `₵${amount}`;
};

const ActivityIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "camera":
      return <div className="p-2 rounded-lg bg-amber-500/10"><Camera className="h-4 w-4 text-amber-500" /></div>;
    case "check":
      return <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="h-4 w-4 text-green-500" /></div>;
    case "warning":
      return <div className="p-2 rounded-lg bg-yellow-500/10"><AlertTriangle className="h-4 w-4 text-yellow-500" /></div>;
    default:
      return null;
  }
};

const TimelineBadge = ({ variant, label }: { variant: string; label: string }) => {
  const styles: Record<string, string> = {
    next: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    soon: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    then: "bg-muted text-muted-foreground border-border",
    date: "bg-green-500/20 text-green-400 border-green-500/30",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${styles[variant] || styles.then}`}>
      {label}
    </span>
  );
};

export default function MyProjects() {
  const { user } = useAuth();
  const [selectedProject] = useState<Project>(sampleProject);
  const [showAllUpdates, setShowAllUpdates] = useState(false);

  const project = selectedProject;
  const progressPercent = (project.currentPhase / phases.length) * 100;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {user?.user_metadata?.full_name?.split(" ")[0] || "there"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Latest update on your {project.name.split("—")[0].trim()} build — 2 hours ago
        </p>
      </div>

      {/* Active Project Card */}
      <Card className="border-border bg-card">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest text-amber-500 uppercase">Active Project</p>
              <h3 className="text-xl font-bold text-foreground mt-1">{project.name}</h3>
              <p className="text-sm text-muted-foreground">{project.subtitle}</p>
            </div>
            {/* Circular progress */}
            <div className="relative h-16 w-16 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeDasharray={`${project.percentComplete}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-amber-500">{project.percentComplete}%</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-3xl font-bold text-foreground">{project.percentComplete}%</span>
              <p className="text-xs text-muted-foreground uppercase">Complete</p>
            </div>
            <div className="border-l border-border pl-6">
              <span className="text-xl font-bold text-foreground">Phase {project.currentPhase}</span>
              <p className="text-xs text-muted-foreground uppercase">of {phases.length} phases</p>
            </div>
            <div className="border-l border-border pl-6">
              <span className="text-xl font-bold text-foreground">{project.estimatedHandover}</span>
              <p className="text-xs text-muted-foreground uppercase">Est. Handover</p>
            </div>
          </div>

          {/* Phase progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Phase progress</p>
              <p className="text-xs text-muted-foreground">{project.currentPhase}/{phases.length}</p>
            </div>
            <div className="relative">
              <Progress value={progressPercent} className="h-2" />
            </div>
            <div className="flex justify-between text-xs">
              {phases.map((phase, i) => (
                <span
                  key={phase}
                  className={`${
                    i < project.currentPhase
                      ? "text-primary font-medium"
                      : i === project.currentPhase - 1
                      ? "text-amber-500 font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {i === project.currentPhase - 1 && "▲ "}
                  {phase}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Total Budget</p>
            <p className="text-2xl font-bold text-foreground mt-1">{formatCedi(project.totalBudget)}</p>
            <p className="text-xs text-muted-foreground">~£41,300 approx.</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Paid to Date</p>
            <p className="text-2xl font-bold text-foreground mt-1">{formatCedi(project.paidToDate)}</p>
            <p className="text-xs text-muted-foreground">{Math.round((project.paidToDate / project.totalBudget) * 100)}% · {project.tranchesPaid} tranches</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Next Payment</p>
            <p className="text-2xl font-bold text-foreground mt-1">{formatCedi(project.nextPayment)}</p>
            <p className="text-xs text-muted-foreground">{project.nextPaymentLabel}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs font-semibold tracking-widest text-amber-500 uppercase">Remaining</p>
            <p className="text-2xl font-bold text-amber-500 mt-1">{formatCedi(project.remaining)}</p>
            <p className="text-xs text-muted-foreground">{project.tranchesLeft} tranches left</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity + Next Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent site activity */}
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <h4 className="font-semibold text-foreground mb-4">Recent site activity</h4>
            <div className="space-y-4">
              {project.recentActivity.map((activity, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg border border-border bg-muted/30">
                  <ActivityIcon type={activity.icon} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{activity.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.meta}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllUpdates(true)}
                className="text-xs"
              >
                View all updates →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* What happens next */}
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <h4 className="font-semibold text-foreground mb-4">What happens next</h4>
            <div className="space-y-3">
              {project.nextSteps.map((step, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{step.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.timeline}</p>
                  </div>
                  <TimelineBadge
                    variant={step.badgeVariant}
                    label={
                      step.badgeVariant === "next" ? "Next" :
                      step.badgeVariant === "soon" ? "Soon" :
                      step.badgeVariant === "then" ? "Then" :
                      project.estimatedHandover
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Updates Dialog */}
      <Dialog open={showAllUpdates} onOpenChange={setShowAllUpdates}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>All Project Updates</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {project.recentActivity.map((activity, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg border border-border">
                <ActivityIcon type={activity.icon} />
                <div>
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.meta}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
