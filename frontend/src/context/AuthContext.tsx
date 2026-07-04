import React, { createContext, useCallback, useEffect, useReducer, type ReactNode } from 'react'
import { authApi } from '@/api/auth'
import type { UserProfile, UserRole } from '@/types'

interface AuthState {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
}

type AuthAction =
  | { type: 'SIGN_IN'; payload: UserProfile }
  | { type: 'SIGN_OUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESTORE'; payload: UserProfile }

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SIGN_IN':
    case 'RESTORE':
      return { user: action.payload, isAuthenticated: true, isLoading: false }
    case 'SIGN_OUT':
      return { user: null, isAuthenticated: false, isLoading: false }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    default:
      return state
  }
}

interface AuthContextValue extends AuthState {
  role: UserRole | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // ── Restore session on mount ──────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('hr_nexus:access_token')
    const userStr = localStorage.getItem('hr_nexus:user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as UserProfile
        dispatch({ type: 'RESTORE', payload: user })
      } catch {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const { user, tokens } = await authApi.login({ email, password })
      localStorage.setItem('hr_nexus:access_token', tokens.access_token)
      localStorage.setItem('hr_nexus:refresh_token', tokens.refresh_token)
      localStorage.setItem('hr_nexus:user', JSON.stringify(user))
      dispatch({ type: 'SIGN_IN', payload: user })
    } catch (err) {
      dispatch({ type: 'SET_LOADING', payload: false })
      throw err
    }
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem('hr_nexus:access_token')
    localStorage.removeItem('hr_nexus:refresh_token')
    localStorage.removeItem('hr_nexus:user')
    dispatch({ type: 'SIGN_OUT' })
  }, [])

  const value: AuthContextValue = {
    ...state,
    role: state.user?.role ?? null,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
