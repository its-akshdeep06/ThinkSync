'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { api, getToken, getUser, setToken, setUser, clearToken } from '@/lib/api'

interface User {
  id: string
  login: string
  avatar_url: string
  github_id?: number
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const token = getToken()
      if (!token) {
        setUserState(null)
        setIsLoading(false)
        return
      }

      const { user: userData } = await api.auth.me()
      setUserState(userData)
      setUser(userData)
    } catch {
      clearToken()
      setUserState(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Try cached user first for instant display
    const cached = getUser()
    if (cached && getToken()) {
      setUserState(cached)
    }
    refreshUser()
  }, [refreshUser])

  const login = useCallback(async () => {
    try {
      const { url } = await api.auth.getGitHubUrl()
      window.location.href = url
    } catch (err) {
      console.error('Login error:', err)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.auth.logout()
    } catch {
      // ignore
    } finally {
      clearToken()
      setUserState(null)
      window.location.href = '/'
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
