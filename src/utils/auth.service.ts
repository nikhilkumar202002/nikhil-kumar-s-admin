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

export interface User {
  id: number
  name: string
  email: string
  role: string
  is_super_admin: boolean
  is_active: boolean
  last_login_at?: string
  created_at?: string
  updated_at?: string
  custom_permissions?: string[]
  effective_permissions: string[]
  avatar?: string
  [key: string]: unknown
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

const USER_STORAGE_KEY = 'portfolio_admin_user'

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
        'Authentication succeeded but no JWT token was received from server.'
      )
    }

    // Persist JWT token
    setAuthToken(token)

    // If login response includes user object, cache it
    const user = (data.user || data.data?.user) as User | undefined
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    }

    return {
      token,
      user,
      raw: data,
    }
  },

  /**
   * GET /users/me - Fetch currently authenticated user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await axiosService.get<ApiResponse<User>>('/users/me')
    const user = response.data.data

    if (user && typeof user === 'object') {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    }

    return user
  },

  /**
   * Log out user, remove JWT and cached profile
   */
  logout(): void {
    clearAuthToken()
    localStorage.removeItem(USER_STORAGE_KEY)
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
    if (user.is_super_admin) return true
    return user.effective_permissions?.includes(permission) ?? false
  },

  /**
   * Check if current user is super admin
   */
  isSuperAdmin(): boolean {
    const user = this.getStoredUser()
    return Boolean(user?.is_super_admin || user?.role === 'super_admin')
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