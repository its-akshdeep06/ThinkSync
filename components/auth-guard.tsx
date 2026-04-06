'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'

interface AuthGuardProps {
  children: React.ReactNode
  fallbackPath?: string
}

export function AuthGuard({ children, fallbackPath = '/' }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(fallbackPath)
    }
  }, [isLoading, isAuthenticated, router, fallbackPath])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ts-base flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-ts-emerald border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-mono text-[10px] text-ts-text-dim uppercase tracking-wider">
            Authenticating...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return <>{children}</>
}
