'use client'

import { useState } from 'react'
import Link from 'next/link'
import { NavigationHeader } from '@/components/navigation-header'
import { SuccessCheckmark } from '@/components/success-checkmark'
import { ScrollReveal } from '@/components/scroll-reveal'
import { DynamicBackground } from '@/components/dynamic-background'
import { GitHubIcon, GitHubPRBadge, GitHubBranchBadge } from '@/components/github-icon'

const auditLog = `[ThinkSync Audit Trail]
Intent: "Add rate limiting to payment endpoints"
Timestamp: 2026-04-06T09:14:15Z
Repository: acme-corp/payment-service

== Analysis Summary ==
Knowledge graph nodes analyzed: 1,893
Direct touch-points: 4
First-degree callers: 12
Transitive dependencies: 7
Risk score: 23% (LOW)

== Files Modified ==
1. src/payment/processor.ts
   - Added rate limit check before charge creation
   - Lines modified: 46-51 (+6, -1)
   - Complexity delta: +3

2. src/payment/rateLimiter.ts (NEW)
   - Created rate limiting utility
   - Lines added: 15
   - Dependencies: redis

3. src/payment/errors.ts
   - Added RateLimitError class
   - Lines added: 7
   - No new dependencies

== Dependency Impact ==
- Direct: processCharge, validatePayment, handleRefund
- 1-deg: PaymentController, SubscriptionService, WebhookHandler...
- 2-deg: APIRouter, AuthMiddleware, LoggingService...

== AI Reasoning ==
Selected rate limiting approach because:
1. Redis-based counters scale horizontally
2. Sliding window prevents burst attacks
3. User-level limits protect against abuse
4. Error type allows graceful client handling

Alternative considered: In-memory rate limiting
Rejected: Does not scale across multiple instances

== Verification ==
- Type check: PASSED
- Lint: PASSED
- Unit tests: 3 new tests added, all passing
- Integration: Compatible with existing payment flow`

export default function PRSuccessPage() {
  const [showStats, setShowStats] = useState(false)
  const [isAuditExpanded, setIsAuditExpanded] = useState(false)
  
  return (
    <div className="min-h-screen bg-ts-base relative">
      {/* Dynamic background */}
      <div className="fixed inset-0 z-0 opacity-40">
        <DynamicBackground />
      </div>
      
      <NavigationHeader currentPath="~/acme-corp/payment-service/pr/247" />
      
      <main className="relative z-10 pt-12 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Success State */}
        <div className="text-center mb-8">
          <SuccessCheckmark 
            size={80} 
            onComplete={() => setShowStats(true)} 
          />
          
          <div 
            className="mt-6 transition-all duration-200"
            style={{
              opacity: showStats ? 1 : 0,
              transform: showStats ? 'translateY(0)' : 'translateY(8px)',
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <GitHubIcon size={18} className="text-ts-text-muted" />
              <p className="font-mono text-[12px] text-ts-text-muted">
                Pull Request Created
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <GitHubPRBadge number={247} status="open" />
              <GitHubBranchBadge branch="feature/rate-limiting" />
            </div>
            
            <p className="mt-3 font-mono text-[11px] text-ts-text-dim">
              acme-corp/payment-service
            </p>
          </div>
        </div>
        
        {/* Stats */}
        <div 
          className="flex items-center gap-8 mb-8 transition-all duration-300"
          style={{
            opacity: showStats ? 1 : 0,
            transform: showStats ? 'translateY(0)' : 'translateY(12px)',
            transitionDelay: '200ms',
          }}
        >
          <div className="text-center">
            <p className="font-mono text-[24px] font-medium text-ts-text-secondary">3</p>
            <p className="font-mono text-[9px] text-ts-text-dim uppercase tracking-wider">Files Changed</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-[24px] font-medium text-ts-emerald">+28</p>
            <p className="font-mono text-[9px] text-ts-text-dim uppercase tracking-wider">Lines Added</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-[24px] font-medium text-ts-red">-1</p>
            <p className="font-mono text-[9px] text-ts-text-dim uppercase tracking-wider">Lines Removed</p>
          </div>
        </div>
        
        {/* Primary Action */}
        <div 
          className="mb-16 transition-all duration-300"
          style={{
            opacity: showStats ? 1 : 0,
            transform: showStats ? 'translateY(0)' : 'translateY(12px)',
            transitionDelay: '400ms',
          }}
        >
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 font-mono text-[10px] text-ts-text-primary bg-ts-surface border border-ts-border px-4 py-2 rounded hover:border-ts-emerald hover:text-ts-emerald transition-all"
          >
            <GitHubIcon size={14} className="group-hover:scale-110 transition-transform" />
            View on GitHub
            <svg className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
        
        {/* Audit Trail (below the fold) */}
        <ScrollReveal className="w-full max-w-2xl">
          <div className="border-t border-ts-border pt-8">
            <button
              onClick={() => setIsAuditExpanded(!isAuditExpanded)}
              className="w-full flex items-center justify-between mb-4"
            >
              <span className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim">
                Full Audit Trail
              </span>
              <span className="font-mono text-[10px] text-ts-text-ghost">
                {isAuditExpanded ? '− Collapse' : '+ Expand'}
              </span>
            </button>
            
            <div 
              className={`overflow-hidden transition-all duration-300 ${
                isAuditExpanded ? 'max-h-[2000px]' : 'max-h-0'
              }`}
            >
              <pre className="bg-ts-surface border border-ts-border rounded p-4 font-mono text-[9px] text-ts-text-muted overflow-x-auto whitespace-pre-wrap">
                {auditLog}
              </pre>
            </div>
          </div>
        </ScrollReveal>
        
        {/* Navigation */}
        <div className="mt-12 flex items-center gap-6">
          <Link
            href="/dashboard"
            className="font-mono text-[9px] text-ts-text-dim hover:text-ts-text-muted transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <Link
            href="/repo/1/intent"
            className="font-mono text-[9px] text-ts-emerald hover:text-ts-emerald/80 transition-colors"
          >
            New Intent →
          </Link>
        </div>
      </main>
    </div>
  )
}
