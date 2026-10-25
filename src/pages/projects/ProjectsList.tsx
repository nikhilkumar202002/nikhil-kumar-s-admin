import { useState, useEffect, useCallback } from 'react'
import projectService, {
  type Project,
  type PaginationMeta,
  type ProjectQueryParams,
} from '../../utils/project.service'
import {
  Briefcase,
  Plus,
  Search,
  Star,
  ExternalLink,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

interface ProjectsListProps {
  onAddProject: () => void
  onEditProject: (id: number) => void
}

export default function ProjectsList({
  onAddProject,
  onEditProject,
}: ProjectsListProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  })

  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successBanner, setSuccessBanner] = useState('')

  // Filter state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [sortBy, setSortBy] = useState('display_order')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC')

  // Delete modal state
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Status updating map
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null)

  // Fetch projects from API
  const fetchProjects = useCallback(
    async (pageToLoad = 1) => {
      setErrorMessage('')
      try {
        const queryParams: ProjectQueryParams = {
          page: pageToLoad,
          limit: pagination.limit,
          sortBy,
          sortOrder,
        }

        if (search.trim()) queryParams.search = search.trim()
        if (statusFilter !== 'all') {
          queryParams.status = statusFilter as 'draft' | 'published' | 'archived'
        }
        if (categoryFilter !== 'all') queryParams.category = categoryFilter
        if (featuredOnly) queryParams.is_featured = true

        const result = await projectService.getAll(queryParams)
        setProjects(result.projects)
        setPagination(result.pagination)
      } catch (err: unknown) {
        const errorObj = err as { message?: string }
        setErrorMessage(errorObj.message || 'Failed to load projects. Please try again.')
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [pagination.limit, search, statusFilter, categoryFilter, featuredOnly, sortBy, sortOrder]
  )

  // Load categories and initial projects
  useEffect(() => {
    projectService
      .getCategories()
      .then((cats) => setCategories(cats))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchProjects(1)
  }, [fetchProjects])

  // Refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchProjects(pagination.page)
  }

  // Toggle Featured status
  const handleToggleFeatured = async (project: Project) => {
    const nextFeatured = !project.is_featured
    // Optimistic UI update
    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id ? { ...p, is_featured: nextFeatured } : p
      )
    )

    try {
      await projectService.toggleFeatured(project.id, nextFeatured)
      setSuccessBanner(
        `Project "${project.title}" ${nextFeatured ? 'marked as featured' : 'unfeatured'}`
      )
      setTimeout(() => setSuccessBanner(''), 4000)
    } catch (err: unknown) {
      // Revert on error
      setProjects((prev) =>
        prev.map((p) =>
          p.id === project.id ? { ...p, is_featured: project.is_featured } : p
        )
      )
      const errorObj = err as { message?: string }
      setErrorMessage(errorObj.message || 'Failed to update featured status')
    }
  }

  // Update Status handler
  const handleStatusChange = async (
    project: Project,
    newStatus: 'draft' | 'published' | 'archived'
  ) => {
    if (project.status === newStatus) return
    setUpdatingStatusId(project.id)

    try {
      const updated = await projectService.updateStatus(project.id, newStatus)
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, status: updated.status } : p))
      )
      setSuccessBanner(`Status of "${project.title}" changed to ${newStatus}`)
      setTimeout(() => setSuccessBanner(''), 4000)
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setErrorMessage(errorObj.message || 'Failed to update project status')
    } finally {
      setUpdatingStatusId(null)
    }
  }

  // Delete Project handler
  const confirmDeleteProject = async () => {
    if (!projectToDelete) return
    setIsDeleting(true)

    try {
      await projectService.delete(projectToDelete.id)
      setSuccessBanner(`Project "${projectToDelete.title}" deleted successfully`)
      setProjectToDelete(null)
      fetchProjects(pagination.page)
      setTimeout(() => setSuccessBanner(''), 4000)
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setErrorMessage(errorObj.message || 'Failed to delete project')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-black text-zinc-100 min-h-full font-sans">
      
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Briefcase className="w-6 h-6 text-zinc-400" />
              <span>Portfolio Projects</span>
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
              {pagination.total} Total
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Create, edit, organize, and publish your showcase portfolio projects.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh project list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

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

      {/* 2. Notifications / Banners */}
      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-2.5 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center justify-between gap-2.5 text-xs text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchProjects(pagination.page)}
            className="underline underline-offset-2 hover:text-white font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3. Filter & Search Controls */}
      <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, slug, tag..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="w-full px-3 py-2 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 transition-all cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
              className="w-full px-3 py-2 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 transition-all cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort projects by"
              className="flex-1 px-3 py-2 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 transition-all cursor-pointer"
            >
              <option value="display_order">Sort: Order</option>
              <option value="created_at">Sort: Created Date</option>
              <option value="updated_at">Sort: Updated Date</option>
              <option value="title">Sort: Title</option>
            </select>

            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
              className="px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
              title="Toggle sort direction"
            >
              {sortOrder}
            </button>
          </div>

        </div>

        {/* Featured Toggle Filter */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={featuredOnly}
              onChange={(e) => setFeaturedOnly(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0 accent-white cursor-pointer"
            />
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Show featured projects only
            </span>
          </label>

          <span className="text-[11px] text-zinc-500">
            Showing {projects.length} of {pagination.total} projects
          </span>
        </div>
      </div>

      {/* 4. Projects Table */}
      <div className="p-4 sm:p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="w-7 h-7 animate-spin text-white" />
            <span className="text-xs">Fetching portfolio projects...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">No projects found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              No portfolio projects match your active search filters or none have been created yet.
            </p>
            <button
              type="button"
              onClick={onAddProject}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Project</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80 pb-3">
                <tr>
                  <th className="pb-3 pr-2 w-10 text-center">Featured</th>
                  <th className="pb-3 px-4">Project</th>
                  <th className="pb-3 px-4">Category</th>
                  <th className="pb-3 px-4">Technologies</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4 text-center">Order</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-zinc-900/40 transition-colors group"
                  >
                    {/* Featured Star Toggle */}
                    <td className="py-3.5 pr-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(project)}
                        className="p-1 rounded-lg text-zinc-500 hover:text-amber-400 transition-colors cursor-pointer"
                        title={project.is_featured ? 'Featured on homepage' : 'Mark as featured'}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            project.is_featured
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-zinc-600 hover:text-zinc-400'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Project Title & Cover Preview */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        {/* Thumbnail */}
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {project.cover_image ? (
                            <img
                              src={
                                project.cover_image.startsWith('http')
                                  ? project.cover_image
                                  : `http://localhost:3000${project.cover_image}`
                              }
                              alt={project.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <Briefcase className="w-4 h-4 text-zinc-600" />
                          )}
                        </div>

                        {/* Title and Slug */}
                        <div className="min-w-0">
                          <span className="font-semibold text-zinc-100 group-hover:text-white transition-colors block truncate max-w-[220px]">
                            {project.title}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono block truncate max-w-[200px]">
                            /{project.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-zinc-300 font-medium">
                        {project.category || '—'}
                      </span>
                    </td>

                    {/* Technologies Tags */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                        {project.technologies && project.technologies.length > 0 ? (
                          project.technologies.slice(0, 3).map((tech, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-medium whitespace-nowrap"
                            >
                              {tech}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-600 text-[11px]">—</span>
                        )}
                        {project.technologies && project.technologies.length > 3 && (
                          <span className="text-[10px] text-zinc-500">
                            +{project.technologies.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Dropdown Pill */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="relative inline-block">
                        <select
                          value={project.status}
                          disabled={updatingStatusId === project.id}
                          aria-label={`Update status for ${project.title}`}
                          onChange={(e) =>
                            handleStatusChange(
                              project,
                              e.target.value as 'draft' | 'published' | 'archived'
                            )
                          }
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border focus:outline-none cursor-pointer appearance-none ${
                            project.status === 'published'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : project.status === 'draft'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          <option value="published" className="bg-zinc-900 text-emerald-400">
                            Published
                          </option>
                          <option value="draft" className="bg-zinc-900 text-amber-400">
                            Draft
                          </option>
                          <option value="archived" className="bg-zinc-900 text-zinc-400">
                            Archived
                          </option>
                        </select>
                      </div>
                    </td>

                    {/* Display Order */}
                    <td className="py-3.5 px-4 text-center font-mono text-zinc-400">
                      #{project.display_order ?? 0}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* External link */}
                        {(project.project_url || project.live_url) && (
                          <a
                            href={project.project_url || project.live_url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            title="Open live URL"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => onEditProject(project.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Edit project"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setProjectToDelete(project)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="pt-4 mt-4 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
            <div>
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total items)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!pagination.hasPrevPage || isLoading}
                onClick={() => fetchProjects(pagination.page - 1)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => fetchProjects(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      p === pagination.page
                        ? 'bg-white text-zinc-950 font-bold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={!pagination.hasNextPage || isLoading}
                onClick={() => fetchProjects(pagination.page + 1)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-4 font-sans animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Project</h3>
                <p className="text-xs text-zinc-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white">"{projectToDelete.title}"</strong>? All associated
              technologies, gallery images, and metrics will be purged.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteProject}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Project'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
