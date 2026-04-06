'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { NavigationHeader } from '@/components/navigation-header'
import { TerminalInput } from '@/components/terminal-input'
import { StatusLog, type LogEntry } from '@/components/status-log'
import { ImpactRadius } from '@/components/impact-radius'
import { DynamicBackground } from '@/components/dynamic-background'
import { GitHubIcon, GitHubBranchBadge } from '@/components/github-icon'
import { api } from '@/lib/api'

const formatTime = () => {
  const now = new Date()
  return now.toTimeString().slice(0, 8)
}

function IntentContent() {
  const router = useRouter()
  const params = useParams()
  const repoId = params.id as string

  const [repoName, setRepoName] = useState('loading...')
  const [repoStatus, setRepoStatus] = useState<string>('pending')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [rings, setRings] = useState<Array<{ level: number; count: number; label: string }>>([])
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch repo info
  useEffect(() => {
    async function load() {
      try {
        const { repo } = await api.repos.get(repoId)
        setRepoName(repo.full_name)
        setRepoStatus(repo.status)
      } catch {
        setRepoName('unknown')
      }
    }
    load()
  }, [repoId])

  const addLog = useCallback((status: LogEntry['status'], message: string) => {
    setLogs(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: formatTime(),
      status,
      message,
    }])
  }, [])

  const pollJob = useCallback((jobId: string) => {
    let lastStatus = ''

    const poll = async () => {
      try {
        const { job } = await api.jobs.get(jobId)

        // Update progress
        setProgress(job.progress_pct || 0)

        // Add stage-based logs
        if (job.status === 'running' && job.progress_pct > 10 && lastStatus !== 'parsing') {
          addLog('active', 'Parsing intent with GPT-4...')
          lastStatus = 'parsing'
        }
        if (job.progress_pct >= 30 && lastStatus === 'parsing') {
          addLog('complete', 'Intent parsed successfully')
          addLog('active', 'Searching knowledge graph...')
          setRings([{ level: 0, count: 4, label: 'direct' }])
          lastStatus = 'searching'
        }
        if (job.progress_pct >= 60 && lastStatus === 'searching') {
          addLog('complete', 'Semantic context retrieved')
          addLog('active', 'Generating change plan...')
          setRings(prev => [...prev, { level: 1, count: 12, label: 'calls' }])
          lastStatus = 'generating'
        }
        if (job.progress_pct >= 80 && lastStatus === 'generating') {
          addLog('complete', 'Change plan generated')
          addLog('active', 'Creating pull request...')
          setRings(prev => [...prev, { level: 2, count: 7, label: 'transitive' }])
          lastStatus = 'pr'
        }

        if (job.status === 'complete') {
          clearInterval(pollRef.current!)
          addLog('complete', 'Analysis complete!')
          setProgress(100)
          setIsProcessing(false)

          // Navigate to plan review
          setTimeout(() => {
            if (job.pr_url) {
              router.push(`/repo/${repoId}/pr/${jobId}`)
            } else {
              router.push(`/repo/${repoId}/plan/${jobId}`)
            }
          }, 1500)
          return
        }

        if (job.status === 'failed') {
          clearInterval(pollRef.current!)
          addLog('error', `Analysis failed: ${job.error_msg || 'Unknown error'}`)
          setIsProcessing(false)
          return
        }
      } catch (err) {
        console.error('Poll error:', err)
      }
    }

    pollRef.current = setInterval(poll, 2000)
    poll()
  }, [addLog, repoId, router])

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const handleSubmit = useCallback(async (intent: string) => {
    if (isProcessing) return

    setIsProcessing(true)
    setLogs([])
    setRings([])
    setProgress(0)

    addLog('complete', `Intent received: "${intent}"`)
    addLog('active', 'Submitting to analysis engine...')

    try {
      const { job_id } = await api.analyze.submit(repoId, intent)
      addLog('complete', `Job created: ${job_id.slice(0, 8)}...`)
      addLog('active', 'Processing...')
      pollJob(job_id)
    } catch (err: any) {
      addLog('error', `Failed: ${err.message}`)
      setIsProcessing(false)
    }
  }, [isProcessing, addLog, repoId, pollJob])

  return (
    <div className="min-h-screen bg-ts-base relative">
      <div className="fixed inset-0 z-0 opacity-20">
        <DynamicBackground />
      </div>

      <NavigationHeader currentPath={`~/${repoName}/intent`} />

      <div className="relative z-10 pt-12 flex h-screen">
        {/* Left Panel - Terminal Log */}
        <div className="flex-[7] flex flex-col border-r border-ts-border bg-ts-base/80 backdrop-blur-sm">
          <div className="p-4 border-b border-ts-border flex items-center justify-between">
            <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim">
              Analysis Log
            </p>
            <div className="flex items-center gap-3">
              <GitHubBranchBadge branch="main" />
              <span className="flex items-center gap-1.5 font-mono text-[9px] text-ts-text-ghost">
                <GitHubIcon size={12} />
                {repoName}
              </span>
            </div>
          </div>

          <StatusLog entries={logs} />

          <div className="border-t border-ts-border">
            <TerminalInput
              onSubmit={handleSubmit}
              disabled={isProcessing || repoStatus !== 'ready'}
              placeholder={
                repoStatus !== 'ready'
                  ? 'Repository not yet indexed...'
                  : isProcessing
                  ? 'Processing...'
                  : 'Describe your intent...'
              }
            />
          </div>
        </div>

        {/* Right Panel - Impact Radius */}
        <div className="flex-[3] bg-ts-surface flex flex-col">
          <div className="p-4 border-b border-ts-border">
            <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim">
              Impact Radius
            </p>
          </div>

          <div className="flex-1 p-4">
            {rings.length > 0 ? (
              <ImpactRadius rings={rings} animate={true} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="font-mono text-[10px] text-ts-text-ghost text-center">
                  Impact radius will appear<br />as dependencies are discovered
                </p>
              </div>
            )}
          </div>

          {/* Progress indicator */}
          {isProcessing && (
            <div className="p-4 border-t border-ts-border">
              <div className="h-1 bg-ts-elevated rounded overflow-hidden">
                <div
                  className="h-full bg-ts-emerald transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="font-mono text-[8px] text-ts-text-dim mt-2 text-center">
                {progress}% complete
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function IntentConsolePage() {
  return (
    <AuthGuard>
      <IntentContent />
    </AuthGuard>
  )
}
