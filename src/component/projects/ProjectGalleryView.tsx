import React, { useState, useEffect, useRef } from 'react'
import {
  Upload,
  Star,
  LayoutTemplate,
  Trash2,
  Edit3,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
  Check,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Loader2,
  Image as ImageIcon,
  Flag,
  RefreshCw,
  Sparkles,
  Plus,
} from 'lucide-react'
import projectService, {
  type ProjectImage,
  getProjectImageUrl,
  getImageUrlFromObject,
} from '../../utils/project.service'

export interface ProjectGalleryViewProps {
  projectId?: number | string
  projectTitle?: string
  images: ProjectImage[]
  featuredImageUrl?: string
  bannerImageUrl?: string
  featuredImageId?: number | string | null
  coverImageId?: number | string | null
  isLoading?: boolean
  readOnly?: boolean
  onImagesChange?: (images: ProjectImage[]) => void
  onSelectFeatured?: (image: ProjectImage) => Promise<void> | void
  onSelectCover?: (image: ProjectImage) => Promise<void> | void
  onSelectBanner?: (image: ProjectImage) => Promise<void> | void
  onClearFeatured?: () => void
  onClearCover?: () => void
  onDeleteImage?: (image: ProjectImage) => Promise<void> | void
  onUploadSuccess?: () => void
  className?: string
}

// Resilient Image Thumbnail with Fallback
export const ImageThumbnail: React.FC<{
  url?: string | null
  alt?: string | null
  className?: string
}> = ({ url, alt, className = '' }) => {
  const [hasError, setHasError] = useState(false)
  const resolvedUrl = getProjectImageUrl(url)

  useEffect(() => {
    setHasError(false)
  }, [url])

  if (hasError || !resolvedUrl) {
    return (
      <div
        className={`w-full h-full bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center p-2 text-zinc-500 select-none ${className}`}
      >
        <ImageIcon className="w-6 h-6 text-zinc-600 mb-1" />
        <span className="text-[10px] text-zinc-500 font-mono text-center truncate max-w-[90%]">
          {alt || 'Image Preview'}
        </span>
      </div>
    )
  }

  return (
    <img
      src={resolvedUrl}
      alt={alt || 'Project media'}
      onError={() => setHasError(true)}
      className={className}
      loading="lazy"
    />
  )
}

