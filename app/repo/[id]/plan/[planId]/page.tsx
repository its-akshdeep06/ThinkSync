'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { NavigationHeader } from '@/components/navigation-header'
import { DiffViewer } from '@/components/diff-viewer'
import { ImpactBreakdown } from '@/components/impact-breakdown'
import { DynamicBackground } from '@/components/dynamic-background'
import { GitHubIcon, GitHubBranchBadge } from '@/components/github-icon'

const mockDiffFiles = [
  {
    filename: 'src/payment/processor.ts',
    lines: [
      { type: 'header' as const, content: '@@ -43,7 +43,12 @@ export async function processCharge' },
      { type: 'unchanged' as const, content: 'export async function processCharge(amount: number, currency: string) {', lineNumber: 43 },
      { type: 'unchanged' as const, content: '  const validated = await validateAmount(amount);', lineNumber: 44 },
      { type: 'unchanged' as const, content: '  ', lineNumber: 45 },
      { type: 'removed' as const, content: '  const charge = await createCharge(validated, currency);', lineNumber: 46 },
      { type: 'added' as const, content: '  // Add rate limiting check', lineNumber: 46 },
      { type: 'added' as const, content: '  const rateLimited = await checkRateLimit(userId);', lineNumber: 47 },
      { type: 'added' as const, content: '  if (rateLimited) {', lineNumber: 48 },
      { type: 'added' as const, content: '    throw new RateLimitError("Too many requests");', lineNumber: 49 },
      { type: 'added' as const, content: '  }', lineNumber: 50 },
      { type: 'added' as const, content: '  const charge = await createCharge(validated, currency);', lineNumber: 51 },
      { type: 'unchanged' as const, content: '  ', lineNumber: 52 },
      { type: 'unchanged' as const, content: '  return processResult(charge);', lineNumber: 53 },
      { type: 'unchanged' as const, content: '}', lineNumber: 54 },
    ],
  },
  {
    filename: 'src/payment/rateLimiter.ts (new file)',
    lines: [
      { type: 'added' as const, content: 'import { redis } from "../lib/redis";', lineNumber: 1 },
      { type: 'added' as const, content: '', lineNumber: 2 },
      { type: 'added' as const, content: 'const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute', lineNumber: 3 },
      { type: 'added' as const, content: 'const MAX_REQUESTS = 100;', lineNumber: 4 },
      { type: 'added' as const, content: '', lineNumber: 5 },
      { type: 'added' as const, content: 'export async function checkRateLimit(userId: string): Promise<boolean> {', lineNumber: 6 },
      { type: 'added' as const, content: '  const key = `rate_limit:${userId}`;', lineNumber: 7 },
      { type: 'added' as const, content: '  const current = await redis.incr(key);', lineNumber: 8 },
      { type: 'added' as const, content: '  ', lineNumber: 9 },
      { type: 'added' as const, content: '  if (current === 1) {', lineNumber: 10 },
      { type: 'added' as const, content: '    await redis.expire(key, RATE_LIMIT_WINDOW / 1000);', lineNumber: 11 },
      { type: 'added' as const, content: '  }', lineNumber: 12 },
      { type: 'added' as const, content: '  ', lineNumber: 13 },
      { type: 'added' as const, content: '  return current > MAX_REQUESTS;', lineNumber: 14 },
      { type: 'added' as const, content: '}', lineNumber: 15 },
    ],
  },
  {
    filename: 'src/payment/errors.ts',
    lines: [
      { type: 'header' as const, content: '@@ -12,6 +12,14 @@ export class PaymentError extends Error' },
      { type: 'unchanged' as const, content: 'export class PaymentError extends Error {', lineNumber: 12 },
      { type: 'unchanged' as const, content: '  constructor(message: string) {', lineNumber: 13 },
      { type: 'unchanged' as const, content: '    super(message);', lineNumber: 14 },
      { type: 'unchanged' as const, content: '  }', lineNumber: 15 },
      { type: 'unchanged' as const, content: '}', lineNumber: 16 },
      { type: 'added' as const, content: '', lineNumber: 17 },
      { type: 'added' as const, content: 'export class RateLimitError extends Error {', lineNumber: 18 },
      { type: 'added' as const, content: '  constructor(message: string) {', lineNumber: 19 },
      { type: 'added' as const, content: '    super(message);', lineNumber: 20 },
      { type: 'added' as const, content: '    this.name = "RateLimitError";', lineNumber: 21 },
      { type: 'added' as const, content: '  }', lineNumber: 22 },
      { type: 'added' as const, content: '}', lineNumber: 23 },
    ],
  },
]

const impactLevels = [
  { label: 'Direct changes', count: 3, color: 'text-ts-emerald', bgColor: 'bg-ts-emerald' },
  { label: '1-degree callers', count: 12, color: 'text-ts-amber', bgColor: 'bg-ts-amber' },
  { label: '2-degree transitive', count: 7, color: 'text-ts-red', bgColor: 'bg-ts-red' },
]

export default function ChangePlanReviewPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleApprove = async () => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    router.push('/repo/1/pr/1')
  }
  
  return (
    <div className="min-h-screen bg-ts-base relative">
      {/* Dynamic background */}
      <div className="fixed inset-0 z-0 opacity-20">
        <DynamicBackground />
      </div>
      
      <NavigationHeader currentPath="~/acme-corp/payment-service/plan/add-rate-limiting" />
      
      <div className="relative z-10 pt-12 flex h-screen">
        {/* Left Panel - Diff View (60%) */}
        <div className="flex-[6] flex flex-col overflow-hidden bg-ts-base/80 backdrop-blur-sm">
          <div className="p-4 border-b border-ts-border">
            <div className="flex items-center gap-3 mb-2">
              <GitHubIcon size={18} className="text-ts-text-dim" />
              <h1 className="font-mono text-[16px] font-medium text-ts-text-primary">
                Change Plan: Add rate limiting to payment endpoints
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <GitHubBranchBadge branch="feature/rate-limiting" />
              <p className="font-mono text-[10px] text-ts-text-dim">
                3 files modified · 28 lines added · 1 line removed
              </p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <DiffViewer files={mockDiffFiles} />
          </div>
        </div>
        
        {/* Right Panel - Impact Analysis (40%) */}
        <div className="flex-[4] bg-ts-surface border-l border-ts-border flex flex-col">
          <div className="p-4 border-b border-ts-border">
            <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim">
              Impact Analysis
            </p>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto">
            <ImpactBreakdown levels={impactLevels} riskScore={23} />
            
            {/* Summary Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="font-mono text-[20px] font-medium text-ts-text-secondary">3</p>
                <p className="font-mono text-[8px] text-ts-text-dim uppercase">Files</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-[20px] font-medium text-ts-emerald">+28</p>
                <p className="font-mono text-[8px] text-ts-text-dim uppercase">Added</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-[20px] font-medium text-ts-red">-1</p>
                <p className="font-mono text-[8px] text-ts-text-dim uppercase">Removed</p>
              </div>
            </div>
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
                  Creating PR...
                </>
              ) : (
                <>
                  <GitHubIcon size={14} />
                  Approve and Open PR
                </>
              )}
            </button>
            
            <div className="flex items-center justify-center gap-4">
              <button className="font-mono text-[9px] text-ts-text-dim hover:text-ts-text-muted transition-colors">
                Reject
              </button>
              <span className="text-ts-text-ghost">·</span>
              <button className="font-mono text-[9px] text-ts-text-dim hover:text-ts-text-muted transition-colors">
                Request Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
