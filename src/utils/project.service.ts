import axiosService from './axios.service'

export interface ProjectImage {
  id: number
  project_id: number
  image_url: string
  caption?: string | null
  alt_text?: string | null
  is_cover: boolean
  display_order: number
  created_at: string
}

export interface Project {
  id: number
  title: string
  slug: string
  short_description?: string | null
  description?: string | null
  category: string
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
  technologies: string[]
  images?: ProjectImage[]
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
  technology?: string
  status?: 'draft' | 'published' | 'archived' | ''
  is_featured?: boolean
  featured?: boolean
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface CreateProjectPayload {
  title: string
  slug?: string
  short_description?: string
  description?: string
  category?: string
  client_name?: string
  project_url?: string
  live_url?: string
  repository_url?: string
  github_url?: string
  role?: string
  project_type?: string
  start_date?: string | null
  end_date?: string | null
  is_featured?: boolean
  status?: 'draft' | 'published' | 'archived'
  display_order?: number
  cover_image?: string | null
  meta_title?: string
  meta_description?: string
  canonical_url?: string
  technologies?: string[]
}

export interface UpdateProjectPayload extends Partial<CreateProjectPayload> {}

export interface ProjectStats {
  totalProjects: number
  publishedProjects: number
  draftProjects: number
  archivedProjects: number
  featuredProjects: number
  totalCategories: number
  totalTechnologies: number
  [key: string]: unknown
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  pagination?: PaginationMeta
}

export const projectService = {
  /**
   * GET /projects/admin/all - Fetch all projects with pagination, search, and filters
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
   * GET /projects/admin/:id - Fetch full project details for editing
   */
  async getById(id: number | string): Promise<Project> {
    const response = await axiosService.get<ApiResponse<Project>>(
      `/projects/admin/${id}`
    )
    return response.data.data
  },

  /**
   * POST /projects - Create a new project (JSON or FormData)
   */
  async create(data: CreateProjectPayload | FormData): Promise<Project> {
    const response = await axiosService.post<ApiResponse<Project>>(
      '/projects',
      data
    )
    return response.data.data
  },

  /**
   * PUT /projects/:id - Update an existing project
   */
  async update(
    id: number | string,
    data: UpdateProjectPayload | FormData
  ): Promise<Project> {
    const response = await axiosService.put<ApiResponse<Project>>(
      `/projects/${id}`,
      data
    )
    return response.data.data
  },

  /**
   * DELETE /projects/:id - Delete a project
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
   * PATCH /projects/:id/status - Publish, unpublish, or archive project
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
   * PATCH /projects/:id/featured - Toggle featured status
   */
  async toggleFeatured(
    id: number | string,
    is_featured: boolean
  ): Promise<Project> {
    const response = await axiosService.patch<ApiResponse<Project>>(
      `/projects/${id}/featured`,
      { is_featured }
    )
    return response.data.data
  },

  /**
   * PATCH /projects/reorder - Update project ordering sequence
   */
  async reorder(
    projects: Array<{ id: number; sort_order: number }>
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
   * POST /projects/:id/images - Upload project gallery image
   */
  async uploadImage(
    projectId: number | string,
    file: File,
    meta?: { alt_text?: string; caption?: string }
  ): Promise<ProjectImage> {
    const formData = new FormData()
    formData.append('image', file)
    if (meta?.alt_text) formData.append('alt_text', meta.alt_text)
    if (meta?.caption) formData.append('caption', meta.caption)

    const response = await axiosService.post<ApiResponse<ProjectImage>>(
      `/projects/${projectId}/images`,
      formData
    )
    return response.data.data
  },

  /**
   * GET /projects/:id/images - Fetch gallery images of a project
   */
  async getImages(projectId: number | string): Promise<ProjectImage[]> {
    const response = await axiosService.get<ApiResponse<ProjectImage[]>>(
      `/projects/${projectId}/images`
    )
    return response.data.data || []
  },

  /**
   * PATCH /projects/:id/images/:imageId/cover - Set gallery image as project cover
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
   * PATCH /projects/:id/images/:imageId - Update image metadata
   */
  async updateImageMeta(
    projectId: number | string,
    imageId: number | string,
    meta: { alt_text?: string; caption?: string; display_order?: number }
  ): Promise<ProjectImage> {
    const response = await axiosService.patch<ApiResponse<ProjectImage>>(
      `/projects/${projectId}/images/${imageId}`,
      meta
    )
    return response.data.data
  },

  /**
   * DELETE /projects/:id/images/:imageId - Delete image from project
   */
  async deleteImage(
    projectId: number | string,
    imageId: number | string
  ): Promise<{ id: number }> {
    const response = await axiosService.delete<ApiResponse<{ id: number }>>(
      `/projects/${projectId}/images/${imageId}`
    )
    return { id: Number(response.data.data?.id || imageId) }
  },

  /**
   * GET /projects/categories - Fetch distinct categories
   */
  async getCategories(): Promise<string[]> {
    const response = await axiosService.get<ApiResponse<string[]>>(
      '/projects/categories'
    )
    return response.data.data || []
  },

  /**
   * GET /projects/technologies - Fetch distinct technologies
   */
  async getTechnologies(): Promise<string[]> {
    const response = await axiosService.get<ApiResponse<string[]>>(
      '/projects/technologies'
    )
    return response.data.data || []
  },

  /**
   * GET /projects/admin/stats - Fetch admin project statistics
   */
  async getStats(): Promise<ProjectStats> {
    const response = await axiosService.get<ApiResponse<ProjectStats>>(
      '/projects/admin/stats'
    )
    return response.data.data
  },
}

export default projectService