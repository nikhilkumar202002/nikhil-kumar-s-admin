import axiosService, { BASE_SERVER_URL } from './axios.service'

export interface ProjectImage {
  id: number | string
  project_id?: number
  url?: string
  image_url: string
  exact_link?: string
  image_path?: string
  relative_path?: string
  filename?: string
  original_name?: string
  size?: number
  mimetype?: string
  alt_text?: string | null
  caption?: string | null
  is_cover: boolean
  is_featured?: boolean
  is_banner?: boolean
  is_gallery?: boolean
  display_order?: number
  sort_order?: number
  created_at?: string
}

export interface ProjectCategoryDetail {
  id: number
  name: string
  slug?: string
}

export interface ProjectTechnologyDetail {
  id: number
  name: string
  slug?: string
}

export interface Project {
  id: number
  title: string
  slug: string
  year?: number | string | null
  short_description?: string | null
  description?: string | null
  category_id?: number | null
  category?: string | null
  category_detail?: ProjectCategoryDetail | null
  client_name?: string | null
  project_url?: string | null
  live_url?: string | null
  repository_url?: string | null
  github_url?: string | null
  role?: string | null
  project_type?: string | null
  start_date?: string | null
  end_date?: string | null
  is_featured: boolean
  status: 'draft' | 'published' | 'archived'
  display_order: number
  sort_order: number
  featured_image?: string | null
  banner_image?: string | null
  cover_image?: string | null
  thumbnail_image?: string | null
  thumbnail_url?: string | null
  meta_title?: string | null
  meta_description?: string | null
  canonical_url?: string | null
  created_by?: number | null
  published_at?: string | null
  created_at: string
  updated_at: string
  technologies?: string[]
  technology_ids?: number[] | string
  technologies_list?: ProjectTechnologyDetail[]
  images?: ProjectImage[]
  featured_images?: ProjectImage[]
  gallery_images?: ProjectImage[]
  views_count?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface ProjectQueryParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  category_id?: number | string
  technology?: string
  status?: 'draft' | 'published' | 'archived' | ''
  is_featured?: boolean
  featured?: boolean
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface CreateProjectPayload {
  title: string
  category_id?: number | string
  technology_ids?: string | number[]
  year?: string | number
  status?: 'draft' | 'published' | 'archived'
  is_featured?: boolean | string
  featured_image?: File | string | null
  cover_image?: File | string | null
  banner_image?: File | string | null
  images?: File | File[] | string
  gallery_images?: File | File[] | string
  short_description?: string
  description?: string
  client_name?: string
  project_url?: string
  live_url?: string
  repository_url?: string
  github_url?: string
  role?: string
  project_type?: string
  meta_title?: string
  meta_description?: string
  canonical_url?: string
  display_order?: number | string
  slug?: string
  start_date?: string | null
  end_date?: string | null
  technologies?: string[]
}

export interface UpdateProjectPayload extends Partial<CreateProjectPayload> {}

export interface ProjectImageUploadPayload {
  image: File | Blob
  alt_text?: string
  caption?: string
  is_cover?: boolean | string
  is_featured?: boolean | string
  is_banner?: boolean | string
}

export interface ProjectImageSelectionPayload {
  featured_image_id?: number | string
  banner_image_id?: number | string
  cover_image_id?: number | string
  featured_image?: string
  banner_image?: string
  cover_image?: string
}

export interface ProjectImageUpdatePayload {
  alt_text?: string | null
  caption?: string | null
  display_order?: number
  sort_order?: number
  is_cover?: boolean
  is_featured?: boolean
  is_banner?: boolean
}

export interface ProjectStats {
  total: number
  published: number
  draft: number
  archived: number
  featured: number
  categories_count: number
  technologies_count: number
  totalProjects?: number
  publishedProjects?: number
  draftProjects?: number
  archivedProjects?: number
  featuredProjects?: number
  [key: string]: unknown
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  pagination?: PaginationMeta
}

/**
 * Resolves static media URLs from API:
 * If the URL returned by the backend starts with http://localhost:3000,
 * it maps it to the live BASE_SERVER_URL.
 */
export const getProjectImageUrl = (url?: string | null): string => {
  if (!url) return ''
  // 1. Direct blob or data URLs (from local file selection or canvas)
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url
  }
  // 2. Localhost or 127.0.0.1 URLs -> map to BASE_SERVER_URL
  if (url.startsWith('http://localhost:') || url.startsWith('http://127.0.0.1:')) {
    return url.replace(/^http:\/\/(localhost|127\.0\.0\.1):\d+/, BASE_SERVER_URL)
  }
  // 3. Upgrade insecure http://api.nikhilkumars.com to https:// to prevent mixed-content blocks
  if (url.startsWith('http://api.nikhilkumars.com')) {
    return url.replace('http://api.nikhilkumars.com', 'https://api.nikhilkumars.com')
  }
  // 4. Any full http/https URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // 5. Relative upload path -> prefix BASE_SERVER_URL
  return `${BASE_SERVER_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

/**
 * Extracts the best available image URL from any ProjectImage object
 */
export const getImageUrlFromObject = (img?: ProjectImage | null): string => {
  if (!img) return ''
  const raw =
    img.image_url ||
    img.url ||
    img.exact_link ||
    img.image_path ||
    img.relative_path ||
    ''
  return getProjectImageUrl(raw)
}

/**
 * Helper to convert CreateProjectPayload / UpdateProjectPayload into FormData
 * adhering to the API specification.
 */
export function buildProjectFormData(
  payload: CreateProjectPayload | UpdateProjectPayload
): FormData {
  const form = new FormData()

  if (payload.title !== undefined) form.append('title', payload.title)
  if (payload.category_id !== undefined && payload.category_id !== null && payload.category_id !== '') {
    form.append('category_id', String(payload.category_id))
  }
  
  if (payload.technology_ids !== undefined && payload.technology_ids !== null) {
    const techIdsStr = Array.isArray(payload.technology_ids)
      ? payload.technology_ids.join(',')
      : String(payload.technology_ids)
    form.append('technology_ids', techIdsStr)
  }

  if (payload.year !== undefined && payload.year !== null) {
    form.append('year', String(payload.year))
  }

  if (payload.status !== undefined) {
    form.append('status', payload.status)
  }

  if (payload.is_featured !== undefined) {
    form.append('is_featured', String(payload.is_featured))
  }

  if (payload.featured_image !== undefined && payload.featured_image !== null) {
    form.append('featured_image', payload.featured_image as Blob | string)
  }

  if (payload.cover_image !== undefined && payload.cover_image !== null) {
    form.append('cover_image', payload.cover_image as Blob | string)
  }

  if (payload.banner_image !== undefined && payload.banner_image !== null) {
    form.append('banner_image', payload.banner_image as Blob | string)
  }

  if (payload.images !== undefined && payload.images !== null) {
    if (Array.isArray(payload.images)) {
      payload.images.forEach((file) => form.append('images', file))
    } else {
      form.append('images', payload.images as Blob | string)
    }
  }

  if (payload.gallery_images !== undefined && payload.gallery_images !== null) {
    if (Array.isArray(payload.gallery_images)) {
      payload.gallery_images.forEach((file) => form.append('gallery_images', file))
    } else {
      form.append('gallery_images', payload.gallery_images as Blob | string)
    }
  }

  if (payload.short_description !== undefined && payload.short_description !== null) {
    form.append('short_description', payload.short_description)
  }

  if (payload.description !== undefined && payload.description !== null) {
    form.append('description', payload.description)
  }

  if (payload.client_name !== undefined && payload.client_name !== null) {
    form.append('client_name', payload.client_name)
  }

  const projUrl = payload.project_url || payload.live_url
  if (projUrl !== undefined && projUrl !== null) {
    form.append('project_url', projUrl)
    form.append('live_url', projUrl)
  }

  const repoUrl = payload.repository_url || payload.github_url
  if (repoUrl !== undefined && repoUrl !== null) {
    form.append('repository_url', repoUrl)
    form.append('github_url', repoUrl)
  }

  if (payload.role !== undefined && payload.role !== null) {
    form.append('role', payload.role)
  }

  if (payload.project_type !== undefined && payload.project_type !== null) {
    form.append('project_type', payload.project_type)
  }

  if (payload.meta_title !== undefined && payload.meta_title !== null) {
    form.append('meta_title', payload.meta_title)
  }

  if (payload.meta_description !== undefined && payload.meta_description !== null) {
    form.append('meta_description', payload.meta_description)
  }

  if (payload.canonical_url !== undefined && payload.canonical_url !== null) {
    form.append('canonical_url', payload.canonical_url)
  }

  if (payload.display_order !== undefined && payload.display_order !== null) {
    form.append('display_order', String(payload.display_order))
  }

  if (payload.slug !== undefined && payload.slug !== null) {
    form.append('slug', payload.slug)
  }

  if (payload.start_date !== undefined && payload.start_date !== null) {
    form.append('start_date', payload.start_date)
  }

  if (payload.end_date !== undefined && payload.end_date !== null) {
    form.append('end_date', payload.end_date)
  }

  return form
}

export const projectService = {
  /**
   * GET /projects/admin/all - GET all project list with filters & pagination
   */
  async getAll(params?: ProjectQueryParams): Promise<{
    projects: Project[]
    pagination: PaginationMeta
  }> {
    const response = await axiosService.get<ApiResponse<Project[]>>(
      '/projects/admin/all',
      { params }
    )

    return {
      projects: response.data.data || [],
      pagination: response.data.pagination || {
        page: 1,
        limit: 10,
        total: (response.data.data || []).length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    }
  },

  /**
   * GET /projects/admin/stats - GET Project stats
   */
  async getStats(): Promise<ProjectStats> {
    const response = await axiosService.get<ApiResponse<ProjectStats>>(
      '/projects/admin/stats'
    )
    return response.data.data
  },

  /**
   * GET /projects/admin/:id - GET Project details for editing
   */
  async getById(id: number | string): Promise<Project> {
    const response = await axiosService.get<ApiResponse<Project>>(
      `/projects/admin/${id}`
    )
    return response.data.data
  },

  /**
   * POST /projects/upload - POST method to upload media file(s)
   */
  async uploadMedia(fileOrFiles: File | File[]): Promise<ProjectImage[]> {
    const formData = new FormData()
    if (Array.isArray(fileOrFiles)) {
      fileOrFiles.forEach((f) => formData.append('images', f))
    } else {
      formData.append('images', fileOrFiles)
    }

    const response = await axiosService.post<ApiResponse<ProjectImage | ProjectImage[]>>(
      '/projects/upload',
      formData
    )
    const result = response.data.data
    return Array.isArray(result) ? result : [result]
  },

  /**
   * POST /projects - POST method to create a project
   * Submits FormData multipart/form-data
   */
  async create(data: CreateProjectPayload | FormData): Promise<Project> {
    const body = data instanceof FormData ? data : buildProjectFormData(data)
    const response = await axiosService.post<ApiResponse<Project>>(
      '/projects',
      body
    )
    return response.data.data
  },

  /**
   * PUT /projects/:id - PUT method to edit a project
   */
  async update(
    id: number | string,
    data: UpdateProjectPayload | FormData
  ): Promise<Project> {
    const body = data instanceof FormData ? data : buildProjectFormData(data)
    const response = await axiosService.put<ApiResponse<Project>>(
      `/projects/${id}`,
      body
    )
    return response.data.data
  },

  /**
   * DELETE /projects/:id - Delete method
   */
  async delete(id: number | string): Promise<{ id: number; message: string }> {
    const response = await axiosService.delete<ApiResponse<{ id: number }>>(
      `/projects/${id}`
    )
    return {
      id: Number(response.data.data?.id || id),
      message: response.data.message || 'Project deleted successfully',
    }
  },

  /**
   * PATCH /projects/:id/status - PATCH method to change status
   */
  async updateStatus(
    id: number | string,
    status: 'draft' | 'published' | 'archived'
  ): Promise<Project> {
    const response = await axiosService.patch<ApiResponse<Project>>(
      `/projects/${id}/status`,
      { status }
    )
    return response.data.data
  },

  /**
   * PATCH /projects/:id/featured - PATCH method to set featured image / toggle featured status
   */
  async setFeatured(
    id: number | string,
    is_featured: boolean,
    featured_image?: string
  ): Promise<Project> {
    const payload: { is_featured: boolean; featured_image?: string } = { is_featured }
    if (featured_image) {
      payload.featured_image = featured_image
    }
    const response = await axiosService.patch<ApiResponse<Project>>(
      `/projects/${id}/featured`,
      payload
    )
    return response.data.data
  },

  /**
   * Alias for setFeatured
   */
  async toggleFeatured(
    id: number | string,
    is_featured: boolean
  ): Promise<Project> {
    return this.setFeatured(id, is_featured)
  },

  /**
   * PATCH /projects/reorder - PATCH method to reorder
   */
  async reorder(
    projects: Array<{ id: number; sort_order?: number; display_order?: number }>
  ): Promise<{ success: boolean; message: string }> {
    const response = await axiosService.patch<ApiResponse<unknown>>(
      '/projects/reorder',
      { projects }
    )
    return {
      success: response.data.success,
      message: response.data.message,
    }
  },

  /**
   * GET /projects/:id/images - GET method for gallery images
   */
  async getGalleryImages(projectId: number | string): Promise<ProjectImage[]> {
    const response = await axiosService.get<ApiResponse<ProjectImage[]>>(
      `/projects/${projectId}/images`
    )
    return response.data.data || []
  },

  /**
   * Alias for getGalleryImages
   */
  async getImages(projectId: number | string): Promise<ProjectImage[]> {
    return this.getGalleryImages(projectId)
  },

  /**
   * POST /projects/:id/images - POST method to upload/create image in project gallery
   * Payload: FormData or ProjectImageUploadPayload
   */
  async createImage(
    projectId: number | string,
    payload: ProjectImageUploadPayload | FormData
  ): Promise<ProjectImage> {
    let body: FormData
    if (payload instanceof FormData) {
      body = payload
    } else {
      body = new FormData()
      body.append('image', payload.image)
      if (payload.alt_text !== undefined) body.append('alt_text', payload.alt_text)
      if (payload.caption !== undefined) body.append('caption', payload.caption)
      if (payload.is_cover !== undefined) body.append('is_cover', String(payload.is_cover))
      if (payload.is_featured !== undefined) body.append('is_featured', String(payload.is_featured))
      if (payload.is_banner !== undefined) body.append('is_banner', String(payload.is_banner))
    }

    const response = await axiosService.post<ApiResponse<ProjectImage>>(
      `/projects/${projectId}/images`,
      body
    )
    return response.data.data
  },

  /**
   * Alias / helper for createImage
   */
  async uploadImage(
    projectId: number | string,
    file: File,
    meta?: {
      alt_text?: string
      caption?: string
      is_cover?: boolean
      is_featured?: boolean
      is_banner?: boolean
      type?: 'featured' | 'banner' | 'gallery'
    }
  ): Promise<ProjectImage> {
    const formData = new FormData()
    formData.append('image', file)
    if (meta?.alt_text) formData.append('alt_text', meta.alt_text)
    if (meta?.caption) formData.append('caption', meta.caption)
    if (meta?.is_cover !== undefined) formData.append('is_cover', String(meta.is_cover))
    if (meta?.is_featured !== undefined) formData.append('is_featured', String(meta.is_featured))
    if (meta?.is_banner !== undefined) formData.append('is_banner', String(meta.is_banner))

    return this.createImage(projectId, formData)
  },

  /**
   * PATCH /projects/:id/select-images - PATCH method to designate featured and/or banner images
   */
  async selectImages(
    projectId: number | string,
    selections: ProjectImageSelectionPayload
  ): Promise<Project> {
    const response = await axiosService.patch<ApiResponse<Project>>(
      `/projects/${projectId}/select-images`,
      selections
    )
    return response.data.data
  },

  /**
   * PATCH /projects/:id/images/:imageId/cover - PATCH method to set cover image
   */
  async setCoverImage(
    projectId: number | string,
    imageId: number | string
  ): Promise<ProjectImage> {
    const response = await axiosService.patch<ApiResponse<ProjectImage>>(
      `/projects/${projectId}/images/${imageId}/cover`
    )
    return response.data.data
  },

  /**
   * PATCH /projects/:id/images/:imageId/featured - PATCH method to set featured image
   */
  async setFeaturedImage(
    projectId: number | string,
    imageId: number | string
  ): Promise<ProjectImage> {
    const response = await axiosService.patch<ApiResponse<ProjectImage>>(
      `/projects/${projectId}/images/${imageId}/featured`
    )
    return response.data.data
  },

  /**
   * PATCH /projects/:id/images/:imageId/banner - PATCH method to set banner image
   */
  async setBannerImage(
    projectId: number | string,
    imageId: number | string
  ): Promise<ProjectImage> {
    const response = await axiosService.patch<ApiResponse<ProjectImage>>(
      `/projects/${projectId}/images/${imageId}/banner`
    )
    return response.data.data
  },

  /**
   * PATCH /projects/:id/images/:imageId - PATCH method to update image metadata
   */
  async updateImage(
    projectId: number | string,
    imageId: number | string,
    meta: ProjectImageUpdatePayload
  ): Promise<ProjectImage> {
    const response = await axiosService.patch<ApiResponse<ProjectImage>>(
      `/projects/${projectId}/images/${imageId}`,
      meta
    )
    return response.data.data
  },

  /**
   * Alias for updateImage
   */
  async updateImageMeta(
    projectId: number | string,
    imageId: number | string,
    meta: ProjectImageUpdatePayload
  ): Promise<ProjectImage> {
    return this.updateImage(projectId, imageId, meta)
  },

  /**
   * PATCH /projects/:id/images/reorder - PATCH method to reorder gallery images
   */
  async reorderImages(
    projectId: number | string,
    images: Array<{ id: number; sort_order?: number; display_order?: number }>
  ): Promise<{ success: boolean; message: string; data?: ProjectImage[] }> {
    const response = await axiosService.patch<ApiResponse<ProjectImage[]>>(
      `/projects/${projectId}/images/reorder`,
      { images }
    )
    return {
      success: response.data.success,
      message: response.data.message,
      data: response.data.data,
    }
  },

  /**
   * DELETE /projects/:id/images/:imageId - DELETE method to remove image from gallery
   */
  async deleteImage(
    projectId: number | string,
    imageId: number | string
  ): Promise<{ id: number; message: string }> {
    const response = await axiosService.delete<ApiResponse<{ id: number }>>(
      `/projects/${projectId}/images/${imageId}`
    )
    return {
      id: Number(response.data.data?.id || imageId),
      message: response.data.message || 'Image deleted successfully',
    }
  },
}

export default projectService
