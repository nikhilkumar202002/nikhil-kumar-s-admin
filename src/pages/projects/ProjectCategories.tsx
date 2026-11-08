import { useState, useEffect } from 'react'
import {
  FolderTree,
  Plus,
  Search,
  Trash2,
  Edit2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Tag,
  Briefcase,
  ToggleLeft,
  ToggleRight,
  LayoutList,
  LayoutGrid,
  Calendar,
  Clock,
  Eye,
} from 'lucide-react'
import categoryService, { type Category } from '../../utils/category.service'

interface ProjectCategoriesProps {
  onAddProject?: () => void
}

export default function ProjectCategories({ onAddProject }: ProjectCategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Single Category View Modal state
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null)
  const [isLoadingSingle, setIsLoadingSingle] = useState(false)
  const [singleViewError, setSingleViewError] = useState('')

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchCategories = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const data = await categoryService.getAll()
      setCategories(data)
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setStatusMessage({
        type: 'error',
        text: errorObj.message || 'Failed to load categories',
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleOpenAdd = () => {
    setEditingCategory(null)
    setName('')
    setSlug('')
    setDescription('')
    setStatus(true)
    setFormError('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat)
    setName(cat.name)
    setSlug(cat.slug)
    setDescription(cat.description || '')
    setStatus(cat.status ?? true)
    setFormError('')
    setIsModalOpen(true)
  }

  // Single category modal handler (fetches /project-categories/:id or /categories/:id)
  const handleOpenSingleView = async (cat: Category) => {
    setViewingCategory(cat)
    setIsLoadingSingle(true)
    setSingleViewError('')

    try {
      const fullCategory = await categoryService.getById(cat.id)
      if (fullCategory) {
        setViewingCategory(fullCategory)
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setSingleViewError(errorObj.message || 'Could not refresh latest details')
    } finally {
      setIsLoadingSingle(false)
    }
  }

  const handleCloseSingleView = () => {
    setViewingCategory(null)
    setSingleViewError('')
  }

  const handleNameChange = (val: string) => {
    setName(val)
    if (!editingCategory) {
      const generatedSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setSlug(generatedSlug)
    }
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setFormError('Category name is required')
      return
    }

    setIsSaving(true)
    setFormError('')

    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim() || undefined,
      status,
    }

    try {
      if (editingCategory) {
        const updated = await categoryService.update(editingCategory.id, payload)
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? { ...c, ...updated } : c))
        )
        setStatusMessage({
          type: 'success',
          text: `Category "${name}" updated successfully!`,
        })
      } else {
        const created = await categoryService.create(payload)
        setCategories((prev) => [created, ...prev])
        setStatusMessage({
          type: 'success',
          text: `Category "${name}" created successfully!`,
        })
      }
      setIsModalOpen(false)
      setTimeout(() => setStatusMessage(null), 3500)
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setFormError(errorObj.message || 'Failed to save category')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCategory = async (id: number) => {
    setDeletingId(id)
    try {
      await categoryService.delete(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      setStatusMessage({
        type: 'success',
        text: 'Category deleted successfully',
      })
      setTimeout(() => setStatusMessage(null), 3500)
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setStatusMessage({
        type: 'error',
        text: errorObj.message || 'Failed to delete category',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const formatFullDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return dateStr
    }
  }

  const totalProjects = categories.reduce(
    (acc, c) => acc + (c.projects_count ?? c.project_count ?? 0),
    0
  )

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <FolderTree className="w-6 h-6 text-zinc-400" />
            <span>Project Categories</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Organize portfolio projects into structured categories and filters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchCategories(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh Categories"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-xs font-semibold text-zinc-950 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4 text-zinc-950" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
              Total Categories
            </span>
            <div className="text-lg font-bold text-white">{categories.length}</div>
          </div>
          <Tag className="w-5 h-5 text-zinc-600" />
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
              Total Projects Linked
            </span>
            <div className="text-lg font-bold text-white">{totalProjects}</div>
          </div>
          <Briefcase className="w-5 h-5 text-zinc-600" />
        </div>

        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
              Active Filters
            </span>
            <div className="text-lg font-bold text-emerald-400">
              {categories.filter((c) => c.status !== false).length}
            </div>
          </div>
          <span className="w-3 h-3 rounded-full bg-emerald-400/20 border border-emerald-400 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </span>
        </div>
      </div>

      {/* Status Alerts */}
      {statusMessage?.type === 'success' && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-2.5 text-xs text-emerald-400">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {statusMessage?.type === 'error' && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center gap-2.5 text-xs text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Controls Bar: Search + View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories by name, slug or description..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900/80 border border-zinc-800 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'table'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Table View"
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Grid Cards View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-xs">Loading categories...</span>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-3">
          <Tag className="w-8 h-8 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-300">No categories found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {searchQuery
              ? `No category matches "${searchQuery}".`
              : 'Get started by creating your first project category.'}
          </p>
          {!searchQuery && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-xs font-semibold text-zinc-950 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Category</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px] bg-zinc-900/50">
                  <th className="py-3 px-4 w-16">#ID</th>
                  <th className="py-3 px-4 min-w-[180px]">Category Name</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4 min-w-[200px]">Description</th>
                  <th className="py-3 px-4 text-center">Projects</th>
                  <th className="py-3 px-4 whitespace-nowrap">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredCategories.map((cat) => {
                  const count = cat.projects_count ?? cat.project_count ?? 0
                  const isActive = cat.status !== false

                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-zinc-900/40 transition-colors group cursor-pointer"
                      onClick={() => handleOpenSingleView(cat)}
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono text-zinc-500">
                        #{cat.id}
                      </td>

                      {/* Name & Active Badge */}
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span className="group-hover:text-cyan-400 transition-colors">
                            {cat.name}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              isActive ? 'bg-emerald-400' : 'bg-zinc-600'
                            }`}
                            title={isActive ? 'Active' : 'Inactive'}
                          />
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                        /{cat.slug}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 text-zinc-400 max-w-xs truncate">
                        {cat.description || <span className="text-zinc-600">—</span>}
                      </td>

                      {/* Projects Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            count > 0
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                              : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                          }`}
                        >
                          <Briefcase className="w-3 h-3" />
                          <span>{count}</span>
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-zinc-400 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          <span>{formatDate(cat.created_at)}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenSingleView(cat)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-400 hover:bg-zinc-900 transition-colors cursor-pointer"
                            title="View Category Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            disabled={deletingId === cat.id}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete Category"
                          >
                            {deletingId === cat.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => {
            const count = cat.projects_count ?? cat.project_count ?? 0
            const isActive = cat.status !== false

            return (
              <div
                key={cat.id}
                className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700/80 transition-all group relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="flex items-center gap-2.5 cursor-pointer"
                      onClick={() => handleOpenSingleView(cat)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 flex-shrink-0 group-hover:border-zinc-700 transition-colors">
                        <Tag className="w-4 h-4 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white leading-tight group-hover:text-cyan-400 transition-colors">
                            {cat.name}
                          </h3>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isActive ? 'bg-emerald-400' : 'bg-zinc-600'
                            }`}
                            title={isActive ? 'Active' : 'Inactive'}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-zinc-500 block">
                          /{cat.slug}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenSingleView(cat)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-400 hover:bg-zinc-900 transition-colors cursor-pointer"
                        title="View Category Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                        title="Edit category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        disabled={deletingId === cat.id}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete category"
                      >
                        {deletingId === cat.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {cat.description && (
                    <p className="mt-2.5 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 text-zinc-400">
                    <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
                    <span>
                      {count} {count === 1 ? 'project' : 'projects'}
                    </span>
                  </span>

                  {onAddProject && (
                    <button
                      type="button"
                      onClick={onAddProject}
                      className="text-[11px] text-zinc-500 hover:text-zinc-300 font-medium cursor-pointer"
                    >
                      + Add Project
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal for Single Category View */}
      {viewingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white">
                      Category Details
                    </h2>
                    <span className="font-mono text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                      ID #{viewingCategory.id}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 block font-mono">
                    /{viewingCategory.slug}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseSingleView}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error or Loading banner */}
            {isLoadingSingle && (
              <div className="py-2 px-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-2 text-xs text-zinc-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Fetching latest data from server...</span>
              </div>
            )}
            {singleViewError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{singleViewError}</span>
              </div>
            )}

            {/* Body Info */}
            <div className="space-y-4">
              {/* Main Badge / Name */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
                    Category Name
                  </span>
                  <span className="text-base font-bold text-white mt-0.5 block">
                    {viewingCategory.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      viewingCategory.status !== false
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        viewingCategory.status !== false
                          ? 'bg-emerald-400 animate-pulse'
                          : 'bg-zinc-600'
                      }`}
                    />
                    <span>{viewingCategory.status !== false ? 'Active' : 'Inactive'}</span>
                  </span>
                </div>
              </div>

              {/* Grid Attributes */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Slug */}
                <div className="p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/70">
                  <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
                    Slug
                  </span>
                  <span className="font-mono text-zinc-200 mt-1 block truncate">
                    /{viewingCategory.slug}
                  </span>
                </div>

                {/* Projects Count */}
                <div className="p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/70">
                  <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
                    Linked Projects
                  </span>
                  <span className="text-cyan-400 font-semibold mt-1 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>
                      {(viewingCategory.projects_count ?? viewingCategory.project_count ?? 0)}{' '}
                      {(viewingCategory.projects_count ?? viewingCategory.project_count ?? 0) === 1
                        ? 'project'
                        : 'projects'}
                    </span>
                  </span>
                </div>

                {/* Created Date */}
                <div className="p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/70">
                  <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
                    Created At
                  </span>
                  <span className="text-zinc-300 mt-1 flex items-center gap-1.5 text-[11px]">
                    <Calendar className="w-3 h-3 text-zinc-500" />
                    <span>{formatFullDate(viewingCategory.created_at)}</span>
                  </span>
                </div>

                {/* Updated Date */}
                <div className="p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/70">
                  <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
                    Last Updated
                  </span>
                  <span className="text-zinc-300 mt-1 flex items-center gap-1.5 text-[11px]">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    <span>{formatFullDate(viewingCategory.updated_at)}</span>
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-800/70">
                <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block mb-1">
                  Description
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {viewingCategory.description || (
                    <span className="text-zinc-500 italic">No description provided.</span>
                  )}
                </p>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const targetCat = viewingCategory
                  handleCloseSingleView()
                  handleOpenEdit(targetCat)
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Category</span>
              </button>

              <button
                type="button"
                onClick={handleCloseSingleView}
                className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-xs font-semibold text-zinc-950 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-zinc-400" />
                <span>{editingCategory ? 'Edit Category' : 'Create New Category'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Development"
                  className="w-full px-3.5 py-2 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Slug (URL Identifier)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. development"
                  className="w-full px-3.5 py-2 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Web development projects"
                  className="w-full px-3.5 py-2 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white transition-all resize-none"
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <div>
                  <span className="text-xs font-semibold text-zinc-300 block">
                    Active Status
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Visible and available for projects
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStatus(!status)}
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  {status ? (
                    <ToggleRight className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-zinc-600" />
                  )}
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-xs font-semibold text-zinc-950 transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCategory ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
