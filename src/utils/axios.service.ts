import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from 'axios'

// Node.js Backend API Base URL (Default to http://localhost:5000/api/v1 as requested)
export const BASE_API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000/api/v1'

const TOKEN_KEY = 'portfolio_admin_token'

// JWT Helper Utilities
export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const clearAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
}

export const isAuthenticated = (): boolean => {
  const token = getAuthToken()
  if (!token) return false

  try {
    const payloadBase64 = token.split('.')[1]
    if (!payloadBase64) return true
    const decoded = JSON.parse(atob(payloadBase64))
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      clearAuthToken()
      return false
    }
    return true
  } catch {
    return true
  }
}

// Axios Instance Configuration for Node.js API
const axiosService: AxiosInstance = axios.create({
  baseURL: BASE_API_URL,
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request Interceptor: Attach JWT Bearer Token & Auto-handle FormData boundary
axiosService.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // When sending FormData, let browser/axios set boundary automatically
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type']
    }

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response Interceptor: Handle JWT Expiration, Port Fallback & Error Messages
axiosService.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (
    error: AxiosError<{
      message?: string | string[]
      error?: string
      errors?: Array<{ field?: string; message: string }>
      statusCode?: number
    }>
  ) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _fallbackAttempted?: boolean })
      | undefined

    const status = error.response?.status
    const errorData = error.response?.data

    // Seamless Fallback: if port 5000 is blocked by macOS AirTunes (empty 403) or network down, retry on 3000 (or vice-versa)
    const isNetworkOrPortBlocked =
      error.code === 'ERR_NETWORK' ||
      error.message?.includes('Network Error') ||
      (status === 403 && (!errorData || Object.keys(errorData).length === 0))

    if (
      isNetworkOrPortBlocked &&
      originalRequest &&
      !originalRequest._fallbackAttempted
    ) {
      originalRequest._fallbackAttempted = true
      const currentUrl = originalRequest.baseURL || BASE_API_URL
      if (currentUrl.includes(':5000')) {
        originalRequest.baseURL = currentUrl.replace(':5000', ':3000')
        return axiosService(originalRequest)
      } else if (currentUrl.includes(':3000')) {
        originalRequest.baseURL = currentUrl.replace(':3000', ':5000')
        return axiosService(originalRequest)
      }
    }

    // Extract standardized message from Node.js (Express / NestJS) response
    let extractedMessage = 'An unexpected error occurred. Please try again.'
    if (errorData?.message) {
      extractedMessage = Array.isArray(errorData.message)
        ? errorData.message.join(', ')
        : errorData.message
    } else if (errorData?.errors && Array.isArray(errorData.errors)) {
      extractedMessage = errorData.errors.map((e) => e.message).join(', ')
    } else if (errorData?.error) {
      extractedMessage = errorData.error
    } else if (error.message) {
      extractedMessage = error.message
    }

    // Handle 401 Unauthorized (JWT Expired or Invalid Token)
    if (status === 401) {
      clearAuthToken()
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login')
      ) {
        window.location.reload()
      }
    }

    return Promise.reject({
      status,
      message: extractedMessage,
      data: errorData,
      originalError: error,
    })
  }
)

export default axiosService