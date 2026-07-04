import apiClient, { unwrap } from './client'
import type { LoginRequest, TokenResponse, UserProfile } from '@/types'

interface LoginResponse {
  user: UserProfile
  tokens: TokenResponse
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const res = await apiClient.post('/auth/login', credentials)
    const data = unwrap<{ user: UserProfile; tokens: TokenResponse } | TokenResponse>(res)
    // Backend may return { access_token, ... } directly or nested
    if ('access_token' in data) {
      const tokens = data as TokenResponse
      // Fetch user profile separately
      localStorage.setItem('hr_nexus:access_token', tokens.access_token)
      localStorage.setItem('hr_nexus:refresh_token', tokens.refresh_token)
      const profileRes = await apiClient.get('/auth/me')
      const user = unwrap<UserProfile>(profileRes)
      return { user, tokens }
    }
    return data as LoginResponse
  },

  async getProfile(): Promise<UserProfile> {
    const res = await apiClient.get('/auth/me')
    return unwrap<UserProfile>(res)
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
  },

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const res = await apiClient.post('/auth/refresh', { refresh_token: refreshToken })
    return unwrap<TokenResponse>(res)
  },
}
