import React, { useState, useEffect } from 'react'
import {
  X,
  Images,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import projectService, {
  type Project,
  type ProjectImage,
} from '../../utils/project.service'
import ProjectGalleryView from './ProjectGalleryView'

export interface ProjectGalleryModalProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  onProjectUpdated?: () => void
}

export const ProjectGalleryModal: React.FC<ProjectGalleryModalProps> = ({
  project,
  isOpen,
  onClose,
  onProjectUpdated,
}) => {
  const [images, setImages] = useState<ProjectImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const fetchImages = async () => {
    if (!project) return
    setIsLoading(true)
    setErrorMessage('')

    try {
      const data = await projectService.getGalleryImages(project.id)
      setImages(data || [])
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setErrorMessage(errorObj.message || 'Failed to load project images')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && project) {
      fetchImages()
    } else {
      setImages([])
      setErrorMessage('')
    }
  }, [isOpen, project?.id])

  if (!isOpen || !project) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-6xl max-h-[92vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center justify-between gap-4 bg-zinc-950">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white flex-shrink-0">
              <Images className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white truncate">
                  {project.title}
                </h2>
                <span className="font-mono text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 flex-shrink-0">
                  ID #{project.id}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2 truncate">
                <span>Gallery & Media Manager</span>
                <span className="text-zinc-600">•</span>
                <span className="font-mono text-zinc-500">/{project.slug}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={fetchImages}
              disabled={isLoading}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Refresh images"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                onClick={() => setErrorMessage('')}
                className="text-red-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="py-28 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <Loader2 className="w-7 h-7 animate-spin text-white" />
              <span className="text-xs font-medium">Fetching gallery images from server...</span>
            </div>
          ) : (
            <ProjectGalleryView
              projectId={project.id}
              projectTitle={project.title}
              images={images}
              featuredImageUrl={project.featured_image || project.cover_image || ''}
              bannerImageUrl={project.banner_image || ''}
              onImagesChange={(updated) => {
                setImages(updated)
                if (onProjectUpdated) onProjectUpdated()
              }}
              onUploadSuccess={() => {
                if (onProjectUpdated) onProjectUpdated()
              }}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/90 flex items-center justify-between text-xs text-zinc-500">
          <span className="font-mono">
            {images.length} {images.length === 1 ? 'image' : 'images'} in gallery
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProjectGalleryModal
