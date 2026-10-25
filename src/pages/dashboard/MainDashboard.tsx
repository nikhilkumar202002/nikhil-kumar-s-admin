import { useState, useEffect } from 'react'
import authService, { type User } from '../../utils/auth.service'
import projectService, {
  type Project,
  type ProjectStats,
} from '../../utils/project.service'
import {
  Briefcase,
  Users,
  FileText,
  Mail,
  TrendingUp,
  ExternalLink,
  Plus,
  ArrowUpRight,
  Eye,
  Clock,
  Sparkles,
  HardDrive,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Filter,
  Loader2,
} from 'lucide-react'

interface MainDashboardProps {
  onAddProject?: () => void
  onEditProject?: (id: number) => void
  onViewAllProjects?: () => void
}

export default function MainDashboard({
  onAddProject,
  onEditProject,
  onViewAllProjects,
}: MainDashboardProps) {
  const [user, setUser] = useState<User | null>(() => authService.getStoredUser())
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [liveProjects, setLiveProjects] = useState<Project[]>([])
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null)
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)

  useEffect(() => {
    authService.getCurrentUser()
      .then((data) => setUser(data))
      .catch(() => {})

    // Load live project statistics
    projectService.getStats()
      .then((stats) => setProjectStats(stats))
      .catch(() => {})

    // Load live portfolio projects
    projectService.getAll({ limit: 6 })
      .then((res) => setLiveProjects(res.projects))
      .catch(() => {})
      .finally(() => setIsLoadingProjects(false))
  }, [])

  // Sample Inquiries Data
  const recentMessages = [
    {
      id: 1,
      name: 'Sarah Jenkins',
      company: 'Tech Recruiter @ Stripe',
      email: 's.jenkins@stripe.example',
      subject: 'Staff Frontend Engineer Opportunity',
      time: '2h ago',
      unread: true,
      message: 'Hi Nikhil, loved your portfolio projects especially the distributed task engine. Would you be open for a quick chat?',
    },
    {
      id: 2,
      name: 'David Chen',
      company: 'Founder @ NexusAI',
      email: 'david@nexusai.example',
      subject: 'Contract Fullstack Advisory',
      time: 'Yesterday',
      unread: true,
      message: 'We are scaling our core AI pipeline and looking for an experienced architect to consult on system design.',
    },
    {
      id: 3,
      name: 'Elena Rostova',
      company: 'Engineering Director @ Vercel Partner',
      email: 'elena@partner.example',
      subject: 'Conference Speaker Invitation',
      time: '3 days ago',
      unread: false,
      message: 'Would love to have you speak about modern web performance optimizations at our upcoming dev summit.',
    },
  ]

  // Sample Activity Log
  const activities = [
    {
      id: 1,
      action: 'Published blog article',
      target: 'Mastering Modern Go Microservices',
      time: '3 hours ago',
      type: 'blog',
    },
    {
      id: 2,
      action: 'Updated project details',
      target: 'AI Workflow Platform v2.4',
      time: '6 hours ago',
      type: 'project',
    },
    {
      id: 3,
      action: 'SEO Meta updated',
      target: 'Projects & Experience pages re-indexed',
      time: 'Yesterday',
      type: 'seo',
    },
    {
      id: 4,
      action: 'New visitor milestone',
      target: 'Surpassed 24,000 monthly impressions',
      time: '2 days ago',
      type: 'analytics',
    },
  ]

  // Dynamic categories from live projects
  const availableCategories = [
    'all',
    ...Array.from(new Set(liveProjects.map((p) => p.category).filter(Boolean))),
  ]

  const filteredProjects =
    selectedCategory === 'all'
      ? liveProjects
      : liveProjects.filter(
          (p) => (p.category || '').toLowerCase() === selectedCategory.toLowerCase()
        )

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-black text-zinc-100 min-h-full font-sans">
      
      {/* 1. Header / Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back, {user?.name || 'Nikhil Kumar'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Portfolio performance, content metrics, and client inquiries overview.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Time range pills */}
          <div className="flex items-center p-1 bg-zinc-900/90 rounded-xl border border-zinc-800/90 text-xs">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          <a
            href="https://nikhil.dev"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium transition-all"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={onAddProject}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Row (4 SaaS KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Projects */}
        <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700/80 transition-all shadow-xs group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Total Projects
            </span>
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 group-hover:text-white group-hover:border-zinc-700 transition-colors">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {projectStats?.totalProjects ?? liveProjects.length}
            </span>
            {projectStats && (
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                {projectStats.featuredProjects} featured
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-zinc-500 flex items-center gap-2">
            <span>{projectStats?.publishedProjects ?? liveProjects.filter(p => p.status === 'published').length} published</span>
            <span>•</span>
            <span>{projectStats?.draftProjects ?? liveProjects.filter(p => p.status === 'draft').length} drafts</span>
            {projectStats?.archivedProjects ? (
              <>
                <span>•</span>
                <span>{projectStats.archivedProjects} archived</span>
              </>
            ) : null}
          </div>
        </div>

        {/* Metric 2: Monthly Visitors */}
        <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700/80 transition-all shadow-xs group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Monthly Visitors
            </span>
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 group-hover:text-white group-hover:border-zinc-700 transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">24.5K</span>
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +18.4%
            </span>
          </div>
          <div className="mt-2 text-xs text-zinc-500 flex items-center gap-2">
            <span>Avg. 3m 42s read</span>
            <span>•</span>
            <span>74% organic</span>
          </div>
        </div>

        {/* Metric 3: Blog Readers */}
        <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700/80 transition-all shadow-xs group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Blog Impressions
            </span>
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 group-hover:text-white group-hover:border-zinc-700 transition-colors">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">42.8K</span>
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +9.2%
            </span>
          </div>
          <div className="mt-2 text-xs text-zinc-500 flex items-center gap-2">
            <span>16 articles</span>
            <span>•</span>
            <span>820 shares</span>
          </div>
        </div>

        {/* Metric 4: Inquiries */}
        <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700/80 transition-all shadow-xs group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Inquiries
            </span>
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 group-hover:text-white group-hover:border-zinc-700 transition-colors">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">12</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              3 unread
            </span>
          </div>
          <div className="mt-2 text-xs text-zinc-500 flex items-center gap-2">
            <span>98% response rate</span>
            <span>•</span>
            <span>~1.5h avg</span>
          </div>
        </div>
      </div>

      {/* 3. Analytics Chart & System Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Visual Traffic Area (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                <span>Traffic & Engagement Activity</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                  Daily Views
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Visualizing visitor trends and portfolio project click-throughs over the last {timeRange}.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white" />
                <span>Pageviews</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                <span>Project Clicks</span>
              </div>
            </div>
          </div>

          {/* Styled SVG Area Graph */}
          <div className="h-56 w-full relative flex items-end pt-4">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 500 160"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="secondaryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#71717a" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#71717a" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="#27272a" strokeDasharray="3 3" />
              <line x1="0" y1="75" x2="500" y2="75" stroke="#27272a" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="#27272a" strokeDasharray="3 3" />

              {/* Secondary Area & Line (Project Clicks) */}
              <path
                d="M 0,140 Q 50,110 100,120 T 200,90 T 300,105 T 400,60 T 500,45 L 500,160 L 0,160 Z"
                fill="url(#secondaryGradient)"
              />
              <path
                d="M 0,140 Q 50,110 100,120 T 200,90 T 300,105 T 400,60 T 500,45"
                fill="none"
                stroke="#71717a"
                strokeWidth="2"
              />

              {/* Primary Area & Line (Page Views) */}
              <path
                d="M 0,125 Q 50,80 100,95 T 200,45 T 300,70 T 400,30 T 500,15 L 500,160 L 0,160 Z"
                fill="url(#chartGradient)"
              />
              <path
                d="M 0,125 Q 50,80 100,95 T 200,45 T 300,70 T 400,30 T 500,15"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
              />

              {/* Peak indicator dot */}
              <circle cx="400" cy="30" r="4" fill="#ffffff" stroke="#000000" strokeWidth="2" />
              <circle cx="500" cy="15" r="4.5" fill="#ffffff" stroke="#000000" strokeWidth="2" />
            </svg>
          </div>

          {/* Days axis labels */}
          <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-3 pt-3 border-t border-zinc-900">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun (Today - 4.8K views)</span>
          </div>
        </div>

        {/* System & Portfolio Health Overview (1 col) */}
        <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Portfolio Health</span>
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Optimal
              </span>
            </div>

            {/* SEO Score Progress */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-400">SEO Health Score</span>
                  <span className="text-white font-medium">98/100</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '98%' }} />
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  All meta tags, sitemap.xml & robots.txt valid
                </span>
              </div>

              {/* Media Storage */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
                    Media Storage
                  </span>
                  <span className="text-white font-medium">2.4 GB / 10 GB</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                  <div className="h-full bg-zinc-400 rounded-full" style={{ width: '24%' }} />
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  76% cloud storage free for project assets
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Highlights */}
          <div className="pt-4 border-t border-zinc-900 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                Tech Stack Items
              </span>
              <span className="text-lg font-bold text-white mt-1 block">34 Skills</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                Experience Years
              </span>
              <span className="text-lg font-bold text-white mt-1 block">5+ Years</span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Portfolio Projects Table */}
      <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-zinc-400" />
                <span>Featured Portfolio Projects</span>
              </h2>
              {onViewAllProjects && (
                <button
                  type="button"
                  onClick={onViewAllProjects}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>View all</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Manage your top highlighted works displayed on the public portfolio.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoadingProjects ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            <p className="text-xs">Loading live projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          /* Empty State */
          <div className="py-12 text-center rounded-xl border border-dashed border-zinc-800/80 bg-zinc-900/20 p-6">
            <Briefcase className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-zinc-300">No projects found</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              {selectedCategory !== 'all'
                ? `No projects found under the "${selectedCategory}" category.`
                : 'You have not created any portfolio projects yet.'}
            </p>
            {onAddProject && (
              <button
                type="button"
                onClick={onAddProject}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Your First Project</span>
              </button>
            )}
          </div>
        ) : (
          /* Projects Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80 pb-3">
                <tr>
                  <th className="pb-3 pr-4">Project Title</th>
                  <th className="pb-3 px-4">Category</th>
                  <th className="pb-3 px-4">Technologies</th>
                  <th className="pb-3 px-4">Views</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredProjects.map((project) => {
                  const updatedDate = project.updated_at
                    ? new Date(project.updated_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Recently'

                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-zinc-900/40 transition-colors group"
                    >
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          {project.featured_image || project.cover_image ? (
                            <img
                              src={
                                (project.featured_image || project.cover_image)!.startsWith('http')
                                  ? (project.featured_image || project.cover_image)!
                                  : `http://localhost:3000${project.featured_image || project.cover_image}`
                              }
                              alt={project.title}
                              className="w-8 h-8 rounded-lg object-cover bg-zinc-900 border border-zinc-800 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 font-bold text-xs flex-shrink-0">
                              {project.title.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-zinc-100 group-hover:text-white transition-colors">
                                {project.title}
                              </span>
                              {project.is_featured ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  Featured
                                </span>
                              ) : null}
                            </div>
                            <span className="text-[10px] text-zinc-500 block">
                              Updated {updatedDate}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-zinc-300 font-medium capitalize">
                          {project.category || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {(project.technologies || []).slice(0, 3).map((techName, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400"
                            >
                              {techName}
                            </span>
                          ))}
                          {(project.technologies || []).length > 3 ? (
                            <span className="text-[10px] text-zinc-500">
                              +{(project.technologies || []).length - 3}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-300">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{project.views_count ?? 0}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            project.status === 'published'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : project.status === 'draft'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              project.status === 'published'
                                ? 'bg-emerald-400'
                                : project.status === 'draft'
                                ? 'bg-amber-400'
                                : 'bg-zinc-500'
                            }`}
                          />
                          <span className="capitalize">{project.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {project.project_url ? (
                            <a
                              href={project.project_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                              title="View Live Demo"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : null}
                          {onEditProject ? (
                            <button
                              type="button"
                              onClick={() => onEditProject(project.id)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Lower Grid: Contact Messages & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Client Messages */}
        <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-zinc-400" />
                <h2 className="text-base font-semibold text-white tracking-tight">
                  Recent Inquiries
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  3 New
                </span>
              </div>
              <button
                type="button"
                className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                View all in Inbox →
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {recentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    msg.unread
                      ? 'bg-zinc-900/60 border-zinc-700/60 hover:border-zinc-600'
                      : 'bg-zinc-950 border-zinc-800/60 hover:bg-zinc-900/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-[10px] text-zinc-200">
                        {msg.name.slice(0, 1)}
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-white">{msg.name}</span>
                        <span className="text-[11px] text-zinc-400 ml-1.5 font-normal">
                          • {msg.company}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-500 flex-shrink-0">{msg.time}</span>
                  </div>
                  <h4 className="text-xs font-medium text-zinc-200 mt-1">{msg.subject}</h4>
                  <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{msg.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-900 text-center">
            <button
              type="button"
              className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Go to Contact Messages Center
            </button>
          </div>
        </div>

        {/* Activity Logs & Quick Actions */}
        <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-400" />
                <h2 className="text-base font-semibold text-white tracking-tight">
                  Recent Activity Logs
                </h2>
              </div>
              <span className="text-xs text-zinc-500 font-mono">Live audit stream</span>
            </div>

            {/* Timeline */}
            <div className="space-y-4 mt-4 relative pl-4 border-l border-zinc-800">
              {activities.map((act) => (
                <div key={act.id} className="relative group">
                  {/* Dot */}
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-700 border-2 border-black group-hover:bg-white transition-colors" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-200">{act.action}</span>
                    <span className="text-[10px] text-zinc-500">{act.time}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{act.target}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Publish CTA Bar */}
          <div className="pt-5 mt-5 border-t border-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-400" />
              <span className="text-xs text-zinc-300">Ready to publish new work?</span>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition-colors cursor-pointer"
            >
              <span>Quick Create</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  )
}