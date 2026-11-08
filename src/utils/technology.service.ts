import axiosService from './axios.service'

export interface Technology {
  id: number
  name: string
  slug: string
  project_count?: number
  projects_count?: number
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface TechnologyApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
}

export const technologyService = {
  /**
   * GET /technologies - Fetch all technologies
   */
  async getAll(): Promise<Technology[]> {
    const res = await axiosService.get<TechnologyApiResponse<Technology[]>>('/technologies')
    return res.data?.data || []
  },

  /**
   * GET /technologies/:id - Fetch single technology
   */
  async getById(id: number | string): Promise<Technology> {
    const res = await axiosService.get<TechnologyApiResponse<Technology>>(`/technologies/${id}`)
    return res.data?.data
  },

  /**
   * POST /technologies - Create new technology
   */
  async create(payload: { name: string; slug?: string }): Promise<Technology> {
    const res = await axiosService.post<TechnologyApiResponse<Technology>>('/technologies', payload)
    return res.data?.data
  },

  /**
   * PUT /technologies/:id - Edit technology
   */
  async update(id: number | string, payload: { name: string; slug?: string }): Promise<Technology> {
    const res = await axiosService.put<TechnologyApiResponse<Technology>>(`/technologies/${id}`, payload)
    return res.data?.data
  },

  /**
   * DELETE /technologies/:id - Delete technology
   */
  async delete(id: number | string): Promise<{ success: boolean; message: string }> {
    const res = await axiosService.delete<TechnologyApiResponse<null>>(`/technologies/${id}`)
    return {
      success: res.data?.success ?? true,
      message: res.data?.message ?? 'Technology deleted successfully',
    }
  },
}

export default technologyService
