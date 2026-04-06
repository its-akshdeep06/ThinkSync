'use client'

import Link from 'next/link'
import { GitHubIcon } from './github-icon'
import { useAuth } from './auth-provider'

interface NavigationHeaderProps {
  currentPath?: string
  showNewIntent?: boolean
}

export function NavigationHeader({ 
  currentPath = '', 
  showNewIntent = true,
}: NavigationHeaderProps) {
  const { user, isAuthenticated, logout, login } = useAuth()
  const initials = user?.login?.slice(0, 2).toUpperCase() || 'TS'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 bg-ts-surface/95 backdrop-blur-sm border-b border-ts-border/50 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-mono text-[13px] font-medium text-ts-indigo hover:text-ts-indigo/80 transition-colors">
          // ThinkSync
        </Link>
        
        {isAuthenticated && (
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-ts-elevated/50 border border-ts-border rounded text-ts-text-dim">
            <GitHubIcon size={12} />
            <span className="font-mono text-[9px]">Connected</span>
            <span className="w-1.5 h-1.5 bg-ts-emerald rounded-full" />
          </div>
        )}
      </div>
      
      {currentPath && (
        <div className="font-mono text-[12px] text-ts-text-muted hidden md:block">
          {currentPath}
        </div>
      )}
      
      <div className="flex items-center gap-4">
        {isAuthenticated && showNewIntent && (
          <Link 
            href="/dashboard" 
            className="font-mono text-[10px] text-ts-text-muted hover:text-ts-emerald transition-colors uppercase tracking-wider"
          >
            Dashboard
          </Link>
        )}
        
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.login} 
                className="w-[26px] h-[26px] rounded-full border border-ts-border"
                title={user.login}
              />
            ) : (
              <div className="w-[26px] h-[26px] rounded-full bg-ts-emerald flex items-center justify-center">
                <span className="font-mono text-[10px] font-medium text-ts-base">
                  {initials}
                </span>
              </div>
            )}
            <button
              onClick={logout}
              className="font-mono text-[9px] text-ts-text-ghost hover:text-ts-text-dim transition-colors"
              title="Logout"
            >
              logout
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-ts-emerald border border-ts-emerald/60 px-3 py-1.5 rounded hover:bg-ts-emerald-dim transition-colors"
            title="Login with GitHub"
          >
            <GitHubIcon size={12} />
            GitHub Login
          </button>
        )}
      </div>
    </header>
  )
}
