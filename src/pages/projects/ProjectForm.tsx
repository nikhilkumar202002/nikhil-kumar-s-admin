import { useState, useEffect, useRef } from 'react'
import projectService, {
  type Project,
  type ProjectImage,
  getProjectImageUrl,
} from '../../utils/project.service'
import categoryService, { type Category } from '../../utils/category.service'
import technologyService, { type Technology } from '../../utils/technology.service'
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  Trash2,
  Star,
  Image as ImageIcon,
  LayoutTemplate,
  X,
  Plus,
  Calendar,
  Layers,
  Cpu,
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
  const [year, setYear] = useState<string>(() => new Date().getFullYear().toString())
  const [shortDescription, setShortDescription] = useState('')
  const [description, setDescription] = useState('')
  
  // Category state (linked to Category model: id & name)
  const [categoryId, setCategoryId] = useState<number | string>('')
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  
  // Technology state (linked to Technology model: id & name)
  const [selectedTechIds, setSelectedTechIds] = useState<number[]>([])
  const [availableTechnologies, setAvailableTechnologies] = useState<Technology[]>([])
  const [isLoadingTechs, setIsLoadingTechs] = useState(true)
  const [newTechName, setNewTechName] = useState('')
  const [isCreatingTech, setIsCreatingTech] = useState(false)

  // Details
  const [projectType, setProjectType] = useState('')
  const [clientName, setClientName] = useState('')
  const [role, setRole] = useState('')
  const [liveUrl, setLiveUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [canonicalUrl, setCanonicalUrl] = useState('')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('published')
  const [isFeatured, setIsFeatured] = useState(false)
  const [displayOrder, setDisplayOrder] = useState<number>(0)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  // 1. Featured Image (Card / Thumbnail)
  const [featuredImageUrl, setFeaturedImageUrl] = useState('')
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null)

  // 2. Banner Image (Hero Header)
  const [bannerImageUrl, setBannerImageUrl] = useState('')
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null)

  // Project Gallery & Uploads
  const [galleryImages, setGalleryImages] = useState<ProjectImage[]>([])
  const [isUploadingGallery, setIsUploadingGallery] = useState(false)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const featuredInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

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

  // Fetch Categories & Technologies from API on mount
  useEffect(() => {
    setIsLoadingCategories(true)
    categoryService
      .getAll()
      .then((cats) => setAvailableCategories(cats))
      .catch((err) => console.error('Failed to load categories:', err))
      .finally(() => setIsLoadingCategories(false))

    setIsLoadingTechs(true)
    technologyService
      .getAll()
      .then((techs) => setAvailableTechnologies(techs))
      .catch((err) => console.error('Failed to load technologies:', err))
      .finally(() => setIsLoadingTechs(false))
  }, [])

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
        setYear(proj.year !== undefined && proj.year !== null ? String(proj.year) : new Date().getFullYear().toString())
        setShortDescription(proj.short_description || '')
        setDescription(proj.description || '')
        
        // Match category_id
        if (proj.category_id) {
          setCategoryId(proj.category_id)
        } else if (proj.category_detail?.id) {
          setCategoryId(proj.category_detail.id)
        }

        // Match technology_ids
        if (Array.isArray(proj.technology_ids)) {
          setSelectedTechIds(proj.technology_ids.map(Number).filter((n) => !isNaN(n)))
        } else if (typeof proj.technology_ids === 'string' && proj.technology_ids.trim()) {
          setSelectedTechIds(
            proj.technology_ids
              .split(',')
              .map((id) => Number(id.trim()))
              .filter((n) => !isNaN(n))
          )
        } else if (Array.isArray(proj.technologies_list)) {
          setSelectedTechIds(proj.technologies_list.map((t) => t.id).filter(Boolean))
        }

        setProjectType(proj.project_type || '')
        setClientName(proj.client_name || '')
        setRole(proj.role || '')
        setLiveUrl(proj.project_url || proj.live_url || '')
        setGithubUrl(proj.repository_url || proj.github_url || '')
        setCanonicalUrl(proj.canonical_url || '')
        setStatus(proj.status || 'published')
        setIsFeatured(Boolean(proj.is_featured))
        setDisplayOrder(proj.display_order ?? 0)
        setMetaTitle(proj.meta_title || '')
        setMetaDescription(proj.meta_description || '')
        setFeaturedImageUrl(proj.featured_image || proj.cover_image || '')
        setBannerImageUrl(proj.banner_image || '')

        // Combine all images
        const imgs = proj.images || proj.gallery_images || []
        setGalleryImages(imgs)
      })
      .catch((err: unknown) => {
        const errorObj = err as { message?: string }
        setErrorMessage(errorObj.message || 'Failed to fetch project details.')
      })
      .finally(() => {
        setIsLoadingProject(false)
      })
  }, [projectId])

  // Toggle technology selection
  const handleToggleTech = (techId: number) => {
    setSelectedTechIds((prev) =>
      prev.includes(techId) ? prev.filter((id) => id !== techId) : [...prev, techId]
    )
  }

  // Create a new technology inline if not in the catalog
  const handleCreateNewTech = async () => {
    const trimmed = newTechName.trim()
    if (!trimmed) return

    setIsCreatingTech(true)
    try {
      const created = await technologyService.create({ name: trimmed })
      setAvailableTechnologies((prev) => [...prev, created])
      setSelectedTechIds((prev) => [...prev, created.id])
      setNewTechName('')
      setSuccessBanner(`Technology "${created.name}" created and selected!`)
      setTimeout(() => setSuccessBanner(''), 3000)
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setErrorMessage(errorObj.message || 'Failed to create technology')
    } finally {
      setIsCreatingTech(false)
    }
  }

  // Upload Media Files using POST /projects/upload
  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploadingGallery(true)
    setErrorMessage('')

    try {
      const filesArray = Array.from(files)
      const uploadedImages = await projectService.uploadMedia(filesArray)

      setGalleryImages((prev) => [...prev, ...uploadedImages])

      // Auto-assign featured and banner if not yet set
      if (!featuredImageUrl && uploadedImages.length > 0) {
        setFeaturedImageUrl(uploadedImages[0].image_url)
      }
      if (!bannerImageUrl && uploadedImages.length > 1) {
        setBannerImageUrl(uploadedImages[1].image_url)
      }

      setSuccessBanner(
        `${uploadedImages.length} image(s) uploaded successfully!`
      )
      setTimeout(() => setSuccessBanner(''), 4000)
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setErrorMessage(errorObj.message || 'Failed to upload image(s)')
    } finally {
      setIsUploadingGallery(false)
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  // Dedicated Featured Image File Handler
  const handleFeaturedFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFeaturedImageFile(file)
    setFeaturedImageUrl(URL.createObjectURL(file))
  }

  // Dedicated Banner Image File Handler
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerImageFile(file)
    setBannerImageUrl(URL.createObjectURL(file))
  }

  // Select gallery item as featured
  const handleSelectAsFeatured = (img: ProjectImage) => {
    setFeaturedImageUrl(img.image_url)
    setFeaturedImageFile(null)
    setSuccessBanner('Featured card image selected')
    setTimeout(() => setSuccessBanner(''), 2500)
  }

  // Select gallery item as cover/banner
  const handleSelectAsCover = (img: ProjectImage) => {
    setBannerImageUrl(img.image_url)
    setBannerImageFile(null)
    setSuccessBanner('Cover banner image selected')
    setTimeout(() => setSuccessBanner(''), 2500)
  }

  // Delete gallery item
  const handleDeleteUploadedImage = async (img: ProjectImage) => {
    if (img.image_url === featuredImageUrl) setFeaturedImageUrl('')
    if (img.image_url === bannerImageUrl) setBannerImageUrl('')

    if (projectId && typeof img.id === 'number') {
      try {
        await projectService.deleteImage(projectId, img.id)
      } catch {
        // continue local removal
      }
    }
    setGalleryImages((prev) => prev.filter((item) => item.image_url !== img.image_url))
  }

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setValidationErrors({})

    if (!title.trim()) {
      setValidationErrors({ title: 'Project title is required' })
      return
    }

    setIsSubmitting(true)

    try {
      // Build FormData payload
      const form = new FormData()
      form.append('title', title.trim())
      
      if (categoryId) {
        form.append('category_id', String(categoryId))
      }

      if (selectedTechIds.length > 0) {
        form.append('technology_ids', selectedTechIds.join(','))
      }

      form.append('year', year.trim() || new Date().getFullYear().toString())
      form.append('status', status)
      form.append('is_featured', String(isFeatured))

      // Featured / Cover Image
      if (featuredImageFile) {
        form.append('featured_image', featuredImageFile)
        form.append('cover_image', featuredImageFile)
      } else if (featuredImageUrl) {
        form.append('featured_image', featuredImageUrl)
        form.append('cover_image', featuredImageUrl)
      } else {
        form.append('featured_image', '')
        form.append('cover_image', '')
      }

      // Banner Image
      if (bannerImageFile) {
        form.append('banner_image', bannerImageFile)
      } else if (bannerImageUrl) {
        form.append('banner_image', bannerImageUrl)
      } else {
        form.append('banner_image', '')
      }

      // Images / Gallery
      form.append('images', '')
      form.append('gallery_images', '')

      // Descriptions & details
      form.append('short_description', shortDescription.trim())
      form.append('description', description.trim())
      form.append('client_name', clientName.trim())
      form.append('project_url', liveUrl.trim())
      form.append('live_url', liveUrl.trim())
      form.append('repository_url', githubUrl.trim())
      form.append('github_url', githubUrl.trim())
      form.append('role', role.trim())
      form.append('project_type', projectType.trim())
      form.append('meta_title', metaTitle.trim())
      form.append('meta_description', metaDescription.trim())
      form.append('canonical_url', canonicalUrl.trim())
      form.append('display_order', String(displayOrder))

      if (slug.trim()) form.append('slug', slug.trim())

      if (isEditMode && projectId) {
        await projectService.update(projectId, form)
      } else {
        await projectService.create(form)
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

      setErrorMessage(errorObj.message || 'Failed to save project. Please check fields.')

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
      <div className="p-16 flex flex-col items-center justify-center gap-3 text-zinc-400">
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
                ? 'Modify project information, category, technologies, media, and status.'
                : 'Publish a new project with categories, technologies, and images.'}
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
              <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
            ) : (
              <Save className="w-4 h-4 text-zinc-950" />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Title */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Project Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Fintech Mobile Dashboard"
                className="w-full px-3.5 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all"
              />
              {validationErrors.title && (
                <span className="text-[11px] text-red-400 mt-1 block">
                  {validationErrors.title}
                </span>
              )}
            </div>

            {/* Year */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Project Year</span>
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2026"
                className="w-full px-3.5 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all"
              />
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
                placeholder="fintech-mobile-dashboard"
                className="w-full px-3.5 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all"
              />
            </div>

            {/* Category Dropdown (category_id) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Category <span className="text-red-400">*</span></span>
                </label>
                {isLoadingCategories && (
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-cyan-400" />
                    Loading...
                  </span>
                )}
              </div>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all cursor-pointer font-medium"
              >
                <option value="">Select Category...</option>
                {availableCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
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
                <option value="">Select type...</option>
                <option value="Personal Project">Personal Project</option>
                <option value="Client Project">Client Project</option>
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
                placeholder="e.g. Acme Finance, Stripe"
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
                placeholder="e.g. Lead Architect, Frontend Engineer"
                className="w-full px-3.5 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all"
              />
            </div>

            {/* Status */}
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
                <option value="published">Published (Live on portfolio)</option>
                <option value="draft">Draft (Hidden from public)</option>
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
            <div className="flex items-center pt-5 sm:col-span-2">
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

        {/* Section B: Technologies Selection */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
                Technologies & Tools
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {isLoadingTechs && (
                <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <Loader2 className="w-2.5 h-2.5 animate-spin text-emerald-400" />
                  Loading...
                </span>
              )}
              <span className="text-[11px] text-zinc-400 font-mono">
                {selectedTechIds.length} selected
              </span>
            </div>
          </div>

          <p className="text-xs text-zinc-400">
            Select technologies from the dropdown to associate them with this project:
          </p>

          {/* 1. Technology Select Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Select Technology
              </label>
              <select
                value=""
                onChange={(e) => {
                  const val = Number(e.target.value)
                  if (val && !selectedTechIds.includes(val)) {
                    setSelectedTechIds((prev) => [...prev, val])
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer font-medium"
              >
                <option value="">-- Choose Technology --</option>
                {availableTechnologies
                  .filter((tech) => !selectedTechIds.includes(tech.id))
                  .map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Quick create custom technology */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Or Create New Tech
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newTechName}
                  onChange={(e) => setNewTechName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCreateNewTech()
                    }
                  }}
                  placeholder="New technology name..."
                  className="flex-1 px-3 py-2 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-all"
                />
                <button
                  type="button"
                  disabled={isCreatingTech || !newTechName.trim()}
                  onClick={handleCreateNewTech}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition-colors cursor-pointer disabled:opacity-40"
                >
                  {isCreatingTech ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Selected Technologies Badges */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300">
                Selected Technologies:
              </span>
              {selectedTechIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedTechIds([])}
                  className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Clear all ({selectedTechIds.length})
                </button>
              )}
            </div>

            {selectedTechIds.length === 0 ? (
              <div className="p-3 rounded-xl border border-dashed border-zinc-800/80 bg-zinc-900/20 text-center text-xs text-zinc-500">
                No technologies selected. Choose from the dropdown above to add.
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 min-h-9">
                {selectedTechIds.map((id) => {
                  const tech = availableTechnologies.find((t) => t.id === id)
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white text-zinc-950 border border-white text-xs font-semibold shadow-xs animate-in fade-in zoom-in-95 duration-150"
                    >
                      <span>{tech?.name || 'Technology'}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleTech(id)}
                        className="p-0.5 rounded-full hover:bg-zinc-200 text-zinc-700 hover:text-black transition-colors cursor-pointer"
                        title="Remove technology"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          {/* 3. Quick-Click Options */}
          {availableTechnologies.length > 0 && (
            <div className="pt-3 border-t border-zinc-900 space-y-1.5">
              <span className="text-[11px] text-zinc-500 block">
                Quick click to toggle technologies:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {availableTechnologies.map((tech) => {
                  const isSelected = selectedTechIds.includes(tech.id)
                  return (
                    <button
                      key={tech.id}
                      type="button"
                      onClick={() => handleToggleTech(tech.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-900/70 text-zinc-400 hover:text-white border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      <span>{tech.name}</span>
                      {isSelected ? ' ✓' : ' +'}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Section C: Descriptions & Overview */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-900">
            Descriptions & Overview
          </h2>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Short Summary Description (Card overview)
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Modern financial dashboard with real-time analytics"
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
              placeholder="Architecture, tech stack decisions, challenges solved, system design specifications, and outcomes..."
              className="w-full p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all leading-relaxed"
            />
          </div>
        </div>

        {/* Section D: Links & Dates */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-900">
            Live URL & Repository Links
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Live Project / Demo URL
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
          </div>
        </div>

        {/* Section E: Media & Project Images */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-900">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>Project Media & Images</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Upload images via the upload button, then click "Set Featured" or "Set Cover" on any card below.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={galleryInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,image/avif"
                onChange={handleImagesUpload}
                className="hidden"
              />
              <button
                type="button"
                disabled={isUploadingGallery}
                onClick={() => galleryInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-xs font-semibold text-zinc-950 transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-xs"
              >
                {isUploadingGallery ? (
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                ) : (
                  <Upload className="w-4 h-4 text-zinc-950" />
                )}
                <span>Upload Media</span>
              </button>
            </div>
          </div>

          {/* Active Selections Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Selected Featured Image */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                featuredImageUrl
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : 'bg-zinc-900/40 border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Featured Image (Card & Listing Thumbnail)</span>
                </span>
                {featuredImageUrl && (
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-400/10 px-2 py-0.5 rounded">
                    Selected
                  </span>
                )}
              </div>
              {featuredImageUrl ? (
                <div className="relative w-full h-36 rounded-lg overflow-hidden bg-black border border-zinc-800 flex items-center justify-center">
                  <img
                    src={getProjectImageUrl(featuredImageUrl)}
                    alt="Featured preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFeaturedImageUrl('')
                      setFeaturedImageFile(null)
                    }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/80 hover:bg-red-950 text-zinc-300 hover:text-red-400 transition-colors"
                    title="Clear selection"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => featuredInputRef.current?.click()}
                  className="w-full h-36 rounded-lg border border-dashed border-zinc-800 hover:border-zinc-700 flex flex-col items-center justify-center gap-1 text-center p-3 cursor-pointer transition-colors"
                >
                  <Star className="w-5 h-5 text-zinc-600" />
                  <span className="text-[11px] text-zinc-400">Click to upload or choose from gallery</span>
                  <input
                    ref={featuredInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFeaturedFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Selected Cover / Banner Image */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                bannerImageUrl
                  ? 'bg-cyan-950/20 border-cyan-500/40'
                  : 'bg-zinc-900/40 border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <LayoutTemplate className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Cover / Banner Image (Hero Header)</span>
                </span>
                {bannerImageUrl && (
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-400/10 px-2 py-0.5 rounded">
                    Selected
                  </span>
                )}
              </div>
              {bannerImageUrl ? (
                <div className="relative w-full h-36 rounded-lg overflow-hidden bg-black border border-zinc-800 flex items-center justify-center">
                  <img
                    src={getProjectImageUrl(bannerImageUrl)}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setBannerImageUrl('')
                      setBannerImageFile(null)
                    }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/80 hover:bg-red-950 text-zinc-300 hover:text-red-400 transition-colors"
                    title="Clear selection"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => bannerInputRef.current?.click()}
                  className="w-full h-36 rounded-lg border border-dashed border-zinc-800 hover:border-zinc-700 flex flex-col items-center justify-center gap-1 text-center p-3 cursor-pointer transition-colors"
                >
                  <LayoutTemplate className="w-5 h-5 text-zinc-600" />
                  <span className="text-[11px] text-zinc-400">Click to upload or choose from gallery</span>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Uploaded Images Pool / Gallery */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">
                Uploaded Project Images ({galleryImages.length})
              </span>
              <span className="text-[11px] text-zinc-500">
                Click buttons on each image to designate as Featured or Cover.
              </span>
            </div>

            {galleryImages.length === 0 ? (
              <div
                onClick={() => galleryInputRef.current?.click()}
                className="py-10 border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-zinc-900/20 group"
              >
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors block">
                    Upload images to this project
                  </span>
                  <span className="text-[11px] text-zinc-500 mt-0.5 block">
                    Supports PNG, JPEG, WebP, AVIF
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {galleryImages.map((img, idx) => {
                  const isFeat = img.image_url === featuredImageUrl || img.is_featured || img.is_cover
                  const isCov = img.image_url === bannerImageUrl || img.is_banner

                  return (
                    <div
                      key={img.id || idx}
                      className={`relative group rounded-xl overflow-hidden bg-zinc-900 border transition-all ${
                        isFeat && isCov
                          ? 'border-amber-500 ring-2 ring-cyan-500/50'
                          : isFeat
                          ? 'border-amber-500 ring-2 ring-amber-500/50'
                          : isCov
                          ? 'border-cyan-500 ring-2 ring-cyan-500/50'
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
                        <img
                          src={getProjectImageUrl(img.image_url)}
                          alt={img.alt_text || 'Project media'}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Active Badges */}
                      <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1 pointer-events-none">
                        {isFeat && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-black flex items-center gap-0.5 shadow-sm">
                            <Star className="w-2.5 h-2.5 fill-black" />
                            <span>Featured</span>
                          </span>
                        )}
                        {isCov && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500 text-black flex items-center gap-0.5 shadow-sm">
                            <LayoutTemplate className="w-2.5 h-2.5" />
                            <span>Cover</span>
                          </span>
                        )}
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteUploadedImage(img)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/80 hover:bg-red-950 text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Delete image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Card Action Buttons */}
                      <div className="p-2 bg-zinc-950/90 border-t border-zinc-800 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSelectAsFeatured(img)}
                          className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                            isFeat
                              ? 'bg-amber-500 text-black shadow-xs'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                          }`}
                          title="Set as Featured Card Image"
                        >
                          <Star className="w-3 h-3" />
                          <span>{isFeat ? 'Featured' : 'Set Feat'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectAsCover(img)}
                          className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                            isCov
                              ? 'bg-cyan-500 text-black shadow-xs'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                          }`}
                          title="Set as Cover / Banner Image"
                        >
                          <LayoutTemplate className="w-3 h-3" />
                          <span>{isCov ? 'Cover' : 'Set Cover'}</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Section F: SEO Settings */}
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
                placeholder="Title tag for search engines & previews"
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
                placeholder="https://nikhilkumars.com/projects/slug"
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
                placeholder="Meta description for search engine snippets..."
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
              <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
            ) : (
              <Save className="w-4 h-4 text-zinc-950" />
            )}
            <span>{isEditMode ? 'Update Project' : 'Create Project'}</span>
          </button>
        </div>

      </form>

    </div>
  )
}
