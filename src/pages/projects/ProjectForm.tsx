import { useState, useEffect, useRef } from 'react'
import projectService, {
  type Project,
  type ProjectImage,
  type CreateProjectPayload,
  type UpdateProjectPayload,
} from '../../utils/project.service'
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  Trash2,
  Star,
  Plus,
  X,
} from 'lucide-react'

interface ProjectFormProps {
  projectId?: number | null
  onCancel: () => void
  onSuccess: () => void
}

export default function ProjectForm({
  projectId,
  onCancel,
  onSuccess,
}: ProjectFormProps) {
  const isEditMode = Boolean(projectId)

  // Loading and error states
  const [isLoadingProject, setIsLoadingProject] = useState(isEditMode)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [successBanner, setSuccessBanner] = useState('')

  // Form Fields
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [projectType, setProjectType] = useState('')
  const [clientName, setClientName] = useState('')
  const [role, setRole] = useState('')
  const [liveUrl, setLiveUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [canonicalUrl, setCanonicalUrl] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft')
  const [isFeatured, setIsFeatured] = useState(false)
  const [displayOrder, setDisplayOrder] = useState<number>(0)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  // Cover Image
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string>('')

  // Technologies
  const [technologies, setTechnologies] = useState<string[]>([])
  const [techInput, setTechInput] = useState('')
  const [availableTechs, setAvailableTechs] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])

  // Project Gallery (Edit mode only)
  const [galleryImages, setGalleryImages] = useState<ProjectImage[]>([])
  const [isUploadingGallery, setIsUploadingGallery] = useState(false)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!isEditMode) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setSlug(generated)
    }
  }

  // Fetch initial project data for Edit Mode
  useEffect(() => {
    if (!projectId) return

    setIsLoadingProject(true)
    setErrorMessage('')

    projectService
      .getById(projectId)
      .then((proj: Project) => {
        setTitle(proj.title || '')
        setSlug(proj.slug || '')
        setShortDescription(proj.short_description || '')
        setDescription(proj.description || '')
        setCategory(proj.category || '')
        setProjectType(proj.project_type || '')
        setClientName(proj.client_name || '')
        setRole(proj.role || '')
        setLiveUrl(proj.project_url || proj.live_url || '')
        setGithubUrl(proj.repository_url || proj.github_url || '')
        setCanonicalUrl(proj.canonical_url || '')
        setStartDate(proj.start_date ? proj.start_date.slice(0, 10) : '')
        setEndDate(proj.end_date ? proj.end_date.slice(0, 10) : '')
        setStatus(proj.status || 'draft')
        setIsFeatured(Boolean(proj.is_featured))
        setDisplayOrder(proj.display_order ?? 0)
        setMetaTitle(proj.meta_title || '')
        setMetaDescription(proj.meta_description || '')
        setCoverImageUrl(proj.cover_image || '')
        setTechnologies(proj.technologies || [])
        setGalleryImages(proj.images || [])
      })
      .catch((err: unknown) => {
        const errorObj = err as { message?: string }
        setErrorMessage(errorObj.message || 'Failed to fetch project details.')
      })
      .finally(() => {
        setIsLoadingProject(false)
      })
  }, [projectId])

  // Fetch available categories and technologies for suggestions
  useEffect(() => {
    projectService
      .getCategories()
      .then((c) => setAvailableCategories(c))
      .catch(() => {})

    projectService
      .getTechnologies()
      .then((t) => setAvailableTechs(t))
      .catch(() => {})
  }, [])

  // Add technology tag
  const addTechnology = (tech: string) => {
    const trimmed = tech.trim()
    if (!trimmed) return
    if (!technologies.includes(trimmed)) {
      setTechnologies([...technologies, trimmed])
    }
    setTechInput('')
  }

  // Remove technology tag
  const removeTechnology = (techToRemove: string) => {
    setTechnologies(technologies.filter((t) => t !== techToRemove))
  }

  // Handle Cover Image file selection
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImageFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setCoverImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Gallery Image Upload (Edit Mode)
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !projectId) return

    setIsUploadingGallery(true)
    setErrorMessage('')

    try {
      const uploaded = await projectService.uploadImage(projectId, file)
      setGalleryImages((prev) => [...prev, uploaded])
      setSuccessBanner('Image added to project gallery!')
      setTimeout(() => setSuccessBanner(''), 4000)
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setErrorMessage(errorObj.message || 'Failed to upload gallery image')
    } finally {
      setIsUploadingGallery(false)
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  // Set Gallery Image as Cover
  const handleSetCover = async (imageId: number) => {
    if (!projectId) return

    try {
      await projectService.setCoverImage(projectId, imageId)
      setGalleryImages((prev) =>
        prev.map((img) => ({ ...img, is_cover: img.id === imageId }))
      )
      const cover = galleryImages.find((img) => img.id === imageId)
      if (cover) setCoverImageUrl(cover.image_url)
      setSuccessBanner('Cover image updated!')
      setTimeout(() => setSuccessBanner(''), 4000)
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setErrorMessage(errorObj.message || 'Failed to set cover image')
    }
  }

  // Delete Gallery Image
  const handleDeleteGalleryImage = async (imageId: number) => {
    if (!projectId) return

    try {
      await projectService.deleteImage(projectId, imageId)
      setGalleryImages((prev) => prev.filter((img) => img.id !== imageId))
      setSuccessBanner('Image deleted from gallery')
      setTimeout(() => setSuccessBanner(''), 4000)
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setErrorMessage(errorObj.message || 'Failed to delete gallery image')
    }
  }

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setValidationErrors({})

    // Client-side quick checks
    if (!title.trim()) {
      setValidationErrors({ title: 'Project title is required' })
      return
    }

    setIsSubmitting(true)

    try {
      if (coverImageFile) {
        // Multipart Submission with Cover Image File
        const formData = new FormData()
        formData.append('title', title.trim())
        if (slug.trim()) formData.append('slug', slug.trim())
        if (shortDescription.trim())
          formData.append('short_description', shortDescription.trim())
        if (description.trim()) formData.append('description', description.trim())
        if (category.trim()) formData.append('category', category.trim())
        if (projectType.trim()) formData.append('project_type', projectType.trim())
        if (clientName.trim()) formData.append('client_name', clientName.trim())
        if (role.trim()) formData.append('role', role.trim())
        if (liveUrl.trim()) formData.append('project_url', liveUrl.trim())
        if (githubUrl.trim()) formData.append('repository_url', githubUrl.trim())
        if (canonicalUrl.trim()) formData.append('canonical_url', canonicalUrl.trim())
        if (startDate) formData.append('start_date', startDate)
        if (endDate) formData.append('end_date', endDate)
        formData.append('status', status)
        formData.append('is_featured', String(isFeatured))
        formData.append('display_order', String(displayOrder))
        if (metaTitle.trim()) formData.append('meta_title', metaTitle.trim())
        if (metaDescription.trim())
          formData.append('meta_description', metaDescription.trim())
        formData.append('technologies', JSON.stringify(technologies))
        formData.append('cover_image', coverImageFile)

        if (isEditMode && projectId) {
          await projectService.update(projectId, formData)
        } else {
          await projectService.create(formData)
        }
      } else {
        // Standard JSON payload
        const payload: CreateProjectPayload = {
          title: title.trim(),
          slug: slug.trim() || undefined,
          short_description: shortDescription.trim() || undefined,
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          project_type: projectType.trim() || undefined,
          client_name: clientName.trim() || undefined,
          role: role.trim() || undefined,
          project_url: liveUrl.trim() || undefined,
          live_url: liveUrl.trim() || undefined,
          repository_url: githubUrl.trim() || undefined,
          github_url: githubUrl.trim() || undefined,
          canonical_url: canonicalUrl.trim() || undefined,
          start_date: startDate || null,
          end_date: endDate || null,
          status,
          is_featured: isFeatured,
          display_order: displayOrder,
          cover_image: coverImageUrl.trim() || undefined,
          meta_title: metaTitle.trim() || undefined,
          meta_description: metaDescription.trim() || undefined,
          technologies,
        }

        if (isEditMode && projectId) {
          await projectService.update(projectId, payload as UpdateProjectPayload)
        } else {
          await projectService.create(payload)
        }
      }

      setSuccessBanner(
        isEditMode
          ? 'Project updated successfully!'
          : 'Project created successfully!'
      )

      setTimeout(() => {
        onSuccess()
      }, 700)
    } catch (err: unknown) {
      const errorObj = err as {
        message?: string
        data?: { errors?: Array<{ field?: string; message: string }> }
      }

      setErrorMessage(errorObj.message || 'Failed to save project. Please review fields.')

      if (errorObj.data?.errors) {
        const fieldErrors: Record<string, string> = {}
        errorObj.data.errors.forEach((e) => {
          if (e.field) fieldErrors[e.field] = e.message
        })
        setValidationErrors(fieldErrors)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingProject) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
        <span className="text-xs">Loading project details...</span>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-black text-zinc-100 min-h-full font-sans max-w-5xl mx-auto">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
            title="Go back to project list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {isEditMode ? `Edit Project: ${title || 'Untitled'}` : 'Create New Project'}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isEditMode
                ? 'Modify project information, technologies, images, and publish status.'
                : 'Add a new project to your portfolio showcase with full metadata.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isEditMode ? 'Save Changes' : 'Create Project'}</span>
          </button>
        </div>
      </div>

      {/* 2. Feedback Banners */}
      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-2.5 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center gap-2.5 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3. Form Body */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section A: Core Information */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-900">
            Core Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Project Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Distributed Task Queue Engine"
                className="w-full px-3.5 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all"
              />
              {validationErrors.title && (
                <span className="text-[11px] text-red-400 mt-1 block">
                  {validationErrors.title}
                </span>
              )}
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                URL Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="distributed-task-queue"
                className="w-full px-3.5 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all"
              />
              {validationErrors.slug && (
                <span className="text-[11px] text-red-400 mt-1 block">
                  {validationErrors.slug}
                </span>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Category
              </label>
              <input
                type="text"
                list="category-suggestions"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Fullstack, Backend, AI, Mobile"
                className="w-full px-3.5 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all"
              />
              <datalist id="category-suggestions">
                {availableCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* Project Type */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Project Type
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-zinc-700 transition-all cursor-pointer"
              >
                <option value="">Select project type...</option>
                <option value="Personal">Personal Project</option>
                <option value="Client">Client Work</option>
                <option value="Open Source">Open Source</option>
                <option value="Enterprise">Enterprise / Company</option>
              </select>
            </div>

            {/* Client Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Client / Organization
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Stripe, Acme Corp, Self"
                className="w-full px-3.5 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Your Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Lead Engineer, Fullstack Architect"
                className="w-full px-3.5 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all"
              />
            </div>

            {/* Status & Featured Row */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Publish Status
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as 'draft' | 'published' | 'archived')
                }
                className="w-full px-3.5 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-zinc-700 transition-all cursor-pointer font-medium"
              >
                <option value="draft">Draft (Hidden from public)</option>
                <option value="published">Published (Live on portfolio)</option>
                <option value="archived">Archived (Internal record)</option>
              </select>
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Display Order Sequence
              </label>
              <input
                type="number"
                min={0}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all"
              />
            </div>

            {/* Featured Checkbox */}
            <div className="flex items-center pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-white accent-white cursor-pointer"
                />
                <span className="text-xs text-zinc-200 font-medium flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  Feature on Portfolio Homepage
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Section B: Content & Descriptions */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-900">
            Descriptions & Overview
          </h2>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Short Summary Description (Displayed on portfolio cards)
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="A high-performance distributed task engine processing 10k ops/sec"
              className="w-full px-3.5 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Full Project Case Study / Detailed Description
            </label>
            <textarea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed architecture, challenges overcome, system design specifications, and outcomes..."
              className="w-full p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all leading-relaxed"
            />
          </div>
        </div>

        {/* Section C: Technologies Tags */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Technologies & Tools
            </h2>
            <span className="text-[11px] text-zinc-500">
              {technologies.length} tags selected
            </span>
          </div>

          {/* Active Tags */}
          <div className="flex flex-wrap items-center gap-2 min-h-8">
            {technologies.map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200"
              >
                <span>{tech}</span>
                <button
                  type="button"
                  onClick={() => removeTechnology(tech)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Input to Add Tag */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTechnology(techInput)
                }
              }}
              placeholder="Type technology (e.g. React 19, Go, Docker) and press Enter..."
              className="flex-1 px-3.5 py-2 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-all"
            />
            <button
              type="button"
              onClick={() => addTechnology(techInput)}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition-colors cursor-pointer"
            >
              Add
            </button>
          </div>

          {/* Quick suggestions */}
          {availableTechs.length > 0 && (
            <div className="pt-2 flex items-center gap-1.5 flex-wrap text-xs text-zinc-400">
              <span className="text-[11px] text-zinc-500">Quick add:</span>
              {availableTechs.slice(0, 8).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addTechnology(t)}
                  className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-400 hover:text-white border border-zinc-800/80 transition-colors"
                >
                  +{t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section D: URLs & Dates */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-900">
            Links & Project Timeline
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Live Project Demo URL
              </label>
              <input
                type="text"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://app.portfolio.dev"
                className="w-full px-3.5 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Repository URL (GitHub / GitLab)
              </label>
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/nikhil/repo"
                className="w-full px-3.5 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-zinc-700 transition-all cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                End / Completion Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-zinc-700 transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section E: Cover Image Upload */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-900">
            Project Cover Image
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            {/* File Uploader */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Upload Cover Image (JPEG, PNG, WebP up to 10MB)
              </label>
              <label className="border-2 border-dashed border-zinc-800 hover:border-zinc-600 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-zinc-900/30">
                <Upload className="w-6 h-6 text-zinc-400" />
                <span className="text-xs text-zinc-300 font-medium">
                  {coverImageFile ? coverImageFile.name : 'Choose image file'}
                </span>
                <span className="text-[10px] text-zinc-500">
                  Click to browse from your device
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  onChange={handleCoverFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Direct Image URL & Preview */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Or Direct Image URL
                </label>
                <input
                  type="text"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://example.com/cover.webp"
                  className="w-full px-3.5 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-all"
                />
              </div>

              {/* Preview */}
              {(coverImagePreview || coverImageUrl) && (
                <div className="relative w-full h-36 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                  <img
                    src={
                      coverImagePreview ||
                      (coverImageUrl.startsWith('http')
                        ? coverImageUrl
                        : `http://localhost:3000${coverImageUrl}`)
                    }
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-white backdrop-blur-xs">
                    Cover Preview
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section F: Project Gallery (Edit Mode) */}
        {isEditMode && projectId && (
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                  Project Gallery Images
                </h2>
                <p className="text-xs text-zinc-500">
                  Add screenshots, diagrams, and media for this project's gallery.
                </p>
              </div>

              <div>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  onChange={handleGalleryUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingGallery}
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUploadingGallery ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Upload Image</span>
                </button>
              </div>
            </div>

            {/* Gallery Grid */}
            {galleryImages.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                No gallery images uploaded yet for this project.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {galleryImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative group rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 aspect-video flex items-center justify-center"
                  >
                    <img
                      src={
                        img.image_url.startsWith('http')
                          ? img.image_url
                          : `http://localhost:3000${img.image_url}`
                      }
                      alt={img.alt_text || 'Gallery image'}
                      className="w-full h-full object-cover"
                    />

                    {/* Overlay controls */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      {!img.is_cover && (
                        <button
                          type="button"
                          onClick={() => handleSetCover(img.id)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-white"
                          title="Set as Cover Image"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteGalleryImage(img.id)}
                        className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-800 text-xs text-red-200"
                        title="Delete image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {img.is_cover && (
                      <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500 text-black">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section G: SEO Settings */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-900">
            SEO & Search Engine Optimization
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                SEO Meta Title
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Title tag for Google & social previews"
                className="w-full px-3.5 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Canonical URL
              </label>
              <input
                type="text"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="https://nikhil.dev/projects/slug"
                className="w-full px-3.5 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                SEO Meta Description
              </label>
              <textarea
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Meta description for search engine result snippets..."
                className="w-full p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-900">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isEditMode ? 'Update Project' : 'Create Project'}</span>
          </button>
        </div>

      </form>

    </div>
  )
}
