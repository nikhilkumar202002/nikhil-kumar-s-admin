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
} from 'lucide-react'
import projectService, {
  type ProjectImage,
  getProjectImageUrl,
} from '../../utils/project.service'

export interface ProjectGalleryViewProps {
  projectId?: number | string
  projectTitle?: string
  images: ProjectImage[]
  featuredImageUrl?: string
  bannerImageUrl?: string
  isLoading?: boolean
  readOnly?: boolean
  onImagesChange?: (images: ProjectImage[]) => void
  onSelectFeatured?: (image: ProjectImage) => Promise<void> | void
  onSelectCover?: (image: ProjectImage) => Promise<void> | void
  onSelectBanner?: (image: ProjectImage) => Promise<void> | void
  onDeleteImage?: (image: ProjectImage) => Promise<void> | void
  onUploadSuccess?: () => void
  className?: string
}

export const ProjectGalleryView: React.FC<ProjectGalleryViewProps> = ({
  projectId,
  projectTitle,
  images: propImages,
  featuredImageUrl,
  bannerImageUrl,
  isLoading: initialLoading = false,
  readOnly = false,
  onImagesChange,
  onSelectFeatured,
  onSelectCover,
  onSelectBanner,
  onDeleteImage,
  onUploadSuccess,
  className = '',
}) => {
  const [images, setImages] = useState<ProjectImage[]>(propImages)
  const [filter, setFilter] = useState<'all' | 'featured' | 'cover' | 'banner' | 'gallery'>('all')
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

  // Action Loading tracking (e.g. promoting)
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
      showToast('Gallery refreshed')
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

  // Filter images based on selected tab
  const filteredImages = images.filter((img) => {
    const isFeat = img.is_featured || (featuredImageUrl && img.image_url === featuredImageUrl)
    const isCov = img.is_cover || (bannerImageUrl && img.image_url === bannerImageUrl)
    const isBan = img.is_banner || (bannerImageUrl && img.image_url === bannerImageUrl)

    if (filter === 'featured') return isFeat
    if (filter === 'cover') return isCov
    if (filter === 'banner') return isBan
    if (filter === 'gallery') return img.is_gallery !== false
    return true
  })

  // Count stats
  const stats = {
    total: images.length,
    featured: images.filter((i) => i.is_featured || (featuredImageUrl && i.image_url === featuredImageUrl)).length,
    cover: images.filter((i) => i.is_cover || (bannerImageUrl && i.image_url === bannerImageUrl)).length,
    banner: images.filter((i) => i.is_banner).length,
    gallery: images.filter((i) => i.is_gallery !== false).length,
  }

  // Handle Upload
  const handleFilesSelected = async (files: FileList | File[]) => {
    const fileList = Array.from(files)
    if (fileList.length === 0) return

    setIsUploading(true)
    setUploadError('')

    try {
      if (projectId) {
        // Upload directly to API via projectService.createImage
        const uploadedImages: ProjectImage[] = []
        for (const file of fileList) {
          const res = await projectService.createImage(projectId, {
            image: file,
            is_cover: images.length === 0,
            is_featured: images.length === 0,
            is_banner: false,
          })
          if (res) uploadedImages.push(res)
        }

        const updated = [...images, ...uploadedImages]
        setImages(updated)
        if (onImagesChange) onImagesChange(updated)
        if (onUploadSuccess) onUploadSuccess()
        showToast(`${uploadedImages.length} image(s) uploaded successfully!`)
      } else {
        // Optimistic / local staging
        const localImages: ProjectImage[] = fileList.map((file, idx) => ({
          id: `temp-${Date.now()}-${idx}`,
          image_url: URL.createObjectURL(file),
          is_cover: images.length === 0 && idx === 0,
          is_featured: images.length === 0 && idx === 0,
          is_banner: false,
          is_gallery: true,
          display_order: images.length + idx + 1,
          sort_order: images.length + idx + 1,
          created_at: new Date().toISOString(),
        }))
        const updated = [...images, ...localImages]
        setImages(updated)
        if (onImagesChange) onImagesChange(updated)
        showToast(`${localImages.length} image(s) staged`)
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
        await projectService.setFeaturedImage(projectId, img.id)
      }

      const updated = images.map((i) => ({
        ...i,
        is_featured: i.id === img.id,
      }))
      setImages(updated)
      if (onImagesChange) onImagesChange(updated)
      showToast('Set as Featured Image')
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
        await projectService.setCoverImage(projectId, img.id)
      }

      const updated = images.map((i) => ({
        ...i,
        is_cover: i.id === img.id,
      }))
      setImages(updated)
      if (onImagesChange) onImagesChange(updated)
      showToast('Set as Cover Image')
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
        await projectService.setBannerImage(projectId, img.id)
      }

      const updated = images.map((i) => ({
        ...i,
        is_banner: i.id === img.id,
      }))
      setImages(updated)
      if (onImagesChange) onImagesChange(updated)
      showToast('Set as Banner Image')
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

      const updated = images.filter((i) => i.id !== img.id)
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
    <div className={`space-y-4 font-sans ${className}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-medium text-white shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Gallery Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-800">
        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            All Images ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setFilter('featured')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'featured'
                ? 'bg-amber-500 text-black shadow-xs'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800'
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
                : 'bg-zinc-900/60 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800'
            }`}
          >
            <LayoutTemplate className="w-3 h-3" />
            <span>Cover ({stats.cover})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('banner')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'banner'
                ? 'bg-indigo-500 text-white shadow-xs'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800'
            }`}
          >
            <Flag className="w-3 h-3" />
            <span>Banner ({stats.banner})</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {projectId && (
            <button
              type="button"
              onClick={reloadImages}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              title="Refresh images"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}

          {!readOnly && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,image/avif"
                onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
                className="hidden"
              />
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Images</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError('')} className="text-red-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Gallery Grid or Drag-and-Drop Area */}
      {initialLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          <span className="text-xs">Loading project gallery...</span>
        </div>
      ) : filteredImages.length === 0 ? (
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
          onClick={() => !readOnly && fileInputRef.current?.click()}
          className={`py-16 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${
            isDragging
              ? 'border-white bg-zinc-900/60'
              : 'border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/50'
          } ${readOnly ? '' : 'cursor-pointer group'}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors">
              {filter === 'all'
                ? 'No images in project gallery'
                : `No images matching "${filter}" filter`}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              {!readOnly ? 'Click to browse or drag and drop images here' : 'This project has no images'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((img, idx) => {
            const isFeat =
              img.is_featured || (featuredImageUrl && img.image_url === featuredImageUrl)
            const isCov =
              img.is_cover || (bannerImageUrl && img.image_url === bannerImageUrl)
            const isBan =
              img.is_banner || (bannerImageUrl && img.image_url === bannerImageUrl)
            const imgOrder = img.display_order ?? img.sort_order ?? idx + 1

            return (
              <div
                key={img.id || idx}
                className={`group relative rounded-2xl overflow-hidden bg-zinc-900/70 border transition-all duration-200 flex flex-col ${
                  isFeat && isCov
                    ? 'border-amber-500 ring-2 ring-cyan-500/40 shadow-lg shadow-amber-500/5'
                    : isFeat
                    ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/5'
                    : isCov
                    ? 'border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/5'
                    : isBan
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/5'
                    : 'border-zinc-800 hover:border-zinc-700 hover:shadow-xl'
                }`}
              >
                {/* Image Media Container */}
                <div
                  onClick={() => setLightboxIndex(images.findIndex((i) => i.id === img.id))}
                  className="relative aspect-[16/10] w-full bg-black overflow-hidden cursor-pointer flex items-center justify-center"
                >
                  <img
                    src={getProjectImageUrl(img.image_url)}
                    alt={img.alt_text || 'Project media'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Dark gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Badges Overlay (Top-Left) */}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10 pointer-events-none">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-black/70 text-zinc-300 backdrop-blur-xs border border-white/10">
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
                    {isBan && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500 text-white flex items-center gap-1 shadow-sm">
                        <Flag className="w-2.5 h-2.5" />
                        <span>Banner</span>
                      </span>
                    )}
                  </div>

                  {/* Top-Right Quick Action Icons */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* View Zoom */}
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
                        {/* Edit Metadata */}
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

                        {/* Delete */}
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

                  {/* Center Enlarge Hint */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="text-[11px] font-medium text-white px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs border border-white/20 flex items-center gap-1.5">
                      <Maximize2 className="w-3 h-3" />
                      <span>View Gallery Item</span>
                    </span>
                  </div>
                </div>

                {/* Card Info & Details */}
                <div className="p-3 bg-zinc-950/90 border-t border-zinc-800/80 flex-1 flex flex-col justify-between gap-2.5">
                  <div className="space-y-1">
                    {img.caption ? (
                      <p className="text-xs font-semibold text-zinc-200 line-clamp-1" title={img.caption}>
                        {img.caption}
                      </p>
                    ) : (
                      <p className="text-[11px] text-zinc-500 italic">No caption set</p>
                    )}

                    {img.alt_text && (
                      <p className="text-[10px] text-zinc-400 font-mono truncate" title={img.alt_text}>
                        Alt: {img.alt_text}
                      </p>
                    )}
                  </div>

                  {/* Designation & Reorder Controls */}
                  {!readOnly && (
                    <div className="space-y-2 pt-1 border-t border-zinc-900">
                      {/* Set Designation Buttons */}
                      <div className="grid grid-cols-3 gap-1">
                        {/* Featured */}
                        <button
                          type="button"
                          disabled={actionInProgress?.id === img.id}
                          onClick={() => handleSetFeatured(img)}
                          className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                            isFeat
                              ? 'bg-amber-500 text-black shadow-xs font-bold'
                              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 border border-zinc-800'
                          }`}
                          title="Designate as Featured Card"
                        >
                          {actionInProgress?.id === img.id && actionInProgress?.action === 'featured' ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <Star className={`w-2.5 h-2.5 ${isFeat ? 'fill-black' : ''}`} />
                          )}
                          <span>{isFeat ? 'Featured' : 'Feat'}</span>
                        </button>

                        {/* Cover */}
                        <button
                          type="button"
                          disabled={actionInProgress?.id === img.id}
                          onClick={() => handleSetCover(img)}
                          className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                            isCov
                              ? 'bg-cyan-500 text-black shadow-xs font-bold'
                              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 border border-zinc-800'
                          }`}
                          title="Designate as Cover Image"
                        >
                          {actionInProgress?.id === img.id && actionInProgress?.action === 'cover' ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <LayoutTemplate className="w-2.5 h-2.5" />
                          )}
                          <span>{isCov ? 'Cover' : 'Cover'}</span>
                        </button>

                        {/* Banner */}
                        <button
                          type="button"
                          disabled={actionInProgress?.id === img.id}
                          onClick={() => handleSetBanner(img)}
                          className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                            isBan
                              ? 'bg-indigo-500 text-white shadow-xs font-bold'
                              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-indigo-400 border border-zinc-800'
                          }`}
                          title="Designate as Banner Image"
                        >
                          {actionInProgress?.id === img.id && actionInProgress?.action === 'banner' ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <Flag className="w-2.5 h-2.5" />
                          )}
                          <span>{isBan ? 'Banner' : 'Banner'}</span>
                        </button>
                      </div>

                      {/* Reorder Buttons */}
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                        <span className="font-mono">Order #{imgOrder}</span>
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

      {/* LIGHTBOX / FULLSCREEN ZOOM MODAL */}
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
                onClick={() => handleCopyUrl(activeLightboxImage.image_url)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-all cursor-pointer"
                title="Copy direct image link"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Copy Link</span>
              </button>

              {/* Open in new tab */}
              <a
                href={getProjectImageUrl(activeLightboxImage.image_url)}
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
            <img
              src={getProjectImageUrl(activeLightboxImage.image_url)}
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

      {/* EDIT METADATA MODAL */}
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
              <img
                src={getProjectImageUrl(editingImage.image_url)}
                alt="preview"
                className="w-14 h-14 rounded-lg object-cover"
              />
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

      {/* DELETE CONFIRMATION MODAL */}
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
