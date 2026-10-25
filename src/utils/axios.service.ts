import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from 'axios'

// Node.js Backend API Base URL
export const BASE_API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

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
    // Basic JWT expiry check from payload (base64)
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
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request Interceptor: Attach JWT Bearer Token
axiosService.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response Interceptor: Handle JWT Expiration & Backend Error Messages
axiosService.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError<{ message?: string | string[]; error?: string; statusCode?: number }>) => {
    const status = error.response?.status
    const errorData = error.response?.data

    // Extract standardized message from Node.js (Express / NestJS) response
    let extractedMessage = 'An unexpected error occurred. Please try again.'
    if (errorData?.message) {
      extractedMessage = Array.isArray(errorData.message)
        ? errorData.message.join(', ')
        : errorData.message
    } else if (errorData?.error) {
      extractedMessage = errorData.error
    } else if (error.message) {
      extractedMessage = error.message
    }

    // Handle 401 Unauthorized (JWT Expired, Invalid Signature, or Missing Token)
    if (status === 401) {
      clearAuthToken()

      // Redirect to login if in browser and not already on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login'
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