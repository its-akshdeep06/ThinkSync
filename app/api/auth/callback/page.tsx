'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api, setToken, setUser } from '@/lib/api'
import { DynamicBackground } from '@/components/dynamic-background'
import { Suspense } from 'react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('Connecting to GitHub...')

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setError('No authorization code received from GitHub')
      return
    }

    async function handleCallback() {
      try {
        setStatus('Exchanging authorization code...')
        const { token, user } = await api.auth.callback(code!)

        setStatus('Storing credentials...')
        setToken(token)
        setUser(user)

        setStatus('Redirecting to dashboard...')
        // Short delay so user sees the success state
        setTimeout(() => {
          router.push('/dashboard')
        }, 500)
      } catch (err: any) {
        console.error('OAuth callback error:', err)
        setError(err.message || 'Authentication failed. Please try again.')
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-ts-base relative flex items-center justify-center">
      <div className="fixed inset-0 z-0 opacity-30">
        <DynamicBackground />
      </div>

      <div className="relative z-10 text-center">
        {error ? (
          <>
            <div className="w-12 h-12 rounded-full border-2 border-ts-red flex items-center justify-center mx-auto mb-6">
              <span className="text-ts-red text-[20px]">×</span>
            </div>
            <p className="font-mono text-[12px] text-ts-red mb-2">Authentication Failed</p>
            <p className="font-mono text-[10px] text-ts-text-dim mb-8 max-w-md">{error}</p>
            <a
              href="/"
              className="font-mono text-[10px] uppercase tracking-wider text-ts-emerald border border-ts-emerald px-4 py-2 rounded hover:bg-ts-emerald-dim transition-colors"
            >
              Back to Home
            </a>
          </>
        ) : (
          <>
            <div className="w-8 h-8 border-2 border-ts-emerald border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <p className="font-mono text-[11px] text-ts-text-primary mb-2">{status}</p>
            <p className="font-mono text-[9px] text-ts-text-dim">
              Please wait while we set up your account...
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ts-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ts-emerald border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
