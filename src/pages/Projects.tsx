import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Building2, Home, CheckCircle2, Clock, PauseCircle } from "lucide-react";
import { toast } from "sonner";

// --- Data ---
const phases = [
  { num: 1, name: "Land preparation & survey", status: "done" },
  { num: 2, name: "Foundation & substructure", status: "done" },
  { num: 3, name: "Superstructure & walling", status: "done" },
  { num: 4, name: "Roofing — 60%", status: "active" },
  { num: 5, name: "Electrical & plumbing", status: "pending" },
  { num: 6, name: "Plastering & screed", status: "pending" },
  { num: 7, name: "Finishes & fixtures", status: "pending" },
  { num: 8, name: "External works & handover", status: "pending" },
];

interface ProjectCard {
  name: string;
  location: string;
  phase: string;
  phaseNum: string;
  pct: number;
  eta: string;
  status: "active" | "hold";
  type: string;
  gradient: string;
  region: string;
}

const activeProjects: ProjectCard[] = [
  { name: "Tema Horizon — Unit 2", location: "Tema, Greater Accra", phase: "Foundation", phaseNum: "2 of 7", pct: 28, eta: "Mar 2026", status: "active", type: "2-BED", gradient: "from-blue-100 to-blue-300", region: "tema" },
  { name: "East Legon Villa", location: "East Legon, Accra", phase: "Substructure", phaseNum: "3 of 6", pct: 35, eta: "TBD", status: "hold", type: "1-BED", gradient: "from-amber-100 to-amber-300", region: "accra" },
  { name: "Spintex Duplex — Tower B", location: "Spintex, Accra", phase: "Land prep", phaseNum: "Just started", pct: 8, eta: "Jun 2026", status: "active", type: "3-BED", gradient: "from-emerald-100 to-emerald-300", region: "accra" },
];

interface CompletedProject {
  name: string;
  location: string;
  type: string;
  year: string;
  icon: string;
  region: string;
}

const completedProjects: CompletedProject[] = [
  { name: "Labone Court — Block C", location: "Labone, Accra", type: "3-bed", year: "2024", icon: "🏠", region: "accra" },
  { name: "Harbour View — Unit 5", location: "Tema, Greater Accra", type: "2-bed", year: "2024", icon: "🏢", region: "tema" },
  { name: "Dzorwulu Heights — A2", location: "Dzorwulu, Accra", type: "3-bed", year: "2023", icon: "🏡", region: "accra" },
  { name: "Osu Executive Studio", location: "Osu, Accra", type: "1-bed", year: "2023", icon: "🏘", region: "accra" },
  { name: "Cantonments Garden Flat", location: "Cantonments, Accra", type: "2-bed", year: "2023", icon: "🏗", region: "accra" },
  { name: "Tema Waterfront — Block D", location: "Tema, Greater Accra", type: "3-bed", year: "2022", icon: "🏙", region: "tema" },
];

const expertisePhases = [
  { phase: "Phase 1–2 · Groundwork", experts: ["Land surveyor", "Geotechnical engineer", "Site supervisor", "Quantity surveyor (QS)", "Town planner / liaison"] },
  { phase: "Phase 3–4 · Structure", experts: ["Structural engineer", "Reinforcement team", "Block layer / mason", "Roofing contractor", "Timber / truss specialist"] },
  { phase: "Phase 5–6 · MEP & Render", experts: ["Electrical engineer", "Licensed plumber", "MEP inspector (3rd party)", "Plasterer / renderer", "Floor screed specialist"] },
  { phase: "Phase 7–8 · Finishes", experts: ["Interior fit-out team", "Tiler (floor & wall)", "Painter & decorator", "HVAC technician", "Landscaping contractor"] },
];

type FilterType = "all" | "active" | "hold" | "complete" | "3bed" | "2bed" | "1bed" | "accra" | "tema";

const filters: { label: string; value: FilterType; dot?: string }[] = [
  { label: "All (18)", value: "all" },
  { label: "Active (4)", value: "active", dot: "bg-emerald-500" },
  { label: "On hold (1)", value: "hold", dot: "bg-amber-500" },
  { label: "Completed (14)", value: "complete", dot: "bg-muted-foreground" },
  { label: "3-bedroom", value: "3bed" },
  { label: "2-bedroom", value: "2bed" },
  { label: "1-bedroom", value: "1bed" },
  { label: "Accra", value: "accra" },
  { label: "Tema", value: "tema" },
];