export const ProjectGalleryView: React.FC<ProjectGalleryViewProps> = ({
  projectId,
  projectTitle,
  images: propImages,
  featuredImageUrl: propFeaturedUrl,
  bannerImageUrl: propBannerUrl,
  featuredImageId,
  coverImageId,
  isLoading: initialLoading = false,
  readOnly = false,
  onImagesChange,
  onSelectFeatured,
  onSelectCover,
  onSelectBanner,
  onClearFeatured,
  onClearCover,
  onDeleteImage,
  onUploadSuccess,
  className = '',
}) => {
  const [images, setImages] = useState<ProjectImage[]>(propImages)
  const [filter, setFilter] = useState<'all' | 'featured' | 'cover' | 'banner'>('all')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)

  // Edit Metadata Modal State
  const [editingImage, setEditingImage] = useState<ProjectImage | null>(null)
  const [editAltText, setEditAltText] = useState('')
  const [editCaption, setEditCaption] = useState('')
  const [editOrder, setEditOrder] = useState<number>(0)
  const [isSavingMeta, setIsSavingMeta] = useState(false)

  // Delete Confirmation State
  const [deletingImageId, setDeletingImageId] = useState<number | string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Action Loading tracking
  const [actionInProgress, setActionInProgress] = useState<{ id: number | string; action: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Synchronize propImages with internal state
  useEffect(() => {
    setImages(propImages)
  }, [propImages])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  // Reload images from API if projectId is available
  const reloadImages = async () => {
    if (!projectId) return
    setIsRefreshing(true)
    try {
      const refreshed = await projectService.getGalleryImages(projectId)
      setImages(refreshed)
      if (onImagesChange) onImagesChange(refreshed)
      showToast('Gallery refreshed from server')
    } catch {
      showToast('Failed to refresh gallery')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (lightboxIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null)
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : images.length - 1))
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : 0))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex, images.length])

  // Resolve matching image for featured / cover
  const activeFeatured = images.find(
    (i) =>
      i.is_featured ||
      (featuredImageId && i.id === featuredImageId) ||
      (propFeaturedUrl && (i.image_url === propFeaturedUrl || i.url === propFeaturedUrl))
  )

  const activeCover = images.find(
    (i) =>
      i.is_cover ||
      i.is_banner ||
      (coverImageId && i.id === coverImageId) ||
      (propBannerUrl && (i.image_url === propBannerUrl || i.url === propBannerUrl))
  )

  // Filter images based on selected tab
  const filteredImages = images.filter((img) => {
    const isFeat =
      img.is_featured ||
      img.id === featuredImageId ||
      (propFeaturedUrl && (img.image_url === propFeaturedUrl || img.url === propFeaturedUrl))
    const isCov =
      img.is_cover ||
      img.is_banner ||
      img.id === coverImageId ||
      (propBannerUrl && (img.image_url === propBannerUrl || img.url === propBannerUrl))
    const isBan =
      img.is_banner ||
      (propBannerUrl && (img.image_url === propBannerUrl || img.url === propBannerUrl))

    if (filter === 'featured') return isFeat
    if (filter === 'cover') return isCov
    if (filter === 'banner') return isBan
    return true
  })

  // Count stats
  const stats = {
    total: images.length,
    featured: images.filter(
      (i) =>
        i.is_featured ||
        i.id === featuredImageId ||
        (propFeaturedUrl && (i.image_url === propFeaturedUrl || i.url === propFeaturedUrl))
    ).length,
    cover: images.filter(
      (i) =>
        i.is_cover ||
        i.is_banner ||
        i.id === coverImageId ||
        (propBannerUrl && (i.image_url === propBannerUrl || i.url === propBannerUrl))
    ).length,
    banner: images.filter((i) => i.is_banner).length,
  }

  // Handle Upload
  const handleFilesSelected = async (files: FileList | File[]) => {
    const fileList = Array.from(files)
    if (fileList.length === 0) return

    setIsUploading(true)
    setUploadError('')

    try {
      const uploadedImages: ProjectImage[] = []

      if (projectId) {
        // Direct gallery creation via POST /projects/:id/images
        for (const file of fileList) {
          const res = await projectService.createImage(projectId, {
            image: file,
            is_cover: images.length === 0,
            is_featured: images.length === 0,
            is_banner: false,
          })
          if (res) {
            uploadedImages.push({
              ...res,
              image_url: getImageUrlFromObject(res),
            })
          }
        }

        // Fetch fresh database list to ensure complete synchronization
        const refreshed = await projectService.getGalleryImages(projectId).catch(() => null)
        const updated = refreshed && refreshed.length > 0 ? refreshed : [...images, ...uploadedImages]
        setImages(updated)
        if (onImagesChange) onImagesChange(updated)
        if (onUploadSuccess) onUploadSuccess()

        // Auto-select first uploaded image as featured if not set yet
        if (!propFeaturedUrl && updated.length > 0) {
          await handleSetFeatured(updated[0])
        }
        showToast(`${uploadedImages.length} image(s) uploaded successfully!`)
      } else {
        // Create Mode: Upload via POST /projects/upload to get live server URLs immediately
        try {
          for (const file of fileList) {
            const [uploaded] = await projectService.uploadMedia(file)
            if (uploaded) {
              uploadedImages.push({
                ...uploaded,
                id: uploaded.id || `temp-${Date.now()}-${Math.random()}`,
                image_url: getImageUrlFromObject(uploaded) || URL.createObjectURL(file),
                is_cover: images.length === 0 && uploadedImages.length === 0,
                is_featured: images.length === 0 && uploadedImages.length === 0,
                is_banner: false,
                is_gallery: true,
                display_order: images.length + uploadedImages.length + 1,
                sort_order: images.length + uploadedImages.length + 1,
                created_at: new Date().toISOString(),
              })
            }
          }
        } catch {
          // Fallback to local object URLs if upload endpoint fails
          fileList.forEach((file, idx) => {
            const localUrl = URL.createObjectURL(file)
            uploadedImages.push({
              id: `staged-${Date.now()}-${idx}`,
              image_url: localUrl,
              is_cover: images.length === 0 && idx === 0,
              is_featured: images.length === 0 && idx === 0,
              is_banner: false,
              is_gallery: true,
              display_order: images.length + idx + 1,
              sort_order: images.length + idx + 1,
              created_at: new Date().toISOString(),
            })
          })
        }

        const updated = [...images, ...uploadedImages]
        setImages(updated)
        if (onImagesChange) onImagesChange(updated)

        // Auto-select first image as featured
        if (!propFeaturedUrl && updated.length > 0) {
          handleSetFeatured(updated[0])
        }
        showToast(`${uploadedImages.length} image(s) uploaded to gallery!`)
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setUploadError(errorObj.message || 'Failed to upload images')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Promote / Toggle Actions
  const handleSetFeatured = async (img: ProjectImage) => {
    setActionInProgress({ id: img.id, action: 'featured' })
    try {
      if (onSelectFeatured) {
        await onSelectFeatured(img)
      } else if (projectId && typeof img.id === 'number') {
        await Promise.allSettled([
          projectService.selectImages(projectId, { featured_image_id: img.id }),
          projectService.setFeaturedImage(projectId, img.id),
        ])
      }

      const updated = images.map((i) => ({
        ...i,
        is_featured: i.id === img.id,
      }))
      setImages(updated)
      if (onImagesChange) onImagesChange(updated)
      showToast('Set as Featured Image via API')
    } catch {
      showToast('Failed to update featured image')
    } finally {
      setActionInProgress(null)
    }
  }

  const handleSetCover = async (img: ProjectImage) => {
    setActionInProgress({ id: img.id, action: 'cover' })
    try {
      if (onSelectCover) {
        await onSelectCover(img)
      } else if (projectId && typeof img.id === 'number') {
        await Promise.allSettled([
          projectService.selectImages(projectId, {
            cover_image_id: img.id,
            banner_image_id: img.id,
          }),
          projectService.setCoverImage(projectId, img.id),
        ])
      }

      const updated = images.map((i) => ({
        ...i,
        is_cover: i.id === img.id,
      }))
      setImages(updated)
      if (onImagesChange) onImagesChange(updated)
      showToast('Set as Cover Image via API')
    } catch {
      showToast('Failed to update cover image')
    } finally {
      setActionInProgress(null)
    }
  }

  const handleSetBanner = async (img: ProjectImage) => {
    setActionInProgress({ id: img.id, action: 'banner' })
    try {
      if (onSelectBanner) {
        await onSelectBanner(img)
      } else if (projectId && typeof img.id === 'number') {
        await Promise.allSettled([
          projectService.selectImages(projectId, { banner_image_id: img.id }),
          projectService.setBannerImage(projectId, img.id),
        ])
      }

      const updated = images.map((i) => ({
        ...i,
        is_banner: i.id === img.id,
      }))
      setImages(updated)
      if (onImagesChange) onImagesChange(updated)
      showToast('Set as Banner Image via API')
    } catch {
      showToast('Failed to update banner image')
    } finally {
      setActionInProgress(null)
    }
  }

  // Delete Image
  const handleDeleteImage = async (img: ProjectImage) => {
    setIsDeleting(true)
    try {
      if (onDeleteImage) {
        await onDeleteImage(img)
      } else if (projectId && typeof img.id === 'number') {
        await projectService.deleteImage(projectId, img.id)
      }

      const updated = images.filter((i) => i.id !== img.id && i.image_url !== img.image_url)
      setImages(updated)
      if (onImagesChange) onImagesChange(updated)
      setDeletingImageId(null)
      if (lightboxIndex !== null && images[lightboxIndex]?.id === img.id) {
        setLightboxIndex(null)
      }
      showToast('Image deleted successfully')
    } catch {
      showToast('Failed to delete image')
    } finally {
      setIsDeleting(false)
    }
  }

  // Reorder Images (Move Up / Down)
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= images.length) return

    const reordered = [...images]
    const temp = reordered[index]
    reordered[index] = reordered[targetIndex]
    reordered[targetIndex] = temp

    // Update display_order & sort_order
    const updated = reordered.map((img, idx) => ({
      ...img,
      display_order: idx + 1,
      sort_order: idx + 1,
    }))

    setImages(updated)
    if (onImagesChange) onImagesChange(updated)

    if (projectId) {
      try {
        const payload = updated
          .filter((i) => typeof i.id === 'number')
          .map((i, idx) => ({ id: Number(i.id), sort_order: idx + 1, display_order: idx + 1 }))
        await projectService.reorderImages(projectId, payload)
        showToast('Image order updated')
      } catch {
        showToast('Failed to save image order to server')
      }
    }
  }

  // Open Edit Metadata Modal
  const handleOpenEditMeta = (img: ProjectImage) => {
    setEditingImage(img)
    setEditAltText(img.alt_text || '')
    setEditCaption(img.caption || '')
    setEditOrder(img.display_order ?? img.sort_order ?? 0)
  }

  // Save Metadata
  const handleSaveMeta = async () => {
    if (!editingImage) return
    setIsSavingMeta(true)

    try {
      if (projectId && typeof editingImage.id === 'number') {
        await projectService.updateImage(projectId, editingImage.id, {
          alt_text: editAltText.trim() || undefined,
          caption: editCaption.trim() || undefined,
          display_order: editOrder,
        })
      }

      const updated = images.map((i) =>
        i.id === editingImage.id
          ? {
              ...i,
              alt_text: editAltText.trim() || null,
              caption: editCaption.trim() || null,
              display_order: editOrder,
              sort_order: editOrder,
            }
          : i
      )

      setImages(updated)
      if (onImagesChange) onImagesChange(updated)
      setEditingImage(null)
      showToast('Image details updated')
    } catch {
      showToast('Failed to save image details')
    } finally {
      setIsSavingMeta(false)
    }
  }

  // Copy Image Link
  const handleCopyUrl = (url: string) => {
    const fullUrl = getProjectImageUrl(url)
    navigator.clipboard.writeText(fullUrl)
    setCopiedUrl(true)
    showToast('Image link copied to clipboard')
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const activeLightboxImage = lightboxIndex !== null ? images[lightboxIndex] : null

  return (
    <div className={`space-y-6 font-sans ${className}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-medium text-white shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. GALLERY UPLOAD DROPZONE */}
      {!readOnly && (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            if (e.dataTransfer.files) handleFilesSelected(e.dataTransfer.files)
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 text-center group ${
            isDragging
              ? 'border-white bg-zinc-900/80'
              : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 hover:bg-zinc-900/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/avif"
            onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-white group-hover:scale-105 transition-all shadow-md">
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>

          <div>
            <p className="text-sm font-bold text-white tracking-tight">
              {isUploading ? 'Uploading images to gallery...' : 'Drop project images here to upload'}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              or <span className="text-white underline font-medium">browse from your computer</span> • Supports PNG, JPG, WebP, AVIF
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500">
            <span>Upload multiple images</span>
            <span>•</span>
            <span>Choose Featured & Cover directly from the grid below</span>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError('')} className="text-red-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. ACTIVE SELECTION SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Featured Card Selection Preview */}
        <div
          className={`p-3.5 rounded-2xl border transition-all ${
            activeFeatured
              ? 'bg-amber-950/15 border-amber-500/40 ring-1 ring-amber-500/20 shadow-sm'
              : 'bg-zinc-900/30 border-zinc-800/80'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-black border border-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {activeFeatured ? (
                  <ImageThumbnail
                    url={getImageUrlFromObject(activeFeatured)}
                    alt="Featured"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Star className="w-5 h-5 text-zinc-600" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                  Featured Card Image
                </span>
                <span className="text-xs font-semibold text-white truncate block mt-0.5">
                  {activeFeatured
                    ? activeFeatured.caption || `Image ID #${activeFeatured.id}`
                    : 'Not selected yet'}
                </span>
                <span className="text-[11px] text-zinc-500 block truncate">
                  {activeFeatured
                    ? 'Card & listing thumbnail active'
                    : 'Click "Set Featured" on any image below'}
                </span>
              </div>
            </div>

            {activeFeatured && !readOnly && onClearFeatured && (
              <button
                type="button"
                onClick={onClearFeatured}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                title="Clear featured image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Cover Image Selection Preview */}
        <div
          className={`p-3.5 rounded-2xl border transition-all ${
            activeCover
              ? 'bg-cyan-950/15 border-cyan-500/40 ring-1 ring-cyan-500/20 shadow-sm'
              : 'bg-zinc-900/30 border-zinc-800/80'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-black border border-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {activeCover ? (
                  <ImageThumbnail
                    url={getImageUrlFromObject(activeCover)}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <LayoutTemplate className="w-5 h-5 text-zinc-600" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                  Cover Banner Image
                </span>
                <span className="text-xs font-semibold text-white truncate block mt-0.5">
                  {activeCover
                    ? activeCover.caption || `Image ID #${activeCover.id}`
                    : 'Not selected yet'}
                </span>
                <span className="text-[11px] text-zinc-500 block truncate">
                  {activeCover
                    ? 'Hero header banner active'
                    : 'Click "Set Cover" on any image below'}
                </span>
              </div>
            </div>

            {activeCover && !readOnly && onClearCover && (
              <button
                type="button"
                onClick={onClearCover}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                title="Clear cover image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. GALLERY TOOLBAR & FILTER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-950 border border-zinc-800/90">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              All Uploaded Images ({images.length})
            </h3>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setFilter('featured')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'featured'
                ? 'bg-amber-500 text-black shadow-xs'
                : 'bg-zinc-900 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800'
            }`}
          >
            <Star className="w-3 h-3" />
            <span>Featured ({stats.featured})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('cover')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'cover'
                ? 'bg-cyan-500 text-black shadow-xs'
                : 'bg-zinc-900 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800'
            }`}
          >
            <LayoutTemplate className="w-3 h-3" />
            <span>Cover ({stats.cover})</span>
          </button>

          {projectId && (
            <button
              type="button"
              onClick={reloadImages}
              disabled={isRefreshing}
              className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer disabled:opacity-50 ml-1"
              title="Refresh images from server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* 4. GALLERY GRID */}
      {initialLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          <span className="text-xs">Loading project gallery...</span>
        </div>
      ) : filteredImages.length === 0 ? (
        <div
          onClick={() => !readOnly && fileInputRef.current?.click()}
          className={`py-14 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-2.5 text-center bg-zinc-950/40 ${
            readOnly ? '' : 'cursor-pointer hover:border-zinc-700 group'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-300 group-hover:text-white">
              {filter === 'all'
                ? 'No images uploaded yet'
                : `No images under "${filter}" filter`}
            </p>
            {!readOnly && (
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Click here or use the upload area above to add images
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((img, idx) => {
            const rawUrl = getImageUrlFromObject(img)
            const isFeat =
              img.is_featured ||
              img.id === featuredImageId ||
              (propFeaturedUrl && (img.image_url === propFeaturedUrl || img.url === propFeaturedUrl))
            const isCov =
              img.is_cover ||
              img.is_banner ||
              img.id === coverImageId ||
              (propBannerUrl && (img.image_url === propBannerUrl || img.url === propBannerUrl))
            const isBan =
              img.is_banner ||
              (propBannerUrl && (img.image_url === propBannerUrl || img.url === propBannerUrl))
            const imgOrder = img.display_order ?? img.sort_order ?? idx + 1

            return (
              <div
                key={img.id || idx}
                className={`group relative rounded-2xl overflow-hidden bg-zinc-900/70 border transition-all duration-200 flex flex-col ${
                  isFeat && isCov
                    ? 'border-amber-500 ring-2 ring-cyan-500/50 shadow-lg shadow-amber-500/10'
                    : isFeat
                    ? 'border-amber-500 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/10'
                    : isCov
                    ? 'border-cyan-500 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-500/10'
                    : 'border-zinc-800/80 hover:border-zinc-700 hover:shadow-xl'
                }`}
              >
                {/* Image Thumbnail Container */}
                <div
                  onClick={() => setLightboxIndex(images.findIndex((i) => i.id === img.id))}
                  className="relative aspect-[16/10] w-full bg-black overflow-hidden cursor-pointer flex items-center justify-center"
                >
                  <ImageThumbnail
                    url={rawUrl}
                    alt={img.alt_text || 'Project media'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 opacity-50 group-hover:opacity-80 transition-opacity" />

                  {/* Badges (Top-Left) */}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10 pointer-events-none">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-black/80 text-zinc-300 backdrop-blur-xs border border-white/10">
                      #{imgOrder}
                    </span>
                    {isFeat && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-black flex items-center gap-1 shadow-sm">
                        <Star className="w-2.5 h-2.5 fill-black" />
                        <span>Featured</span>
                      </span>
                    )}
                    {isCov && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500 text-black flex items-center gap-1 shadow-sm">
                        <LayoutTemplate className="w-2.5 h-2.5" />
                        <span>Cover</span>
                      </span>
                    )}
                    {isBan && !isCov && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500 text-white flex items-center gap-1 shadow-sm">
                        <Flag className="w-2.5 h-2.5" />
                        <span>Banner</span>
                      </span>
                    )}
                  </div>

                  {/* Top-Right Action Buttons */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setLightboxIndex(images.findIndex((i) => i.id === img.id))
                      }}
                      className="p-1.5 rounded-lg bg-black/80 hover:bg-white text-zinc-300 hover:text-black backdrop-blur-xs border border-white/10 transition-colors cursor-pointer"
                      title="Enlarge preview"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>

                    {!readOnly && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenEditMeta(img)
                          }}
                          className="p-1.5 rounded-lg bg-black/80 hover:bg-white text-zinc-300 hover:text-black backdrop-blur-xs border border-white/10 transition-colors cursor-pointer"
                          title="Edit alt text & caption"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeletingImageId(img.id)
                          }}
                          className="p-1.5 rounded-lg bg-black/80 hover:bg-red-950 text-zinc-400 hover:text-red-400 backdrop-blur-xs border border-white/10 transition-colors cursor-pointer"
                          title="Delete image"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Center Hint */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="text-[11px] font-medium text-white px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-xs border border-white/20 flex items-center gap-1.5">
                      <Maximize2 className="w-3 h-3" />
                      <span>Zoom Image</span>
                    </span>
                  </div>
                </div>

                {/* Card Body & Selection Buttons */}
                <div className="p-3 bg-zinc-950/90 border-t border-zinc-800/80 flex-1 flex flex-col justify-between gap-2.5">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-zinc-200 line-clamp-1" title={img.caption || `Image #${imgOrder}`}>
                      {img.caption || `Image #${imgOrder}`}
                    </p>
                    {img.alt_text && (
                      <p className="text-[10px] text-zinc-400 font-mono truncate" title={img.alt_text}>
                        Alt: {img.alt_text}
                      </p>
                    )}
                  </div>

                  {/* CHOOSE FEATURED & COVER BUTTONS */}
                  {!readOnly && (
                    <div className="space-y-2 pt-1 border-t border-zinc-900">
                      <div className="grid grid-cols-2 gap-1.5">
                        {/* 1. Choose as Featured */}
                        <button
                          type="button"
                          disabled={actionInProgress?.id === img.id}
                          onClick={() => handleSetFeatured(img)}
                          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                            isFeat
                              ? 'bg-amber-500 text-black shadow-xs font-bold'
                              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-zinc-800'
                          }`}
                          title="Choose as Featured Card Thumbnail"
                        >
                          {actionInProgress?.id === img.id && actionInProgress?.action === 'featured' ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Star className={`w-3 h-3 ${isFeat ? 'fill-black' : ''}`} />
                          )}
                          <span>{isFeat ? 'Featured ★' : 'Set Featured'}</span>
                        </button>

                        {/* 2. Choose as Cover */}
                        <button
                          type="button"
                          disabled={actionInProgress?.id === img.id}
                          onClick={() => handleSetCover(img)}
                          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                            isCov
                              ? 'bg-cyan-500 text-black shadow-xs font-bold'
                              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-400 border border-zinc-800'
                          }`}
                          title="Choose as Cover Banner Image"
                        >
                          {actionInProgress?.id === img.id && actionInProgress?.action === 'cover' ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <LayoutTemplate className="w-3 h-3" />
                          )}
                          <span>{isCov ? 'Cover Active' : 'Set Cover'}</span>
                        </button>
                      </div>

                      {/* Reorder Buttons */}
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
                        <span className="font-mono text-zinc-500">
                          {typeof img.id === 'number' ? `ID #${img.id}` : 'Staged'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveOrder(idx, 'up')}
                            className="p-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            title="Move earlier"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === filteredImages.length - 1}
                            onClick={() => handleMoveOrder(idx, 'down')}
                            className="p-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            title="Move later"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 5. LIGHTBOX MODAL */}
      {lightboxIndex !== null && activeLightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200">
          {/* Top Bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-zinc-400 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800">
                Image {lightboxIndex + 1} of {images.length}
              </span>
              {projectTitle && (
                <span className="text-xs text-zinc-400 hidden sm:inline-block truncate max-w-xs">
                  • {projectTitle}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Copy URL */}
              <button
                type="button"
                onClick={() => handleCopyUrl(getImageUrlFromObject(activeLightboxImage))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-all cursor-pointer"
                title="Copy direct image link"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Copy Link</span>
              </button>

              {/* Open in new tab */}
              <a
                href={getProjectImageUrl(getImageUrlFromObject(activeLightboxImage))}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer"
                title="Open original image in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Previous Button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setLightboxIndex((prev) =>
                  prev !== null && prev > 0 ? prev - 1 : images.length - 1
                )
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-800 text-white transition-all cursor-pointer z-20 active:scale-95 shadow-xl"
              title="Previous image (Left arrow)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Next Button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setLightboxIndex((prev) =>
                  prev !== null && prev < images.length - 1 ? prev + 1 : 0
                )
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-800 text-white transition-all cursor-pointer z-20 active:scale-95 shadow-xl"
              title="Next image (Right arrow)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Main Enlarge View */}
          <div className="max-w-5xl max-h-[75vh] w-full flex items-center justify-center p-2 z-10">
            <ImageThumbnail
              url={getImageUrlFromObject(activeLightboxImage)}
              alt={activeLightboxImage.alt_text || 'Project media'}
              className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl border border-zinc-800/80"
            />
          </div>

          {/* Bottom Info Bar */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-800 backdrop-blur-md z-20">
            <div className="min-w-0 max-w-xl">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white truncate">
                  {activeLightboxImage.caption || 'Project Image'}
                </h4>
                {activeLightboxImage.is_featured && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-black">
                    Featured
                  </span>
                )}
                {activeLightboxImage.is_cover && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500 text-black">
                    Cover
                  </span>
                )}
                {activeLightboxImage.is_banner && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500 text-white">
                    Banner
                  </span>
                )}
              </div>
              {activeLightboxImage.alt_text && (
                <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate">
                  Alt text: {activeLightboxImage.alt_text}
                </p>
              )}
            </div>

            {/* Lightbox Quick Actions */}
            {!readOnly && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSetFeatured(activeLightboxImage)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeLightboxImage.is_featured
                      ? 'bg-amber-500 text-black'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <Star className="w-3 h-3" />
                  <span>Featured</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetCover(activeLightboxImage)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeLightboxImage.is_cover
                      ? 'bg-cyan-500 text-black'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <LayoutTemplate className="w-3 h-3" />
                  <span>Cover</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetBanner(activeLightboxImage)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeLightboxImage.is_banner
                      ? 'bg-indigo-500 text-white'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <Flag className="w-3 h-3" />
                  <span>Banner</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. EDIT METADATA MODAL */}
      {editingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white">Edit Image Metadata</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingImage(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail Preview */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-black">
                <ImageThumbnail
                  url={getImageUrlFromObject(editingImage)}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-mono text-zinc-400 block truncate">
                  ID #{editingImage.id}
                </span>
                <span className="text-xs text-zinc-300 font-medium truncate block mt-0.5">
                  {editingImage.caption || 'No caption'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">
                  Caption (User-facing title)
                </label>
                <input
                  type="text"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="e.g. Mobile Dashboard Overview"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-zinc-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">
                  Alt Text (SEO & Accessibility)
                </label>
                <input
                  type="text"
                  value={editAltText}
                  onChange={(e) => setEditAltText(e.target.value)}
                  placeholder="e.g. Screenshot of the analytics dashboard interface"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-zinc-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={editOrder}
                  onChange={(e) => setEditOrder(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-hidden focus:border-zinc-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => setEditingImage(null)}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingMeta}
                onClick={handleSaveMeta}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-xs font-semibold text-zinc-950 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSavingMeta && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. DELETE CONFIRMATION MODAL */}
      {deletingImageId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-400">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Image?</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  This image will be permanently removed from this project gallery.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => setDeletingImageId(null)}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  const toDel = images.find((i) => i.id === deletingImageId)
                  if (toDel) handleDeleteImage(toDel)
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectGalleryView
