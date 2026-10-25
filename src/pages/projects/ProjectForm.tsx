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
  Image,
  LayoutTemplate,
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

  // 1. Featured Image (Card / Thumbnail)
  const [featuredImageUrl, setFeaturedImageUrl] = useState('')
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null)
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string>('')

  // 2. Banner Image (Hero Header)
  const [bannerImageUrl, setBannerImageUrl] = useState('')
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null)
  const [bannerImagePreview, setBannerImagePreview] = useState<string>('')

  // Technologies
  const [technologies, setTechnologies] = useState<string[]>([])
  const [techInput, setTechInput] = useState('')
  const [availableTechs, setAvailableTechs] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])

  // Project Gallery (Edit mode only)
  const [galleryImages, setGalleryImages] = useState<ProjectImage[]>([])
  const [isUploadingGallery, setIsUploadingGallery] = useState(false)
  const [uploadRole, setUploadRole] = useState<'gallery' | 'featured' | 'banner'>('gallery')
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
        setFeaturedImageUrl(proj.featured_image || proj.cover_image || '')
        setBannerImageUrl(proj.banner_image || '')
        setTechnologies(proj.technologies || [])
        setGalleryImages(proj.gallery_images || proj.images || [])
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

  // Handle Featured Image file selection
  const handleFeaturedFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFeaturedImageFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setFeaturedImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle Banner Image file selection
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerImageFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setBannerImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Gallery Image Upload (Edit Mode) with role flag support
  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    roleType: 'gallery' | 'featured' | 'banner' = uploadRole
  ) => {
    const file = e.target.files?.[0]
    if (!file || !projectId) return

    setIsUploadingGallery(true)
    setErrorMessage('')

    try {
      const meta = {
        type: roleType,
        is_banner: roleType === 'banner',
        is_featured: roleType === 'featured',
        is_cover: roleType === 'featured',
      }
      const uploaded = await projectService.uploadImage(projectId, file, meta)
      setGalleryImages((prev) => [
        ...prev.map((img) => ({
          ...img,
          ...(roleType === 'banner' ? { is_banner: false } : {}),
          ...(roleType === 'featured' ? { is_featured: false, is_cover: false } : {}),
        })),
        uploaded,
      ])
      if (roleType === 'featured') {
        setFeaturedImageUrl(uploaded.image_url)
      } else if (roleType === 'banner') {
        setBannerImageUrl(uploaded.image_url)
      }
      setSuccessBanner(
        roleType === 'featured'
          ? 'Featured card image uploaded successfully!'
          : roleType === 'banner'
          ? 'Hero banner image uploaded successfully!'
          : 'Image added to project gallery!'
      )
      setTimeout(() => setSuccessBanner(''), 4000)
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setErrorMessage(errorObj.message || 'Failed to upload image')
    } finally {
      setIsUploadingGallery(false)
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  // Promote Gallery Image to Featured Card Image (PATCH /featured)
  const handleSetFeatured = async (imageId: number) => {
    if (!projectId) return

    try {
      await projectService.setFeaturedImage(projectId, imageId)
      setGalleryImages((prev) =>
        prev.map((img) => ({
          ...img,
          is_cover: img.id === imageId,
          is_featured: img.id === imageId,
        }))
      )
      const feat = galleryImages.find((img) => img.id === imageId)
      if (feat) setFeaturedImageUrl(feat.image_url)
      setSuccessBanner('Image promoted to featured card image successfully!')
      setTimeout(() => setSuccessBanner(''), 4000)
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setErrorMessage(errorObj.message || 'Failed to promote to featured image')
    }
  }

  // Promote Gallery Image to Banner Image (PATCH /banner)
  const handleSetBanner = async (imageId: number) => {
    if (!projectId) return

    try {
      await projectService.setBannerImage(projectId, imageId)
      setGalleryImages((prev) =>
        prev.map((img) => ({ ...img, is_banner: img.id === imageId }))
      )
      const banner = galleryImages.find((img) => img.id === imageId)
      if (banner) setBannerImageUrl(banner.image_url)
      setSuccessBanner('Image promoted to hero banner image successfully!')
      setTimeout(() => setSuccessBanner(''), 4000)
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setErrorMessage(errorObj.message || 'Failed to promote to banner image')
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
      if (featuredImageFile || bannerImageFile) {
        // Multipart Submission with Image Files
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

        // 3-tier images
        if (featuredImageFile) {
          formData.append('featured_image', featuredImageFile)
          formData.append('cover_image', featuredImageFile)
        } else if (featuredImageUrl.trim()) {
          formData.append('featured_image', featuredImageUrl.trim())
          formData.append('cover_image', featuredImageUrl.trim())
        }

        if (bannerImageFile) {
          formData.append('banner_image', bannerImageFile)
        } else if (bannerImageUrl.trim()) {
          formData.append('banner_image', bannerImageUrl.trim())
        }

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
          featured_image: featuredImageUrl.trim() || undefined,
          banner_image: bannerImageUrl.trim() || undefined,
          cover_image: featuredImageUrl.trim() || undefined,
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

        {/* Section E: Project Media & Image Selection (Upload first, then select roles) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-900">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Image className="w-4 h-4 text-emerald-400" />
                <span>Project Media & Image Selection</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Upload your project images first. Then simply select which one is the Featured Image and Cover Banner below.
              </p>
            </div>

            <div>
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
                <span>Upload Project Images</span>
              </button>
            </div>
          </div>

          {/* Active Selections Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Selected Featured Image */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                featuredImageUrl
                  ? "bg-amber-950/20 border-amber-500/40"
                  : "bg-zinc-900/40 border-zinc-800"
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
                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-black border border-zinc-800 flex items-center justify-center">
                  <img
                    src={
                      featuredImageUrl.startsWith("http")
                        ? featuredImageUrl
                        : `http://localhost:3000${featuredImageUrl}`
                    }
                    alt="Featured preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFeaturedImageUrl("")}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/80 hover:bg-red-950 text-zinc-300 hover:text-red-400 transition-colors"
                    title="Clear selection"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-full h-32 rounded-lg border border-dashed border-zinc-800 flex flex-col items-center justify-center gap-1 text-center p-3">
                  <Star className="w-5 h-5 text-zinc-600" />
                  <span className="text-[11px] text-zinc-500">No Featured Image chosen</span>
                  <span className="text-[10px] text-zinc-600">Click "Set Featured" on any uploaded image below</span>
                </div>
              )}
            </div>

            {/* Selected Cover / Banner Image */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                bannerImageUrl
                  ? "bg-cyan-950/20 border-cyan-500/40"
                  : "bg-zinc-900/40 border-zinc-800"
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
                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-black border border-zinc-800 flex items-center justify-center">
                  <img
                    src={
                      bannerImageUrl.startsWith("http")
                        ? bannerImageUrl
                        : `http://localhost:3000${bannerImageUrl}`
                    }
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setBannerImageUrl("")}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/80 hover:bg-red-950 text-zinc-300 hover:text-red-400 transition-colors"
                    title="Clear selection"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-full h-32 rounded-lg border border-dashed border-zinc-800 flex flex-col items-center justify-center gap-1 text-center p-3">
                  <LayoutTemplate className="w-5 h-5 text-zinc-600" />
                  <span className="text-[11px] text-zinc-500">No Cover / Banner chosen</span>
                  <span className="text-[10px] text-zinc-600">Click "Set Cover" on any uploaded image below</span>
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
                Click buttons on each card to designate roles.
              </span>
            </div>

            {galleryImages.length === 0 ? (
              <div
                onClick={() => galleryInputRef.current?.click()}
                className="py-12 border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-2xl flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-colors bg-zinc-900/20 group"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors block">
                    Click to upload images for this project
                  </span>
                  <span className="text-[11px] text-zinc-500 mt-0.5 block">
                    JPEG, PNG, WebP, or AVIF (select multiple files at once)
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
                          ? "border-amber-500 ring-2 ring-cyan-500/50"
                          : isFeat
                          ? "border-amber-500 ring-2 ring-amber-500/50"
                          : isCov
                          ? "border-cyan-500 ring-2 ring-cyan-500/50"
                          : "border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className="aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
                        <img
                          src={
                            img.image_url.startsWith("http")
                              ? img.image_url
                              : `http://localhost:3000${img.image_url}`
                          }
                          alt={img.alt_text || "Project media"}
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

                      {/* Delete button (top right) */}
                      <button
                        type="button"
                        onClick={() => handleDeleteUploadedImage(img)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/80 hover:bg-red-950 text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Delete image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Card Action Buttons (Bottom) */}
                      <div className="p-2 bg-zinc-950/90 border-t border-zinc-800 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSelectAsFeatured(img)}
                          className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                            isFeat
                              ? "bg-amber-500 text-black shadow-xs"
                              : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                          }`}
                          title="Set as Featured Card Image"
                        >
                          <Star className="w-3 h-3" />
                          <span>{isFeat ? "Featured" : "Set Featured"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectAsCover(img)}
                          className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                            isCov
                              ? "bg-cyan-500 text-black shadow-xs"
                              : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                          }`}
                          title="Set as Cover / Banner Image"
                        >
                          <LayoutTemplate className="w-3 h-3" />
                          <span>{isCov ? "Cover" : "Set Cover"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

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
