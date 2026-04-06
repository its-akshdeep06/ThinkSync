'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { NavigationHeader } from '@/components/navigation-header'
import { DiffViewer } from '@/components/diff-viewer'
import { ImpactBreakdown } from '@/components/impact-breakdown'
import { DynamicBackground } from '@/components/dynamic-background'
import { GitHubIcon, GitHubBranchBadge } from '@/components/github-icon'
import { api } from '@/lib/api'

function buildDiffFiles(changes: any[]): any[] {
  if (!changes || changes.length === 0) return []

  return changes.map((change: any) => {
    const lines: any[] = []

    if (change.change_type === 'add') {
      // New file
      const codeLines = (change.new_code || '').split('\n')
      lines.push({ type: 'header' as const, content: `@@ New file: ${change.file_path}` })
      codeLines.forEach((line: string, i: number) => {
        lines.push({ type: 'added' as const, content: line, lineNumber: i + 1 })
      })
    } else {
      // Modified file
      if (change.original_code) {
        lines.push({ type: 'header' as const, content: `@@ Modified: ${change.function_name || change.file_path}` })
        const origLines = change.original_code.split('\n')
        origLines.forEach((line: string, i: number) => {
          lines.push({ type: 'removed' as const, content: line, lineNumber: i + 1 })
        })
      }
      if (change.new_code) {
        const newLines = change.new_code.split('\n')
        newLines.forEach((line: string, i: number) => {
          lines.push({ type: 'added' as const, content: line, lineNumber: i + 1 })
        })
      }
    }

    return {
      filename: `${change.file_path}${change.change_type === 'add' ? ' (new file)' : ''}`,
      lines,
    }
  })
}

function PlanContent() {
  const router = useRouter()
  const params = useParams()
  const repoId = params.id as string
  const planId = params.planId as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [jobData, setJobData] = useState<any>(null)
  const [result, setResult] = useState<any>(null)
  const [repoInfo, setRepoInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await api.analyze.getResult(planId)
        setJobData(data.job)
        setResult(data.result)
        setRepoInfo(data.repo)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [planId])

  const changes = result?.change_set || result?.changes || []
  const diffFiles = buildDiffFiles(changes)
  const structuredIntent = result?.structured_intent || {}
  const impactReport = structuredIntent.impact_report || {}

  const impactLevels = [
    { label: 'Direct changes', count: impactReport.direct_changes || changes.length, color: 'text-ts-emerald', bgColor: 'bg-ts-emerald' },
    { label: '1-degree callers', count: impactReport.first_degree_callers || 0, color: 'text-ts-amber', bgColor: 'bg-ts-amber' },
    { label: '2-degree transitive', count: impactReport.transitive_deps || 0, color: 'text-ts-red', bgColor: 'bg-ts-red' },
  ]

  const addedLines = changes.reduce((acc: number, c: any) => acc + (c.new_code || '').split('\n').length, 0)
  const removedLines = changes.reduce((acc: number, c: any) => acc + (c.original_code || '').split('\n').length, 0)
  const riskScore = structuredIntent.risk_level === 'high' ? 75 : structuredIntent.risk_level === 'medium' ? 45 : 20

  const handleApprove = async () => {
    if (result?.pr_url) {
      router.push(`/repo/${repoId}/pr/${planId}`)
      return
    }
    setIsSubmitting(true)
    // The PR was already created by the AI engine, just navigate
    setTimeout(() => {
      router.push(`/repo/${repoId}/pr/${planId}`)
    }, 1000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ts-base flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-ts-emerald border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-mono text-[10px] text-ts-text-dim">Loading change plan...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ts-base flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-[12px] text-ts-red mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="font-mono text-[10px] text-ts-text-dim hover:text-ts-text-muted"
          >
            ← Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ts-base relative">
      <div className="fixed inset-0 z-0 opacity-20">
        <DynamicBackground />
      </div>

      <NavigationHeader currentPath={`~/${repoInfo?.full_name || 'repo'}/plan`} />

      <div className="relative z-10 pt-12 flex h-screen">
        {/* Left Panel - Diff View */}
        <div className="flex-[6] flex flex-col overflow-hidden bg-ts-base/80 backdrop-blur-sm">
          <div className="p-4 border-b border-ts-border">
            <div className="flex items-center gap-3 mb-2">
              <GitHubIcon size={18} className="text-ts-text-dim" />
              <h1 className="font-mono text-[16px] font-medium text-ts-text-primary truncate">
                Change Plan: {jobData?.intent_text || 'Analysis Result'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <GitHubBranchBadge branch={`thinksync/changes`} />
              <p className="font-mono text-[10px] text-ts-text-dim">
                {changes.length} files modified · +{addedLines} lines · -{removedLines} lines
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {diffFiles.length > 0 ? (
              <DiffViewer files={diffFiles} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="font-mono text-[10px] text-ts-text-dim">No changes generated</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Impact Analysis */}
        <div className="flex-[4] bg-ts-surface border-l border-ts-border flex flex-col">
          <div className="p-4 border-b border-ts-border">
            <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim">
              Impact Analysis
            </p>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <ImpactBreakdown levels={impactLevels} riskScore={riskScore} />

            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="font-mono text-[20px] font-medium text-ts-text-secondary">{changes.length}</p>
                <p className="font-mono text-[8px] text-ts-text-dim uppercase">Files</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-[20px] font-medium text-ts-emerald">+{addedLines}</p>
                <p className="font-mono text-[8px] text-ts-text-dim uppercase">Added</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-[20px] font-medium text-ts-red">-{removedLines}</p>
                <p className="font-mono text-[8px] text-ts-text-dim uppercase">Removed</p>
              </div>
            </div>

            {/* Change justifications */}
            {changes.length > 0 && (
              <div className="mt-8">
                <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim mb-3">
                  Change Justifications
                </p>
                <div className="space-y-2">
                  {changes.map((c: any, i: number) => (
                    <div key={i} className="p-2 bg-ts-elevated border border-ts-border rounded">
                      <p className="font-mono text-[9px] text-ts-emerald">{c.file_path}</p>
                      <p className="font-mono text-[8px] text-ts-text-muted mt-1">{c.justification || 'No justification provided'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-ts-border space-y-3">
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-ts-emerald-dim border border-ts-emerald px-4 py-3 rounded font-mono text-[10px] text-ts-emerald hover:bg-ts-emerald/10 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3 h-3 border border-ts-emerald border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <GitHubIcon size={14} />
                  {result?.pr_url ? 'View PR' : 'Approve and Open PR'}
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => router.push(`/repo/${repoId}/intent`)}
                className="font-mono text-[9px] text-ts-text-dim hover:text-ts-text-muted transition-colors"
              >
                New Intent
              </button>
              <span className="text-ts-text-ghost">·</span>
              <button
                onClick={() => router.push('/dashboard')}
                className="font-mono text-[9px] text-ts-text-dim hover:text-ts-text-muted transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChangePlanReviewPage() {
  return (
    <AuthGuard>
      <PlanContent />
    </AuthGuard>
  )
}
