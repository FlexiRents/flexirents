import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { PhaseProgressBar } from "@/components/projects/PhaseProgressBar";
import { PhaseTimeline } from "@/components/projects/PhaseTimeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Building2, MapPin, Calendar, Star, Users, CheckCircle, HardHat, Zap, Paintbrush, Home, X } from "lucide-react";

type FilterType = 'all' | 'active' | 'hold' | 'complete' | '3bed' | '2bed' | '1bed' | '4plus' | 'commercial' | 'accra' | 'tema' | 'kumasi';

const filterPills: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'hold', label: 'On Hold' },
  { key: 'complete', label: 'Completed' },
  { key: '3bed', label: '3-Bed' },
  { key: '2bed', label: '2-Bed' },
  { key: '1bed', label: '1-Bed' },
  { key: '4plus', label: '4+ Bed' },
  { key: 'commercial', label: 'Commercial' },
  { key: 'accra', label: 'Accra' },
  { key: 'tema', label: 'Tema' },
  { key: 'kumasi', label: 'Kumasi' },
];

const expertiseGroups = [
  {
    phase: 'Ground & Foundation',
    icon: <HardHat className="h-6 w-6" />,
    experts: ['Land Surveyors', 'Geotechnical Engineers', 'Quantity Surveyors', 'Town Planners'],
  },
  {
    phase: 'Structure & Roof',
    icon: <Building2 className="h-6 w-6" />,
    experts: ['Structural Engineers', 'Masons & Block Layers', 'Roofing Contractors', 'Timber/Steel Specialists'],
  },
  {
    phase: 'MEP & Plaster',
    icon: <Zap className="h-6 w-6" />,
    experts: ['Electrical Engineers', 'Licensed Plumbers', 'MEP Inspectors', 'Plasterers & Renderers'],
  },
  {
    phase: 'Finishes & Handover',
    icon: <Paintbrush className="h-6 w-6" />,
    experts: ['Interior Fit-out Teams', 'Tilers & Painters', 'HVAC Technicians', 'Landscaping Contractors'],
  },
];

