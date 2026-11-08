import axiosService from './axios.service'

export interface CategoryPayload {
  name: string
  slug?: string
  description?: string
  status?: boolean
}

export interface Category {
  id: number
  name: string
  slug: string
  description?: string | null
  status?: boolean
  project_count?: number
  projects_count?: number
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface CategoryApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
}

export const categoryService = {
  /**
   * GET /project-categories - Public method to list all categories
   * Tries /project-categories first; seamlessly falls back to /categories if 404
   */
  async getAll(): Promise<Category[]> {
    try {
      const res = await axiosService.get<CategoryApiResponse<Category[]>>(
        '/project-categories'
      )
      return res.data?.data || []
    } catch (err: unknown) {
      const errorObj = err as { status?: number }
      if (errorObj?.status === 404) {
        const res = await axiosService.get<CategoryApiResponse<Category[]>>(
          '/categories'
        )
        return res.data?.data || []
      }
      throw err
    }
  },

  /**
   * GET /project-categories/:id - Public method to retrieve a single category
   * Tries /project-categories/:id first; falls back to /categories/:id if 404
   */
  async getById(id: number | string): Promise<Category> {
    try {
      const res = await axiosService.get<CategoryApiResponse<Category>>(
        `/project-categories/${id}`
      )
      return res.data?.data
    } catch (err: unknown) {
      const errorObj = err as { status?: number }
      if (errorObj?.status === 404) {
        const res = await axiosService.get<CategoryApiResponse<Category>>(
          `/categories/${id}`
        )
        return res.data?.data
      }
      throw err
    }
  },

  /**
   * PUT /project-categories/:id - Edit category (Requires JWT authentication)
   * Tries /project-categories/:id first; falls back to /categories/:id if 404
   */
  async update(
    id: number | string,
    payload: CategoryPayload
  ): Promise<Category> {
    try {
      const res = await axiosService.put<CategoryApiResponse<Category>>(
        `/project-categories/${id}`,
        payload
      )
      return res.data?.data
    } catch (err: unknown) {
      const errorObj = err as { status?: number }
      if (errorObj?.status === 404) {
        const res = await axiosService.put<CategoryApiResponse<Category>>(
          `/categories/${id}`,
          payload
        )
        return res.data?.data
      }
      throw err
    }
  },

  /**
   * POST /categories - Create category (Requires JWT authentication)
   * Payload: { name, slug, description, status }
   */
  async create(payload: CategoryPayload): Promise<Category> {
    try {
      const res = await axiosService.post<CategoryApiResponse<Category>>(
        '/categories',
        payload
      )
      return res.data?.data
    } catch (err: unknown) {
      const errorObj = err as { status?: number }
      if (errorObj?.status === 404) {
        const res = await axiosService.post<CategoryApiResponse<Category>>(
          '/project-categories',
          payload
        )
        return res.data?.data
      }
      throw err
    }
  },

  /**
   * DELETE /categories/:id - Delete category (Requires JWT authentication)
   */
  async delete(id: number | string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await axiosService.delete<CategoryApiResponse<null>>(
        `/categories/${id}`
      )
      return {
        success: res.data?.success ?? true,
        message: res.data?.message ?? 'Category deleted successfully',
      }
    } catch (err: unknown) {
      const errorObj = err as { status?: number }
      if (errorObj?.status === 404) {
        const res = await axiosService.delete<CategoryApiResponse<null>>(
          `/project-categories/${id}`
        )
        return {
          success: res.data?.success ?? true,
          message: res.data?.message ?? 'Category deleted successfully',
        }
      }
      throw err
    }
  },
}

export default categoryService