const Projects = () => {
  const [filter, setFilter] = useState<FilterType>("all");
  const [projectModal, setProjectModal] = useState<{ name: string; sub: string; phase: string; pct: string; eta: string } | null>(null);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  const matchesFilter = (status: string, type: string, region: string) => {
    if (filter === "all") return true;
    if (filter === "active" || filter === "hold" || filter === "complete") return status === filter;
    if (filter === "3bed") return type.toLowerCase().includes("3");
    if (filter === "2bed") return type.toLowerCase().includes("2");
    if (filter === "1bed") return type.toLowerCase().includes("1");
    if (filter === "accra") return region === "accra";
    if (filter === "tema") return region === "tema";
    return true;
  };

  const showFeatured = matchesFilter("active", "3-bed", "accra");
  const filteredActive = activeProjects.filter(p => matchesFilter(p.status, p.type, p.region));
  const filteredCompleted = completedProjects.filter(p => matchesFilter("complete", p.type, p.region));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Hero */}
        <section className="max-w-[1200px] mx-auto px-6 md:px-10 pt-20 pb-14">
          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 tracking-[2.5px] uppercase mb-5 flex items-center gap-2">
            <span className="w-8 h-0.5 bg-emerald-700 dark:bg-emerald-400" />
            Our construction portfolio
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground leading-[1.05] tracking-tight mb-5">
            Projects built on<br />
            <em className="text-emerald-700 dark:text-emerald-400 italic">trust, transparency</em><br />
            and expertise.
          </h1>
          <p className="text-base text-muted-foreground max-w-[560px] leading-relaxed mb-5">
            FlexiRents manages end-to-end construction projects for diaspora Ghanaians and local investors — from land preparation to key handover, with full accountability every step of the way.
          </p>
          <div className="text-sm text-muted-foreground bg-muted rounded-lg p-3 px-4 max-w-[560px] border-l-[3px] border-emerald-700 dark:border-emerald-400 leading-relaxed mb-10">
            <strong>About this page:</strong> This is our public project portfolio. We share phase progress, locations, and general project details — but we never display client names, financial figures, or private information. For your project dashboard, log into your client account.
          </div>
          <div className="flex gap-10 flex-wrap pt-8 border-t border-border">
            {[
              { val: "14", lbl: "Completed projects" },
              { val: "4", lbl: "Active builds" },
              { val: "9", lbl: "Diaspora clients" },
              { val: "4.8★", lbl: "Client satisfaction" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-10">
                {i > 0 && <div className="w-px h-12 bg-border -ml-5 hidden sm:block" />}
                <div>
                  <div className="font-serif text-4xl font-bold text-foreground leading-none">{s.val}</div>
                  <div className="text-xs text-muted-foreground mt-1 tracking-wide">{s.lbl}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Filter Bar */}
        <div className="bg-card border-y border-border sticky top-16 z-40">
          <div className="max-w-[1200px] mx-auto px-6 md:px-10 h-14 flex items-center gap-2 overflow-x-auto scrollbar-none">
            {filters.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-all ${
                  filter === f.value
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                }`}
              >
                {f.dot && <span className={`w-[7px] h-[7px] rounded-full ${f.dot}`} />}
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-6 md:px-10 pb-20">
          {/* Featured */}
          {showFeatured && (
            <div className="bg-foreground rounded-[20px] overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_420px] min-h-[380px] mt-10 mb-12">
              <div className="p-10 md:p-[52px]">
                <div className="text-[10px] font-bold text-emerald-400 tracking-[2px] uppercase mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Featured active project
                </div>
                <div className="font-serif text-3xl md:text-[42px] font-bold text-white leading-[1.1] mb-2.5 tracking-tight">
                  Adenta Rise<br />Block A
                </div>
                <div className="text-[13px] text-white/40 mb-7 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Adenta, Greater Accra · 3-bedroom unit
                </div>
                <div className="text-[10px] text-white/30 tracking-[1px] uppercase mb-2">Overall progress</div>
                <div className="h-[5px] bg-white/10 rounded-full mb-6">
                  <div className="h-[5px] rounded-full bg-amber-500" style={{ width: "52%" }} />
                </div>
                <div className="flex gap-7 flex-wrap">
                  {[
                    { val: "Phase 4/8", lbl: "Current phase" },
                    { val: "Roofing", lbl: "Phase name" },
                    { val: "52%", lbl: "Complete" },
                    { val: "Dec 2025", lbl: "Est. completion" },
                  ].map((m, i) => (
                    <div key={i}>
                      <strong className="block text-[17px] font-bold text-white mb-0.5">{m.val}</strong>
                      <span className="text-xs text-white/40">{m.lbl}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-emerald-100 dark:bg-emerald-900/30 hidden lg:flex flex-col justify-center px-9 py-9">
                <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 tracking-[1.5px] uppercase mb-4">Phase tracker</div>
                <div className="flex flex-col">
                  {phases.map(p => (
                    <div key={p.num} className="flex items-center gap-2.5 py-2.5 border-b border-emerald-700/10 last:border-b-0">
                      <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-bold ${
                        p.status === "done" ? "bg-emerald-600 text-white" :
                        p.status === "active" ? "bg-amber-500 text-white" :
                        "bg-emerald-700/10 text-emerald-800 dark:text-emerald-300"
                      }`}>
                        {p.num}
                      </div>
                      <span className={`text-xs flex-1 ${
                        p.status === "active" ? "text-amber-800 dark:text-amber-400 font-semibold" : "text-foreground/70"
                      }`}>
                        {p.name}
                      </span>
                      {p.status === "done" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {p.status === "active" && <span className="text-[10px] text-amber-600 font-medium">active</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Builds */}
          {filteredActive.length > 0 && (
            <>
              <div className="flex items-baseline justify-between mt-10 mb-6 flex-wrap gap-2">
                <h2 className="font-serif text-[28px] font-bold text-foreground tracking-tight">Active builds</h2>
                <span className="font-mono text-xs text-muted-foreground">{filteredActive.length} project{filteredActive.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
                {filteredActive.map((p, i) => (
                  <div
                    key={i}
                    onClick={() => setProjectModal({ name: p.name, sub: `${p.type.toLowerCase().replace("-", "-bedroom · ")} · ${p.location}`, phase: `Phase ${p.phaseNum} — ${p.phase}`, pct: `${p.pct}%`, eta: p.eta })}
                    className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className={`h-[172px] relative flex items-center justify-center bg-gradient-to-br ${p.gradient}`}>
                      {p.status === "active" ? (
                        <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">● Active</div>
                      ) : (
                        <div className="absolute top-3 left-3 bg-amber-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">⏸ On hold</div>
                      )}
                      <div className="absolute top-3 right-3 bg-white/90 text-foreground/70 text-[10px] font-semibold font-mono px-2.5 py-1 rounded-full">{p.type}</div>
                      <Building2 className="w-14 h-14 opacity-20 text-foreground" />
                    </div>
                    <div className="p-[18px]">
                      <div className="font-serif text-[17px] font-semibold text-foreground mb-1 leading-tight">{p.name}</div>
                      <div className="text-xs text-muted-foreground mb-3.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}</div>
                      <div className="flex justify-between text-[11px] mb-1.5">
                        <span className="text-muted-foreground">Phase — {p.phase}</span>
                        <span className={`font-mono font-medium ${p.status === "active" ? "text-emerald-600" : "text-amber-600"}`}>{p.pct}%</span>
                      </div>
                      <div className="h-[3px] bg-muted rounded-full mb-3.5">
                        <div className={`h-[3px] rounded-full ${p.status === "active" ? "bg-emerald-600" : "bg-amber-500"}`} style={{ width: `${p.pct}%` }} />
                      </div>
                      <div className="flex justify-between text-[11px] pt-3 border-t border-border">
                        <span className="text-muted-foreground">{p.phaseNum} phases</span>
                        <span className={`font-medium ${p.status === "hold" ? "text-amber-600" : "text-foreground/70"}`}>
                          {p.status === "hold" ? "Paused" : `ETA ${p.eta}`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Expertise */}
          {(filter === "all" || filter === "active") && (
            <div className="bg-foreground rounded-[20px] p-10 md:p-12 mb-12">
              <div className="flex items-start justify-between gap-6 mb-7 flex-wrap">
                <div>
                  <div className="font-serif text-2xl font-bold text-white tracking-tight">Our expert network</div>
                  <div className="text-[13px] text-white/40 mt-1.5 max-w-[400px] leading-relaxed">
                    Every FlexiRents project draws from a verified network of specialists. Each phase uses the right experts — no generalists cutting corners.
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {expertisePhases.map((ep, i) => (
                  <div key={i} className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-[18px]">
                    <div className="text-[10px] text-amber-500 font-bold tracking-[0.5px] uppercase mb-2.5">{ep.phase}</div>
                    <div className="flex flex-col gap-[3px]">
                      {ep.experts.map((e, j) => (
                        <div key={j} className="text-xs text-white/60 py-1 border-b border-white/[0.04] last:border-b-0">{e}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {filteredCompleted.length > 0 && (
            <>
              <div className="flex items-baseline justify-between mt-10 mb-6 flex-wrap gap-2">
                <h2 className="font-serif text-[28px] font-bold text-foreground tracking-tight">Completed projects</h2>
                <span className="font-mono text-xs text-muted-foreground">{filteredCompleted.length} delivered</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-12">
                {filteredCompleted.map((p, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-[18px] flex gap-3.5 cursor-pointer transition-shadow hover:shadow-md">
                    <div className="w-[42px] h-[42px] rounded-[10px] bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-lg flex-shrink-0">
                      {p.icon}
                    </div>
                    <div>
                      <div className="font-serif text-[15px] font-semibold text-foreground mb-0.5">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground mb-1.5">{p.location}</div>
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-medium">✓ Delivered</span>
                        <span className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-full font-medium">{p.type}</span>
                      </div>
                      <div className="font-mono text-[10px] text-border mt-1.5">{p.year}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* CTA */}
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200/30 rounded-[20px] p-10 md:p-11 text-center mb-12 mt-12">
            <h2 className="font-serif text-[30px] font-bold text-foreground mb-2.5 tracking-tight">Ready to build in Ghana?</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-[480px] mx-auto">
              We handle everything from land to key handover — wherever you are in the world. Phased payments, full transparency, expert team.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button onClick={() => setEnquiryOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white px-7 py-3 text-sm font-semibold rounded-[10px]">
                Start your project
              </Button>
              <Button variant="outline" className="border-foreground text-foreground hover:bg-foreground hover:text-background px-7 py-3 text-sm font-semibold rounded-[10px]" asChild>
                <a href="/auth">View client portal</a>
              </Button>
            </div>
          </div>
        </div>

        {/* Project Detail Modal */}
        <Dialog open={!!projectModal} onOpenChange={() => setProjectModal(null)}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">{projectModal?.name}</DialogTitle>
              <DialogDescription>{projectModal?.sub}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="font-serif text-xl font-bold text-emerald-700 dark:text-emerald-400">{projectModal?.pct}</div>
                <div className="text-[11px] text-muted-foreground">Complete</div>
              </div>
              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="font-serif text-base font-bold">{projectModal?.eta}</div>
                <div className="text-[11px] text-muted-foreground">Est. completion</div>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center mb-4">
              <div className="text-[13px] font-medium">{projectModal?.phase}</div>
              <div className="text-[11px] text-muted-foreground">Current phase</div>
            </div>
            <div className="bg-muted rounded-[10px] p-3.5 text-[13px] text-muted-foreground leading-relaxed mb-4">
              Client details, financial figures, and contact information are private. To view your specific project, log into your client account. To enquire about a similar project, use the form below.
            </div>
            <Button onClick={() => { setProjectModal(null); setEnquiryOpen(true); }} className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-[10px]">
              Enquire about a similar project
            </Button>
          </DialogContent>
        </Dialog>

        {/* Enquiry Modal */}
        <Dialog open={enquiryOpen} onOpenChange={setEnquiryOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Start your project</DialogTitle>
              <DialogDescription>We respond within 24 hours. Your details are private — always.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Full name</Label><Input placeholder="Your full name" /></div>
              <div><Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Email</Label><Input type="email" placeholder="you@email.com" /></div>
              <div><Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Your location</Label><Input placeholder="e.g. London, UK or Accra, Ghana" /></div>
              <div>
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Project type</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1bed">1-bedroom unit</SelectItem>
                    <SelectItem value="2bed">2-bedroom unit</SelectItem>
                    <SelectItem value="3bed">3-bedroom unit</SelectItem>
                    <SelectItem value="3plus">3+ bedroom / custom</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Preferred location (build)</Label><Input placeholder="e.g. Adenta, Accra or Tema" /></div>
              <div>
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Budget range (₵ GHS)</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="u200">Under ₵200,000</SelectItem>
                    <SelectItem value="200-400">₵200K–₵400K</SelectItem>
                    <SelectItem value="400-700">₵400K–₵700K</SelectItem>
                    <SelectItem value="700-1m">₵700K–₵1M</SelectItem>
                    <SelectItem value="1m+">Above ₵1M</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-[10px] mt-1"
                onClick={() => { toast.success("Enquiry submitted! We'll contact you within 24 hours."); setEnquiryOpen(false); }}
              >
                Submit enquiry
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Footer />
      </div>
    </div>
  );
};

export default Projects;