const Projects = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquiryData, setEnquiryData] = useState({ name: '', email: '', location: '', projectType: '', buildLocation: '', budgetRange: '' });
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['public-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('construction_projects')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allPhases = [] } = useQuery({
    queryKey: ['public-project-phases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_phases')
        .select('*')
        .order('number');
      if (error) throw error;
      return data;
    },
  });

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'all') return projects;
    if (['active', 'hold', 'complete'].includes(activeFilter))
      return projects.filter(p => p.status === activeFilter);
    if (['1bed', '2bed', '3bed', '4plus', 'commercial'].includes(activeFilter))
      return projects.filter(p => p.type === activeFilter);
    if (['accra', 'tema', 'kumasi'].includes(activeFilter))
      return projects.filter(p => p.neighbourhood.toLowerCase().includes(activeFilter) || p.location.toLowerCase().includes(activeFilter));
    return projects;
  }, [projects, activeFilter]);

  const activeProjects = projects.filter(p => p.status === 'active');
  const completedProjects = projects.filter(p => p.status === 'complete');
  const featuredProject = activeProjects[0];
  const featuredPhases = allPhases.filter(p => p.project_id === featuredProject?.id);

  const stats = {
    completed: completedProjects.length,
    active: activeProjects.length,
    diaspora: 9,
    rating: 4.8,
  };

  const typeBadge = (type: string) => {
    const labels: Record<string, string> = { '1bed': '1-Bed', '2bed': '2-Bed', '3bed': '3-Bed', '4plus': '4+ Bed', 'commercial': 'Commercial' };
    return labels[type] || type;
  };

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'Enquiry Submitted', description: 'We\'ll be in touch within 48 hours.' });
    setShowEnquiry(false);
    setEnquiryData({ name: '', email: '', location: '', projectType: '', buildLocation: '', budgetRange: '' });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F6F3EE' }}>
      <Navbar />

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold italic text-[#0D4D36] mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            Building Dreams Across Ghana
          </h1>
          <p className="text-lg text-[#0D4D36]/70 max-w-2xl mx-auto mb-6">
            From foundation to handover, we manage every phase of your construction project with complete transparency and professional expertise.
          </p>
          <div className="inline-block bg-[#E3F5ED] border border-[#1A7A56]/20 rounded-lg px-4 py-3 text-sm text-[#0D4D36]/80 mb-8">
            🔒 <strong>Public view</strong> — For privacy, client names, financial figures, and contact details are not shown on this page.
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {[
              { value: stats.completed, label: 'Completed' },
              { value: stats.active, label: 'Active' },
              { value: stats.diaspora, label: 'Diaspora Clients' },
              { value: `${stats.rating}★`, label: 'Satisfaction' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-[#1A7A56]">{s.value}</div>
                <div className="text-sm text-[#0D4D36]/60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky Filter Pills */}
      <div className="sticky top-16 z-30 bg-[#F6F3EE]/95 backdrop-blur border-b border-[#0D4D36]/10 py-3">
        <div className="container mx-auto px-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {filterPills.map(pill => (
              <button
                key={pill.key}
                onClick={() => setActiveFilter(pill.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeFilter === pill.key
                    ? 'bg-[#1A7A56] text-white'
                    : 'bg-white text-[#0D4D36]/70 hover:bg-[#E3F5ED] border border-[#0D4D36]/15'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Project Banner */}
      {featuredProject && (
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="bg-[#0D4D36] text-white rounded-2xl overflow-hidden">
              <div className="grid md:grid-cols-5 gap-0">
                <div className="md:col-span-3 p-8 md:p-10">
                  <div className="flex items-center gap-2 mb-3">
                    <ProjectStatusBadge status={featuredProject.status as any} />
                    <Badge className="bg-white/10 text-white border-white/20 text-xs">{typeBadge(featuredProject.type)}</Badge>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>{featuredProject.name}</h2>
                  <div className="flex items-center gap-1.5 text-white/70 text-sm mb-4">
                    <MapPin className="h-4 w-4" /> {featuredProject.neighbourhood}
                  </div>
                  <p className="text-white/70 text-sm mb-6 max-w-md">{featuredProject.public_description}</p>
                  <div className="mb-4">
                    <PhaseProgressBar
                      currentPhase={featuredProject.current_phase}
                      totalPhases={featuredProject.total_phases}
                      phaseName={featuredProject.current_phase_name}
                      percent={featuredProject.overall_percent}
                    />
                  </div>
                  <div className="flex gap-6 text-sm text-white/60">
                    <div className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> ETA: {featuredProject.estimated_completion}</div>
                  </div>
                </div>
                <div className="md:col-span-2 bg-[#0D4D36]/50 p-8 md:p-10 border-l border-white/10">
                  <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Phase Tracker</h3>
                  {featuredPhases.length > 0 ? (
                    <PhaseTimeline phases={featuredPhases.map(p => ({ ...p, status: p.status as any }))} compact />
                  ) : (
                    <div className="space-y-3">
                      {[1,2,3,4,5,6,7,8].map(n => (
                        <div key={n} className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full ${n < featuredProject.current_phase ? 'bg-emerald-500' : n === featuredProject.current_phase ? 'bg-amber-500' : 'bg-white/20'}`} />
                          <span className={`text-xs ${n <= featuredProject.current_phase ? 'text-white' : 'text-white/40'}`}>
                            Phase {n}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Project Cards Grid */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl font-serif font-bold text-[#0D4D36] mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            {activeFilter === 'all' ? 'All Projects' : `Showing: ${filterPills.find(p => p.key === activeFilter)?.label}`}
            <span className="text-base font-normal text-[#0D4D36]/50 ml-2">({filteredProjects.length})</span>
          </h2>

          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map(project => (
                <Card
                  key={project.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow bg-white border-0"
                  onClick={() => setSelectedProject(project)}
                >
                  <div className={`h-28 ${
                    project.status === 'active' ? 'bg-gradient-to-br from-[#1A7A56] to-[#2EA878]' :
                    project.status === 'hold' ? 'bg-gradient-to-br from-[#C8912A] to-[#7A5618]' :
                    'bg-gradient-to-br from-slate-600 to-slate-800'
                  } p-4 flex flex-col justify-between`}>
                    <div className="flex justify-between">
                      <ProjectStatusBadge status={project.status as any} className="bg-white/20 border-white/30 text-white" />
                      <Badge className="bg-white/20 text-white border-white/20 text-[10px]">{typeBadge(project.type)}</Badge>
                    </div>
                    <Home className="h-8 w-8 text-white/30" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-[#0D4D36] mb-1">{project.name}</h3>
                    <div className="flex items-center gap-1 text-[#0D4D36]/60 text-xs mb-3">
                      <MapPin className="h-3 w-3" /> {project.neighbourhood}
                    </div>
                    <PhaseProgressBar
                      currentPhase={project.current_phase}
                      totalPhases={project.total_phases}
                      phaseName={project.current_phase_name}
                      percent={project.overall_percent}
                      compact
                    />
                    <div className="flex justify-between items-center mt-3 text-xs text-[#0D4D36]/50">
                      <span>Phase {project.current_phase} · {project.current_phase_name}</span>
                      {project.estimated_completion && <span>ETA {project.estimated_completion}</span>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Expert Network Strip */}
      <section className="py-16 px-4 bg-[#0D4D36] text-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl font-serif font-bold text-center mb-2" style={{ fontFamily: 'Georgia, serif' }}>Expert Network</h2>
          <p className="text-center text-white/60 text-sm mb-10">Specialists across every phase of construction</p>
          <div className="grid md:grid-cols-4 gap-6">
            {expertiseGroups.map(group => (
              <div key={group.phase} className="bg-white/5 rounded-xl p-5 border border-white/10">
                <div className="mb-3 text-[#2EA878]">{group.icon}</div>
                <h3 className="font-semibold text-sm mb-3">{group.phase}</h3>
                <ul className="space-y-1.5">
                  {group.experts.map(e => (
                    <li key={e} className="text-xs text-white/60 flex items-center gap-1.5">
                      <CheckCircle className="h-3 w-3 text-[#2EA878]" /> {e}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Completed Projects */}
      {completedProjects.length > 0 && (
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-2xl font-serif font-bold text-[#0D4D36] mb-6" style={{ fontFamily: 'Georgia, serif' }}>Completed Projects</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {completedProjects.map(project => (
                <div key={project.id} className="flex items-center gap-4 bg-white rounded-xl p-4 border border-[#0D4D36]/10">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#0D4D36] text-sm">{project.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-[#0D4D36]/50">
                      <span>{project.neighbourhood}</span>
                      <span>{typeBadge(project.type)}</span>
                      <span>Delivered {project.estimated_completion}</span>
                    </div>
                  </div>
                  <ProjectStatusBadge status="complete" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="py-16 px-4" style={{ backgroundColor: '#C8912A' }}>
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-serif font-bold text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Ready to Build?
          </h2>
          <p className="text-white/80 mb-6">Start your construction project with FlexiRents. From 1-bedroom homes to commercial complexes.</p>
          <Button
            size="lg"
            onClick={() => setShowEnquiry(true)}
            className="bg-white text-[#7A5618] hover:bg-white/90 font-semibold px-8"
          >
            Start a Project
          </Button>
        </div>
      </section>

      {/* Project Detail Modal */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-lg" style={{ backgroundColor: '#F6F3EE' }}>
          <DialogHeader>
            <DialogTitle className="font-serif text-[#0D4D36]" style={{ fontFamily: 'Georgia, serif' }}>{selectedProject?.name}</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <ProjectStatusBadge status={selectedProject.status} />
                <Badge variant="outline">{typeBadge(selectedProject.type)}</Badge>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {selectedProject.neighbourhood}
              </div>
              <p className="text-sm text-[#0D4D36]/70">{selectedProject.public_description}</p>
              <PhaseProgressBar
                currentPhase={selectedProject.current_phase}
                totalPhases={selectedProject.total_phases}
                phaseName={selectedProject.current_phase_name}
                percent={selectedProject.overall_percent}
              />
              {selectedProject.estimated_completion && (
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Estimated completion: {selectedProject.estimated_completion}
                </div>
              )}
              <div className="bg-[#E3F5ED] border border-[#1A7A56]/20 rounded p-3 text-xs text-[#0D4D36]/70">
                🔒 Financial details, client information, and plot addresses are private and not shown on this public page.
              </div>
              <Button onClick={() => { setSelectedProject(null); setShowEnquiry(true); }} className="w-full bg-[#1A7A56] hover:bg-[#0D4D36]">
                Enquire About a Similar Project
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enquiry Modal */}
      <Dialog open={showEnquiry} onOpenChange={setShowEnquiry}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start a Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEnquirySubmit} className="space-y-3">
            <Input placeholder="Full Name" value={enquiryData.name} onChange={e => setEnquiryData(p => ({ ...p, name: e.target.value }))} required />
            <Input type="email" placeholder="Email" value={enquiryData.email} onChange={e => setEnquiryData(p => ({ ...p, email: e.target.value }))} required />
            <Input placeholder="Your Location" value={enquiryData.location} onChange={e => setEnquiryData(p => ({ ...p, location: e.target.value }))} required />
            <Select value={enquiryData.projectType} onValueChange={v => setEnquiryData(p => ({ ...p, projectType: v }))}>
              <SelectTrigger><SelectValue placeholder="Project Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1bed">1-Bedroom</SelectItem>
                <SelectItem value="2bed">2-Bedroom</SelectItem>
                <SelectItem value="3bed">3-Bedroom</SelectItem>
                <SelectItem value="4plus">4+ Bedroom / Custom</SelectItem>
                <SelectItem value="commercial">Commercial / Office</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Proposed Build Location" value={enquiryData.buildLocation} onChange={e => setEnquiryData(p => ({ ...p, buildLocation: e.target.value }))} />
            <Select value={enquiryData.budgetRange} onValueChange={v => setEnquiryData(p => ({ ...p, budgetRange: v }))}>
              <SelectTrigger><SelectValue placeholder="Budget Range (GHS)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="under-200k">Under GH₵200,000</SelectItem>
                <SelectItem value="200k-500k">GH₵200,000 – GH₵500,000</SelectItem>
                <SelectItem value="500k-1m">GH₵500,000 – GH₵1,000,000</SelectItem>
                <SelectItem value="over-1m">Over GH₵1,000,000</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="w-full bg-[#1A7A56] hover:bg-[#0D4D36]">Submit Enquiry</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Projects;
