'use client'

import Link from 'next/link'
import { GitHubIcon } from './github-icon'

interface NavigationHeaderProps {
  currentPath?: string
  showNewIntent?: boolean
  userInitials?: string
}

export function NavigationHeader({ 
  currentPath = '', 
  showNewIntent = true,
  userInitials = 'TS'
}: NavigationHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 bg-ts-surface/95 backdrop-blur-sm border-b border-ts-border/50 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-mono text-[13px] font-medium text-ts-indigo hover:text-ts-indigo/80 transition-colors">
          // ThinkSync
        </Link>
        
        {/* GitHub connection indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-ts-elevated/50 border border-ts-border rounded text-ts-text-dim">
          <GitHubIcon size={12} />
          <span className="font-mono text-[9px]">Connected</span>
          <span className="w-1.5 h-1.5 bg-ts-emerald rounded-full" />
        </div>
      </div>
      
      {currentPath && (
        <div className="font-mono text-[12px] text-ts-text-muted hidden md:block">
          {currentPath}
        </div>
      )}
      
      <div className="flex items-center gap-4">
        {showNewIntent && (
          <Link 
            href="/dashboard" 
            className="font-mono text-[10px] text-ts-text-muted hover:text-ts-emerald transition-colors uppercase tracking-wider"
          >
            New Intent
          </Link>
        )}
        <div className="w-[26px] h-[26px] rounded-full bg-ts-emerald flex items-center justify-center">
          <span className="font-mono text-[10px] font-medium text-ts-base">
            {userInitials}
          </span>
        </div>
      </div>
    </header>
  )
}
