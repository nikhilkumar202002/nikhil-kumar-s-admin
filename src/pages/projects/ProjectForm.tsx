import { useState, useEffect } from 'react'
import projectService, {
  type Project,
  type ProjectImage,
} from '../../utils/project.service'
import categoryService, { type Category } from '../../utils/category.service'
import technologyService, { type Technology } from '../../utils/technology.service'
import ProjectGalleryView from '../../component/projects/ProjectGalleryView'
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Star,
  Image as ImageIcon,
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
  const [featuredImageId, setFeaturedImageId] = useState<number | string | null>(null)

  // 2. Cover / Banner Image (Hero Header)
  const [bannerImageUrl, setBannerImageUrl] = useState('')
  const [coverImageId, setCoverImageId] = useState<number | string | null>(null)

  // Project Gallery & Uploads
  const [galleryImages, setGalleryImages] = useState<ProjectImage[]>([])

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

        // Load latest gallery images via GET /projects/:id/images
        projectService
          .getGalleryImages(projectId)
          .then((imgs) => {
            const list = imgs && imgs.length > 0 ? imgs : proj.images || proj.gallery_images || []
            setGalleryImages(list)

            // Match active featured and cover image IDs
            const featImg = list.find((i) => i.is_featured || i.image_url === proj.featured_image)
            if (featImg) {
              setFeaturedImageId(featImg.id)
              setFeaturedImageUrl(featImg.image_url)
            }

            const covImg = list.find(
              (i) =>
                i.is_cover ||
                i.is_banner ||
                i.image_url === proj.banner_image ||
                i.image_url === proj.cover_image
            )
            if (covImg) {
              setCoverImageId(covImg.id)
              setBannerImageUrl(covImg.image_url)
            }
          })
          .catch(() => {
            setGalleryImages(proj.images || proj.gallery_images || [])
          })
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

  // Select gallery item as featured (calls PATCH /projects/:id/select-images & PATCH /projects/:id/images/:imageId/featured)
  const handleSelectAsFeatured = async (img: ProjectImage) => {
    setFeaturedImageUrl(img.image_url)
    setFeaturedImageId(img.id)

    if (projectId && typeof img.id === 'number') {
      try {
        await Promise.allSettled([
          projectService.selectImages(projectId, { featured_image_id: img.id }),
          projectService.setFeaturedImage(projectId, img.id),
        ])
        setSuccessBanner('Featured image updated successfully via API')
      } catch {
        setSuccessBanner('Featured image selected')
      }
    } else {
      setSuccessBanner('Featured image selected from gallery')
    }

    setTimeout(() => setSuccessBanner(''), 2500)
  }

  // Select gallery item as cover/banner (calls PATCH /projects/:id/select-images & PATCH /projects/:id/images/:imageId/cover)
  const handleSelectAsCover = async (img: ProjectImage) => {
    setBannerImageUrl(img.image_url)
    setCoverImageId(img.id)

    if (projectId && typeof img.id === 'number') {
      try {
        await Promise.allSettled([
          projectService.selectImages(projectId, {
            cover_image_id: img.id,
            banner_image_id: img.id,
          }),
          projectService.setCoverImage(projectId, img.id),
        ])
        setSuccessBanner('Cover image updated successfully via API')
      } catch {
        setSuccessBanner('Cover image selected')
      }
    } else {
      setSuccessBanner('Cover image selected from gallery')
    }

    setTimeout(() => setSuccessBanner(''), 2500)
  }

  const handleClearFeatured = () => {
    setFeaturedImageUrl('')
    setFeaturedImageId(null)
    setSuccessBanner('Featured image cleared')
    setTimeout(() => setSuccessBanner(''), 2000)
  }

  const handleClearCover = () => {
    setBannerImageUrl('')
    setCoverImageId(null)
    setSuccessBanner('Cover image cleared')
    setTimeout(() => setSuccessBanner(''), 2000)
  }

  // Delete gallery item (DELETE /projects/:id/images/:imageId)
  const handleDeleteUploadedImage = async (img: ProjectImage) => {
    if (img.image_url === featuredImageUrl || img.id === featuredImageId) {
      setFeaturedImageUrl('')
      setFeaturedImageId(null)
    }
    if (img.image_url === bannerImageUrl || img.id === coverImageId) {
      setBannerImageUrl('')
      setCoverImageId(null)
    }

    if (projectId && typeof img.id === 'number') {
      try {
        await projectService.deleteImage(projectId, img.id)
      } catch {
        // continue local removal
      }
    }
    setGalleryImages((prev) => prev.filter((item) => item.image_url !== img.image_url && item.id !== img.id))
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

      // Featured / Cover / Banner Image selections
      form.append('featured_image', featuredImageUrl || '')
      form.append('cover_image', bannerImageUrl || featuredImageUrl || '')
      form.append('banner_image', bannerImageUrl || '')

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

        // Ensure image selections are persisted via /projects/:id/select-images
        if (typeof featuredImageId === 'number' || typeof coverImageId === 'number') {
          const payload: { featured_image_id?: number; cover_image_id?: number; banner_image_id?: number } = {}
          if (typeof featuredImageId === 'number') payload.featured_image_id = featuredImageId
          if (typeof coverImageId === 'number') {
            payload.cover_image_id = coverImageId
            payload.banner_image_id = coverImageId
          }
          await projectService.selectImages(projectId, payload).catch(() => {})
        }
      } else {
        const createdProject = await projectService.create(form)

        // If new project has images, sync selections
        if (createdProject?.id && galleryImages.length > 0) {
          try {
            const firstImg = galleryImages[0]
            const secondImg = galleryImages[1] || firstImg
            if (typeof firstImg.id === 'number') {
              await projectService.selectImages(createdProject.id, {
                featured_image_id: firstImg.id,
                cover_image_id: secondImg.id,
                banner_image_id: secondImg.id,
              })
            }
          } catch {
            // best-effort
          }
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

        {/* Section E: Project Gallery & Image Selection */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-4">
          <div className="pb-3 border-b border-zinc-900">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span>Project Gallery & Image Selection</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Upload all project images below to the gallery. Choose which images serve as the Featured card and Cover banner directly from the gallery grid.
            </p>
          </div>

          <ProjectGalleryView
            projectId={projectId || undefined}
            projectTitle={title}
            images={galleryImages}
            featuredImageUrl={featuredImageUrl}
            bannerImageUrl={bannerImageUrl}
            featuredImageId={featuredImageId}
            coverImageId={coverImageId}
            onImagesChange={(updated) => setGalleryImages(updated)}
            onSelectFeatured={handleSelectAsFeatured}
            onSelectCover={handleSelectAsCover}
            onClearFeatured={handleClearFeatured}
            onClearCover={handleClearCover}
            onDeleteImage={handleDeleteUploadedImage}
            onUploadSuccess={() => {
              if (projectId) {
                projectService.getGalleryImages(projectId).then((imgs) => {
                  setGalleryImages(imgs)
                })
              }
            }}
          />
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
