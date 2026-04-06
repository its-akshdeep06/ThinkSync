'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'
import { AuthGuard } from '@/components/auth-guard'
import { NavigationHeader } from '@/components/navigation-header'
import { RiskBadge } from '@/components/risk-badge'
import { KnowledgeGraph } from '@/components/knowledge-graph'
import { DynamicBackground } from '@/components/dynamic-background'
import { GitHubIcon, GitHubBranchBadge } from '@/components/github-icon'
import { ConnectRepoModal } from '@/components/connect-repo-modal'
import { api } from '@/lib/api'

interface Repository {
  id: string
  name: string
  full_name: string
  status: 'pending' | 'indexing' | 'ready' | 'error'
  file_count: number
  node_count: number
  indexed_at: string | null
  created_at: string
  github_repo_url: string
}

interface Job {
  id: string
  repo_id: string
  type: string
  status: string
  intent_text: string | null
  pr_url: string | null
  created_at: string
}

const statusColors: Record<string, string> = {
  ready: 'bg-ts-emerald',
  indexing: 'bg-ts-amber',
  error: 'bg-ts-red',
  pending: 'bg-ts-text-ghost',
}

const jobStatusIcons: Record<string, { icon: string; color: string }> = {
  complete: { icon: '✓', color: 'text-ts-emerald' },
  running: { icon: '→', color: 'text-ts-indigo' },
  pending: { icon: '○', color: 'text-ts-text-dim' },
  failed: { icon: '×', color: 'text-ts-red' },
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function DashboardContent() {
  const { user } = useAuth()
  const [repos, setRepos] = useState<Repository[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [isLoadingRepos, setIsLoadingRepos] = useState(true)
  const [showConnectModal, setShowConnectModal] = useState(false)

  const fetchRepos = useCallback(async () => {
    try {
      const { repos: data } = await api.repos.list()
      setRepos(data)
      if (data.length > 0 && !selectedRepo) {
        setSelectedRepo(data[0])
      } else if (selectedRepo) {
        // Refresh selected repo data
        const updated = data.find((r: Repository) => r.id === selectedRepo.id)
        if (updated) setSelectedRepo(updated)
      }
    } catch (err) {
      console.error('Failed to fetch repos:', err)
    } finally {
      setIsLoadingRepos(false)
    }
  }, [selectedRepo])

  const fetchJobs = useCallback(async () => {
    try {
      const { jobs: data } = await api.jobs.list({
        type: 'analyze-intent',
        limit: 10,
        ...(selectedRepo ? { repo_id: selectedRepo.id } : {}),
      })
      setJobs(data)
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
    }
  }, [selectedRepo])

  useEffect(() => {
    fetchRepos()
  }, [])

  useEffect(() => {
    if (selectedRepo) fetchJobs()
  }, [selectedRepo, fetchJobs])

  // Poll for updates when repos are indexing
  useEffect(() => {
    const hasIndexing = repos.some(r => r.status === 'indexing')
    if (!hasIndexing) return
    const interval = setInterval(fetchRepos, 5000)
    return () => clearInterval(interval)
  }, [repos, fetchRepos])

  const handleRepoConnected = () => {
    fetchRepos()
  }

  return (
    <div className="min-h-screen bg-ts-base relative">
      <div className="fixed inset-0 z-0 opacity-30">
        <DynamicBackground />
      </div>

      <NavigationHeader currentPath="~/dashboard" />

      <div className="relative z-10 pt-12 flex h-screen">
        {/* Sidebar - Repository List */}
        <aside className="w-[280px] bg-ts-surface/95 backdrop-blur-sm border-r border-ts-border overflow-y-auto">
          <div className="p-4">
            {/* GitHub Connected Header */}
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-ts-border">
              <div className="p-2 rounded-full bg-ts-elevated border border-ts-border overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                ) : (
                  <GitHubIcon size={16} className="text-ts-text-muted" />
                )}
              </div>
              <div>
                <p className="font-mono text-[11px] text-ts-text-primary">{user?.login || 'GitHub Connected'}</p>
                <p className="font-mono text-[9px] text-ts-emerald flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-ts-emerald rounded-full animate-pulse" />
                  {repos.length} {repos.length === 1 ? 'repository' : 'repositories'} synced
                </p>
              </div>
            </div>

            <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim mb-4">
              Repositories
            </p>

            {isLoadingRepos ? (
              <div className="py-8 text-center">
                <div className="w-5 h-5 border-2 border-ts-emerald border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="font-mono text-[9px] text-ts-text-dim">Loading repos...</p>
              </div>
            ) : repos.length === 0 ? (
              <div className="py-8 text-center">
                <p className="font-mono text-[10px] text-ts-text-dim mb-2">No repositories connected</p>
                <p className="font-mono text-[9px] text-ts-text-ghost">Connect a repo to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {repos.map(repo => (
                  <button
                    key={repo.id}
                    onClick={() => setSelectedRepo(repo)}
                    className={`w-full text-left p-3 rounded border transition-all duration-200 ${
                      selectedRepo?.id === repo.id
                        ? 'bg-ts-elevated border-ts-emerald/50'
                        : 'bg-ts-elevated/30 border-ts-border hover:border-ts-text-ghost hover:bg-ts-elevated/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <GitHubIcon size={14} className="text-ts-text-dim shrink-0" />
                      <span className="font-mono text-[11px] text-ts-text-primary truncate">
                        {repo.name}
                      </span>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${statusColors[repo.status] || 'bg-ts-text-ghost'}`} />
                    </div>
                    <p className="font-mono text-[9px] text-ts-text-ghost mb-2 truncate pl-[22px]">
                      {repo.full_name}
                    </p>
                    <div className="flex items-center gap-3 pl-[22px]">
                      <span className="font-mono text-[8px] text-ts-text-dim">
                        {repo.file_count} files
                      </span>
                      <span className="font-mono text-[8px] text-ts-text-dim">
                        {repo.node_count} nodes
                      </span>
                    </div>
                    <p className="font-mono text-[8px] text-ts-text-ghost mt-1 pl-[22px]">
                      {repo.status === 'indexing' ? (
                        <span className="text-ts-amber flex items-center gap-1">
                          <span className="w-1 h-1 bg-ts-amber rounded-full animate-pulse" />
                          indexing...
                        </span>
                      ) : repo.status === 'error' ? (
                        <span className="text-ts-red">indexing failed</span>
                      ) : repo.indexed_at ? (
                        `indexed ${timeAgo(repo.indexed_at)}`
                      ) : (
                        'pending'
                      )}
                    </p>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowConnectModal(true)}
              className="w-full mt-4 p-3 border border-dashed border-ts-border rounded font-mono text-[10px] text-ts-text-dim hover:text-ts-emerald hover:border-ts-emerald transition-colors flex items-center justify-center gap-2 group"
            >
              <GitHubIcon size={14} className="group-hover:scale-110 transition-transform" />
              Connect Repository
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto bg-ts-base/50 backdrop-blur-sm">
          {selectedRepo ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <GitHubIcon size={20} className="text-ts-text-dim" />
                    <h1 className="font-mono text-[16px] font-medium text-ts-text-primary">
                      {selectedRepo.full_name}
                    </h1>
                    <RiskBadge
                      level={selectedRepo.status === 'ready' ? 'safe' : selectedRepo.status === 'error' ? 'high' : 'review'}
                      percentage={selectedRepo.status === 'ready' ? 12 : selectedRepo.status === 'error' ? 90 : 45}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <GitHubBranchBadge branch="main" />
                    <p className="font-mono text-[10px] text-ts-text-dim">
                      {selectedRepo.file_count} files · {selectedRepo.node_count} nodes
                      {selectedRepo.indexed_at && ` · Indexed ${timeAgo(selectedRepo.indexed_at)}`}
                    </p>
                  </div>
                </div>

                {selectedRepo.status === 'ready' ? (
                  <Link
                    href={`/repo/${selectedRepo.id}/intent`}
                    className="font-mono text-[10px] uppercase tracking-wider text-ts-emerald border border-ts-emerald px-4 py-2 rounded hover:bg-ts-emerald-dim transition-colors"
                  >
                    New Intent
                  </Link>
                ) : selectedRepo.status === 'error' ? (
                  <button
                    onClick={async () => {
                      try {
                        await api.repos.reindex(selectedRepo.id)
                        fetchRepos()
                      } catch (err) {
                        console.error('Reindex failed:', err)
                      }
                    }}
                    className="font-mono text-[10px] uppercase tracking-wider text-ts-amber border border-ts-amber px-4 py-2 rounded hover:bg-ts-amber-dim transition-colors"
                  >
                    Retry Indexing
                  </button>
                ) : (
                  <span className="font-mono text-[10px] text-ts-text-dim flex items-center gap-2">
                    <span className="w-3 h-3 border border-ts-amber border-t-transparent rounded-full animate-spin" />
                    Indexing in progress...
                  </span>
                )}
              </div>

              {/* Mini Knowledge Graph */}
              <div className="mb-8">
                <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim mb-3">
                  Knowledge Graph Preview
                </p>
                <Link
                  href={`/repo/${selectedRepo.id}/graph`}
                  className="block bg-ts-surface border border-ts-border rounded overflow-hidden hover:border-ts-text-ghost transition-colors"
                >
                  <div className="h-[240px] relative">
                    <KnowledgeGraph className="w-full h-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ts-surface to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-3 font-mono text-[9px] text-ts-text-dim">
                      Click to explore full graph →
                    </div>
                  </div>
                </Link>
              </div>

              {/* Recent Intents */}
              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim mb-3">
                  Recent Intents
                </p>
                <div className="bg-ts-surface border border-ts-border rounded">
                  {jobs.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="font-mono text-[10px] text-ts-text-dim">No intents yet</p>
                      <p className="font-mono text-[9px] text-ts-text-ghost mt-1">
                        {selectedRepo.status === 'ready'
                          ? 'Submit an intent to get started'
                          : 'Wait for indexing to complete first'}
                      </p>
                    </div>
                  ) : (
                    jobs.map((job, i) => {
                      const statusIcon = jobStatusIcons[job.status] || jobStatusIcons.pending
                      return (
                        <Link
                          key={job.id}
                          href={
                            job.status === 'complete' && job.pr_url
                              ? `/repo/${selectedRepo.id}/pr/${job.id}`
                              : job.status === 'complete'
                              ? `/repo/${selectedRepo.id}/plan/${job.id}`
                              : '#'
                          }
                          className={`flex items-center gap-3 p-3 hover:bg-ts-elevated transition-colors ${
                            i !== jobs.length - 1 ? 'border-b border-ts-border' : ''
                          }`}
                        >
                          <span className={`font-mono text-[12px] ${statusIcon.color}`}>
                            {statusIcon.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-[10px] text-ts-text-primary truncate">
                              {job.intent_text || 'Repository indexing'}
                            </p>
                          </div>
                          <span className="font-mono text-[9px] text-ts-text-dim">
                            {timeAgo(job.created_at)}
                          </span>
                        </Link>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <GitHubIcon size={32} className="text-ts-text-ghost mx-auto mb-4" />
                <p className="font-mono text-[12px] text-ts-text-dim mb-2">No repository selected</p>
                <p className="font-mono text-[10px] text-ts-text-ghost mb-6">
                  Connect a repo from the sidebar to get started
                </p>
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="font-mono text-[10px] uppercase tracking-wider text-ts-emerald border border-ts-emerald px-4 py-2 rounded hover:bg-ts-emerald-dim transition-colors"
                >
                  Connect Repository
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <ConnectRepoModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onConnected={handleRepoConnected}
      />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}
