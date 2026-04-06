'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { GitHubIcon } from '@/components/github-icon'

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  html_url: string
  clone_url: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  updated_at: string
  private: boolean
  connected: boolean
}

interface ConnectRepoModalProps {
  isOpen: boolean
  onClose: () => void
  onConnected: () => void
}

export function ConnectRepoModal({ isOpen, onClose, onConnected }: ConnectRepoModalProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [connecting, setConnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchRepos = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { repos: ghRepos } = await api.repos.listGitHub()
      setRepos(ghRepos)
    } catch (err: any) {
      if (err?.isNetworkError) {
        setError('Backend server is not running. Start it with: cd backend && npm run dev')
      } else {
        setError(err.message || 'Failed to load repositories')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchRepos()
    }
  }, [isOpen, fetchRepos])

  const handleConnect = async (repo: GitHubRepo) => {
    setConnecting(repo.full_name)
    setError(null)
    try {
      await api.repos.connect(repo.html_url)
      onConnected()
      onClose()
    } catch (err: any) {
      if (err?.isNetworkError) {
        setError('Backend server is offline. Cannot connect repository right now.')
      } else if (err.message.includes('already connected')) {
        setError(`${repo.name} is already connected`)
      } else {
        setError(err.message || 'Failed to connect repository')
      }
    } finally {
      setConnecting(null)
    }
  }

  const filtered = repos.filter(r =>
    r.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(search.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-ts-surface border border-ts-border rounded-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-ts-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitHubIcon size={18} className="text-ts-text-muted" />
            <h2 className="font-mono text-[13px] font-medium text-ts-text-primary">
              Connect Repository
            </h2>
          </div>
          <button onClick={onClose} className="text-ts-text-dim hover:text-ts-text-muted transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-ts-border">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search repositories..."
            className="w-full bg-ts-elevated border border-ts-border rounded px-3 py-2 font-mono text-[11px] text-ts-text-primary placeholder:text-ts-text-ghost focus:outline-none focus:border-ts-emerald/50 transition-colors"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mx-3 mt-3 p-2 bg-ts-red-dim border border-ts-red/30 rounded">
            <p className="font-mono text-[10px] text-ts-red">{error}</p>
          </div>
        )}

        {/* Repo List */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-ts-emerald border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="font-mono text-[10px] text-ts-text-dim">Loading your repositories...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-mono text-[10px] text-ts-text-dim">
                {search ? 'No repositories match your search' : 'No repositories found'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-ts-border">
              {filtered.map(repo => (
                <div
                  key={repo.id}
                  className="p-3 hover:bg-ts-elevated/50 transition-colors flex items-center gap-3"
                >
                  <GitHubIcon size={16} className="text-ts-text-dim shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-[11px] text-ts-text-primary truncate">
                        {repo.full_name}
                      </p>
                      {repo.private && (
                        <span className="px-1 py-0.5 bg-ts-elevated border border-ts-border rounded font-mono text-[7px] text-ts-text-dim uppercase shrink-0">
                          private
                        </span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="font-mono text-[9px] text-ts-text-ghost truncate mt-0.5">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      {repo.language && (
                        <span className="font-mono text-[8px] text-ts-text-dim flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-ts-indigo" />
                          {repo.language}
                        </span>
                      )}
                      <span className="font-mono text-[8px] text-ts-text-dim">
                        ★ {repo.stargazers_count}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConnect(repo)}
                    disabled={repo.connected || connecting === repo.full_name}
                    className={`shrink-0 font-mono text-[9px] uppercase tracking-wider px-3 py-1.5 rounded border transition-all ${
                      repo.connected
                        ? 'text-ts-text-ghost border-ts-border cursor-default'
                        : connecting === repo.full_name
                        ? 'text-ts-emerald border-ts-emerald bg-ts-emerald-dim'
                        : 'text-ts-emerald border-ts-emerald hover:bg-ts-emerald-dim'
                    }`}
                  >
                    {repo.connected
                      ? 'Connected'
                      : connecting === repo.full_name
                      ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 border border-ts-emerald border-t-transparent rounded-full animate-spin" />
                          Connecting
                        </span>
                      )
                      : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-ts-border bg-ts-elevated/30">
          <p className="font-mono text-[8px] text-ts-text-ghost text-center">
            {repos.length} repositories found · {repos.filter(r => r.connected).length} connected
          </p>
        </div>
      </div>
    </div>
  )
}
