'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'
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

const dashboardFeatureCards = [
  { title: 'Intent Console', desc: 'Describe a change in plain English and generate a plan instantly.' },
  { title: 'Graph Explorer', desc: 'Inspect files and dependencies before touching any code.' },
  { title: 'Risk Insights', desc: 'See direct and transitive impact before opening a PR.' },
]

const recentActivityFeed = [
  { label: 'Workspace initialized', detail: 'ThinkSync environment ready', status: 'complete' },
  { label: 'GitHub auth active', detail: 'Session connected successfully', status: 'complete' },
  { label: 'Awaiting first repository', detail: 'Connect a repo to start indexing', status: 'pending' },
]

function DashboardContent() {
  const { user, isBackendOffline } = useAuth()
  const [repos, setRepos] = useState<Repository[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [isLoadingRepos, setIsLoadingRepos] = useState(true)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [backendError, setBackendError] = useState<string | null>(null)

  const fetchRepos = useCallback(async () => {
    try {
      setBackendError(null)
      const { repos: data } = await api.repos.list()
      setRepos(data)
      if (data.length > 0 && !selectedRepo) {
        setSelectedRepo(data[0])
      } else if (selectedRepo) {
        // Refresh selected repo data
        const updated = data.find((r: Repository) => r.id === selectedRepo.id)
        if (updated) setSelectedRepo(updated)
      }
    } catch (err: any) {
      console.error('Failed to fetch repos:', err)
      if (err?.isNetworkError) {
        setBackendError('Cannot connect to the backend server. Make sure it is running on port 4000.')
      } else {
        setBackendError(err?.message || 'Failed to load repositories')
      }
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
    const hasIndexing = repos.some(r => r.status === 'indexing' || r.status === 'pending')
    if (!hasIndexing) return
    const interval = setInterval(fetchRepos, 5000)
    return () => clearInterval(interval)
  }, [repos, fetchRepos])

  const handleRepoConnected = () => {
    fetchRepos()
  }

  // Show error state when backend is offline
  if (backendError || isBackendOffline) {
    return (
      <div className="min-h-screen bg-ts-base relative">
        <div className="fixed inset-0 z-0 opacity-30">
          <DynamicBackground />
        </div>

        <NavigationHeader currentPath="~/dashboard" />

        <div className="relative z-10 pt-12 flex items-center justify-center min-h-[calc(100vh-48px)]">
          <div className="max-w-md w-full mx-4">
            <div className="bg-ts-surface border border-ts-red/30 rounded-lg p-8 text-center">
              {/* Error Icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-ts-red/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-ts-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>

              <h2 className="font-mono text-[14px] font-medium text-ts-text-primary mb-2">
                Backend Offline
              </h2>
              <p className="font-mono text-[10px] text-ts-text-muted mb-2 leading-relaxed">
                {backendError || 'Cannot connect to the ThinkSync API server.'}
              </p>
              <p className="font-mono text-[9px] text-ts-text-ghost mb-8">
                Run <code className="px-1.5 py-0.5 bg-ts-elevated border border-ts-border rounded text-ts-emerald">cd backend && npm run dev</code> to start it
              </p>

              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => {
                    setIsLoadingRepos(true)
                    setBackendError(null)
                    fetchRepos()
                  }}
                  className="font-mono text-[10px] uppercase tracking-wider text-ts-emerald border border-ts-emerald px-6 py-2.5 rounded hover:bg-ts-emerald-dim transition-colors flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                  Retry Connection
                </button>

                <Link
                  href="/"
                  className="font-mono text-[9px] text-ts-text-dim hover:text-ts-text-muted transition-colors"
                >
                  ← Back to Home
                </Link>
              </div>

              {/* Status indicator */}
              <div className="mt-8 pt-4 border-t border-ts-border">
                <div className="flex items-center justify-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ts-red opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-ts-red"></span>
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-wider text-ts-red">
                    api disconnected
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
            <div className="h-full grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
              <div className="bg-ts-surface border border-ts-border rounded p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <GitHubIcon size={18} className="text-ts-text-dim" />
                    <p className="font-mono text-[11px] uppercase tracking-wider text-ts-text-dim">Quick Start</p>
                  </div>
                  <h2 className="font-mono text-[18px] text-ts-text-primary mb-2">
                    Connect your first repository
                  </h2>
                  <p className="font-mono text-[10px] text-ts-text-muted leading-relaxed max-w-xl">
                    Bring in a GitHub repository to unlock graph view, intent analysis, and PR generation.
                    Once connected, ThinkSync will index files and show live progress here.
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={() => setShowConnectModal(true)}
                    className="font-mono text-[10px] uppercase tracking-wider text-ts-emerald border border-ts-emerald px-4 py-2 rounded hover:bg-ts-emerald-dim transition-colors"
                  >
                    Connect Repository
                  </button>
                  <span className="font-mono text-[9px] text-ts-text-ghost">
                    {repos.length} connected
                  </span>
                </div>
              </div>

              <div className="bg-ts-surface border border-ts-border rounded p-6">
                <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim mb-4">
                  What you can do
                </p>
                <div className="space-y-3">
                  {dashboardFeatureCards.map((card) => (
                    <div key={card.title} className="p-3 bg-ts-elevated/40 border border-ts-border rounded">
                      <p className="font-mono text-[11px] text-ts-text-primary mb-1">{card.title}</p>
                      <p className="font-mono text-[9px] text-ts-text-muted leading-relaxed">{card.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 bg-ts-surface border border-ts-border rounded p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim">Onboarding Progress</p>
                  <span className="font-mono text-[9px] text-ts-text-ghost">Step 1 of 3</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { title: 'Connect Repo', done: repos.length > 0 },
                    { title: 'Wait for Indexing', done: repos.some(r => r.status === 'ready') },
                    { title: 'Submit Intent', done: jobs.length > 0 },
                  ].map((step) => (
                    <div key={step.title} className="p-3 border border-ts-border rounded bg-ts-elevated/30">
                      <p className="font-mono text-[10px] text-ts-text-primary flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${step.done ? 'bg-ts-emerald' : 'bg-ts-text-ghost'}`} />
                        {step.title}
                      </p>
                      <p className="font-mono text-[8px] text-ts-text-dim mt-1">
                        {step.done ? 'Completed' : 'Pending'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 bg-ts-surface border border-ts-border rounded p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim">Recent Activity</p>
                  <span className="font-mono text-[8px] text-ts-text-ghost">Live feed</span>
                </div>
                <div className="space-y-2">
                  {recentActivityFeed.map((item, idx) => (
                    <div key={`${item.label}-${idx}`} className="p-3 border border-ts-border rounded bg-ts-elevated/30 flex items-start gap-3">
                      <span className={`mt-1 w-2 h-2 rounded-full ${item.status === 'complete' ? 'bg-ts-emerald' : 'bg-ts-amber animate-pulse'}`} />
                      <div>
                        <p className="font-mono text-[10px] text-ts-text-primary">{item.label}</p>
                        <p className="font-mono text-[8px] text-ts-text-dim mt-0.5">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
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

function ComingSoonPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen bg-ts-base relative overflow-hidden">
      <div className="fixed inset-0 z-0 opacity-20">
        <DynamicBackground />
      </div>

      {/* Navigation back */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-ts-border/50">
        <Link href="/" className="font-mono text-[11px] text-ts-text-muted hover:text-ts-text-primary transition-colors">
          ← Back to Home
        </Link>
        <span className="font-mono text-[10px] text-ts-text-ghost">
          <span className="text-ts-indigo">//</span> ThinkSync
        </span>
      </nav>

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-57px)] px-4">
        <div className="max-w-lg w-full text-center">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-ts-surface/80 backdrop-blur-sm border border-ts-border rounded-full mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ts-amber opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-ts-amber"></span>
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-ts-amber">
              In Development
            </span>
          </div>

          {/* Main heading */}
          <h1 className="font-mono text-[32px] md:text-[42px] font-medium text-ts-text-primary mb-4 tracking-tight">
            Dashboard
            <br />
            <span className="text-ts-emerald">Coming Soon</span>
          </h1>

          <p className="font-sans text-[13px] text-ts-text-muted leading-relaxed max-w-md mx-auto mb-10">
            We&apos;re building a powerful dashboard where you&apos;ll connect repos, 
            visualize your knowledge graph, and ship intent-driven changes — all from one place.
          </p>

          {/* Feature preview cards */}
          <div className="grid grid-cols-3 gap-3 mb-10">
            {[
              { icon: '◈', label: 'Repo Sync', desc: 'Connect GitHub' },
              { icon: '◇', label: 'Graph View', desc: 'Map your code' },
              { icon: '→', label: 'Intents', desc: 'Describe changes' },
            ].map((f) => (
              <div key={f.label} className="p-3 bg-ts-surface/60 border border-ts-border rounded text-center">
                <span className="font-mono text-[16px] text-ts-emerald block mb-1">{f.icon}</span>
                <p className="font-mono text-[9px] text-ts-text-primary uppercase tracking-wider">{f.label}</p>
                <p className="font-sans text-[8px] text-ts-text-dim mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Waitlist / CTA */}
          {submitted ? (
            <div className="p-4 bg-ts-emerald-dim border border-ts-emerald/30 rounded">
              <span className="font-mono text-ts-emerald text-[14px]">✓</span>
              <p className="font-mono text-[11px] text-ts-emerald mt-1">You&apos;re on the list!</p>
              <p className="font-sans text-[10px] text-ts-text-muted mt-1">
                We&apos;ll notify you when the dashboard is ready.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleWaitlist} className="flex gap-2 max-w-sm mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  className="flex-1 px-4 py-2.5 bg-ts-surface border border-ts-border rounded font-mono text-[11px] text-ts-text-primary placeholder:text-ts-text-ghost focus:outline-none focus:border-ts-emerald/50 transition-colors"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-ts-emerald text-ts-base font-mono text-[10px] uppercase tracking-wider rounded hover:bg-ts-emerald/90 transition-colors whitespace-nowrap"
                >
                  Join Waitlist
                </button>
              </form>

              <div className="flex items-center gap-3 justify-center">
                <div className="h-[1px] w-8 bg-ts-border" />
                <span className="font-mono text-[9px] text-ts-text-ghost uppercase">or</span>
                <div className="h-[1px] w-8 bg-ts-border" />
              </div>

              <button
                onClick={login}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-ts-border rounded font-mono text-[10px] uppercase tracking-wider text-ts-text-muted hover:text-ts-emerald hover:border-ts-emerald/50 transition-all"
              >
                <GitHubIcon size={14} />
                Connect with GitHub
              </button>
            </div>
          )}

          {/* Footer note */}
          <p className="mt-10 font-mono text-[8px] text-ts-text-ghost">
            Early access users will be first to try new features.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth()

  // GitHub OAuth redirects here with ?code=... (because /dashboard is the registered callback URL).
  // Forward to the dedicated callback page which exchanges the code for a token.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      window.location.replace(`/api/auth/callback?code=${encodeURIComponent(code)}`)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ts-base flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-ts-emerald border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-mono text-[10px] text-ts-text-dim uppercase tracking-wider">
            Loading...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <ComingSoonPage />
  }

  return <DashboardContent />
}
