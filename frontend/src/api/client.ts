import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const BASE_URL = '/api/v1'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ─── Request interceptor: attach token ───────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('hr_nexus:access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor: unwrap envelope + handle 401 ──────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('hr_nexus:refresh_token')
      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken })
          const { access_token } = res.data.data ?? res.data
          localStorage.setItem('hr_nexus:access_token', access_token)
          if (error.config) {
            error.config.headers.Authorization = `Bearer ${access_token}`
            return apiClient.request(error.config)
          }
        } catch {
          // Refresh failed — clear session
          localStorage.removeItem('hr_nexus:access_token')
          localStorage.removeItem('hr_nexus:refresh_token')
          localStorage.removeItem('hr_nexus:user')
          window.location.href = '/sign-in'
        }
      } else {
        localStorage.removeItem('hr_nexus:access_token')
        localStorage.removeItem('hr_nexus:user')
        window.location.href = '/sign-in'
      }
    }
    return Promise.reject(error)
  }
)

/** Unwrap the backend `{ success, data, message }` envelope */
export function unwrap<T>(response: { data: { data?: T; [k: string]: unknown } }): T {
  return (response.data as { data?: T }).data as T ?? response.data as T
}

export default apiClient
