import axiosService, {
  setAuthToken,
  clearAuthToken,
  isAuthenticated,
  getAuthToken,
} from './axios.service'

export interface LoginCredentials {
  email: string
  password: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface ChangePasswordResponse {
  success?: boolean
  message?: string
  data?: unknown
  [key: string]: unknown
}

export interface User {
  id: number
  name: string
  email: string
  is_active: boolean
  last_login_at?: string
  created_at?: string
  updated_at?: string
  role?: string
  is_super_admin?: boolean
  custom_permissions?: string[]
  effective_permissions?: string[]
  avatar?: string
  [key: string]: unknown
}

export interface ProfileApiResponse {
  success: boolean
  message: string
  data: User
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
}

export interface AuthLoginResponse {
  success?: boolean
  message?: string
  token?: string
  accessToken?: string
  user?: User
  data?: {
    token?: string
    accessToken?: string
    user?: User
    [key: string]: unknown
  }
  [key: string]: unknown
}

export const USER_UPDATED_EVENT = 'portfolio_admin_user_updated'
const USER_STORAGE_KEY = 'portfolio_admin_user'
let currentUserPromise: Promise<User> | null = null

export const authService = {
  /**
   * POST /auth/login - Authenticate with email & password using JWT
   */
  async login(
    credentials: LoginCredentials
  ): Promise<{ token: string; user?: User; raw: AuthLoginResponse }> {
    const response = await axiosService.post<AuthLoginResponse>(
      '/auth/login',
      credentials
    )
    const data = response.data

    // Handle token from different response patterns
    const token =
      data.token ||
      data.accessToken ||
      data.data?.token ||
      data.data?.accessToken

    if (!token) {
      throw new Error(
        data.message ||
        'Authentication succeeded but no JWT token was received from server.'
      )
    }

    // Persist JWT token
    setAuthToken(token)

    // Extract user from login response (data.user or data.data.user)
    const user = (data.data?.user || data.user) as User | undefined
    if (user && typeof user === 'object' && user.id) {
      if (!user.role) user.role = 'Super Admin'
      if (user.is_super_admin === undefined) user.is_super_admin = true
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(USER_UPDATED_EVENT, { detail: user })
        )
      }
    }

    return {
      token,
      user,
      raw: data,
    }
  },

  /**
   * GET /auth/me - Fetch currently authenticated user profile
   * Handles: { success: true, message: "...", data: { id, name, email, ... } }
   */
  async getCurrentUser(forceRefresh = false): Promise<User> {
    if (!forceRefresh && currentUserPromise) {
      return currentUserPromise
    }

    currentUserPromise = (async () => {
      try {
        const response = await axiosService.get<ProfileApiResponse>('/auth/me')
        const body = response.data

        // Extract user object from { success: true, message: "...", data: User }
        const user: User = body?.data ?? (body as unknown as User)

        if (user && typeof user === 'object' && user.id) {
          // Normalize default role if not provided by backend
          if (!user.role) {
            user.role = 'Super Admin'
          }
          if (user.is_super_admin === undefined) {
            user.is_super_admin = true
          }

          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))

          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent(USER_UPDATED_EVENT, { detail: user })
            )
          }
        }

        return user
      } finally {
        currentUserPromise = null
      }
    })()

    return currentUserPromise
  },

  /**
   * PATCH /auth/password - Change/edit password with currentPassword and newPassword
   */
  async changePassword(
    payload: ChangePasswordPayload
  ): Promise<ChangePasswordResponse> {
    const response = await axiosService.patch<ChangePasswordResponse>(
      '/auth/password',
      payload
    )
    return response.data
  },

  /**
   * Alias for changePassword
   */
  async updatePassword(
    payload: ChangePasswordPayload
  ): Promise<ChangePasswordResponse> {
    return this.changePassword(payload)
  },

  /**
   * Log out user, remove JWT and cached profile
   */
  logout(): void {
    clearAuthToken()
    localStorage.removeItem(USER_STORAGE_KEY)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(USER_UPDATED_EVENT, { detail: null })
      )
    }
  },

  /**
   * Retrieve cached user from localStorage
   */
  getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY)
      return stored ? (JSON.parse(stored) as User) : null
    } catch {
      return null
    }
  },

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    const user = this.getStoredUser()
    if (!user) return false
    if (user.is_super_admin ?? true) return true
    return user.effective_permissions?.includes(permission) ?? true
  },

  /**
   * Check if current user is super admin
   */
  isSuperAdmin(): boolean {
    const user = this.getStoredUser()
    return Boolean(user?.is_super_admin ?? (user?.role === 'super_admin' || true))
  },

  /**
   * Check if current user is authenticated
   */
  isAuthenticated(): boolean {
    return isAuthenticated()
  },

  /**
   * Get raw token string
   */
  getToken(): string | null {
    return getAuthToken()
  },
}

export default authService