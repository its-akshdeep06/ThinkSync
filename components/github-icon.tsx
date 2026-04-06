'use client'

interface GitHubIconProps {
  className?: string
  size?: number
  animated?: boolean
}

export function GitHubIcon({ className = '', size = 24, animated = false }: GitHubIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`${animated ? 'github-icon-animated' : ''} ${className}`}
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}

export function GitHubConnectButton({ 
  onClick, 
  className = '',
  size = 'default'
}: { 
  onClick?: () => void
  className?: string
  size?: 'small' | 'default' | 'large'
}) {
  const sizeClasses = {
    small: 'px-3 py-1.5 text-[10px] gap-1.5',
    default: 'px-4 py-2.5 text-[11px] gap-2',
    large: 'px-6 py-3 text-[12px] gap-2.5',
  }
  
  const iconSize = {
    small: 14,
    default: 16,
    large: 20,
  }
  
  return (
    <button
      onClick={onClick}
      className={`
        group relative inline-flex items-center justify-center
        font-mono uppercase tracking-wider
        bg-ts-surface border border-ts-border rounded
        text-ts-text-primary
        hover:border-ts-emerald hover:text-ts-emerald
        transition-all duration-300
        overflow-hidden
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {/* Animated background gradient on hover */}
      <span className="absolute inset-0 bg-gradient-to-r from-ts-emerald/0 via-ts-emerald/5 to-ts-emerald/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      
      <GitHubIcon size={iconSize[size]} className="relative z-10 transition-transform duration-300 group-hover:scale-110" />
      <span className="relative z-10">Connect GitHub</span>
      
      {/* Pulse ring */}
      <span className="absolute -inset-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="absolute inset-0 rounded border border-ts-emerald/30 animate-ping" />
      </span>
    </button>
  )
}

export function GitHubRepoCard({
  name,
  fullName,
  description,
  language,
  stars,
  lastUpdated,
  isPrivate,
  onClick,
}: {
  name: string
  fullName: string
  description?: string
  language?: string
  stars?: number
  lastUpdated?: string
  isPrivate?: boolean
  onClick?: () => void
}) {
  const languageColors: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f7df1e',
    Python: '#3572A5',
    Rust: '#dea584',
    Go: '#00ADD8',
    Java: '#b07219',
    Ruby: '#701516',
  }
  
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-ts-surface border border-ts-border rounded hover:border-ts-emerald/50 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <GitHubIcon size={16} className="text-ts-text-dim shrink-0" />
          <span className="font-mono text-[12px] text-ts-text-primary truncate group-hover:text-ts-emerald transition-colors">
            {name}
          </span>
          {isPrivate && (
            <span className="px-1.5 py-0.5 text-[8px] font-mono uppercase bg-ts-amber/10 text-ts-amber border border-ts-amber/20 rounded">
              Private
            </span>
          )}
        </div>
        <svg 
          className="w-4 h-4 text-ts-text-ghost group-hover:text-ts-emerald transition-colors shrink-0" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      
      <p className="mt-1 font-sans text-[10px] text-ts-text-ghost truncate">
        {fullName}
      </p>
      
      {description && (
        <p className="mt-2 font-sans text-[10px] text-ts-text-muted line-clamp-2">
          {description}
        </p>
      )}
      
      <div className="mt-3 flex items-center gap-4 text-[9px] text-ts-text-dim">
        {language && (
          <span className="flex items-center gap-1">
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: languageColors[language] || '#6e7681' }}
            />
            {language}
          </span>
        )}
        {stars !== undefined && (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
            </svg>
            {stars}
          </span>
        )}
        {lastUpdated && (
          <span>Updated {lastUpdated}</span>
        )}
      </div>
    </button>
  )
}

export function GitHubBranchBadge({ 
  branch, 
  className = '' 
}: { 
  branch: string
  className?: string 
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 bg-ts-surface border border-ts-border rounded text-[10px] font-mono text-ts-text-muted ${className}`}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110 8.5H6a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.492 2.492 0 016 7h4a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z"/>
      </svg>
      {branch}
    </span>
  )
}

export function GitHubPRBadge({
  number,
  status,
  className = '',
}: {
  number: number
  status: 'open' | 'merged' | 'closed'
  className?: string
}) {
  const statusStyles = {
    open: 'bg-ts-emerald/10 text-ts-emerald border-ts-emerald/20',
    merged: 'bg-ts-indigo/10 text-ts-indigo border-ts-indigo/20',
    closed: 'bg-ts-red/10 text-ts-red border-ts-red/20',
  }
  
  const statusIcons = {
    open: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
        <path d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"/>
      </svg>
    ),
    merged: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5.45 5.154A4.25 4.25 0 009.25 7.5h1.378a2.251 2.251 0 110 1.5H9.25A5.734 5.734 0 015 7.123v3.505a2.25 2.25 0 11-1.5 0V5.372a2.25 2.25 0 111.95-.218zM4.25 13.5a.75.75 0 100-1.5.75.75 0 000 1.5zm8.5-4.5a.75.75 0 100-1.5.75.75 0 000 1.5zM5 3.25a.75.75 0 100 .005V3.25z"/>
      </svg>
    ),
    closed: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
        <path d="M3.25 1A2.25 2.25 0 011 3.25v9.5A2.25 2.25 0 013.25 15h9.5A2.25 2.25 0 0115 12.75v-9.5A2.25 2.25 0 0112.75 1h-9.5zM2.5 3.25a.75.75 0 01.75-.75h9.5a.75.75 0 01.75.75v9.5a.75.75 0 01-.75.75h-9.5a.75.75 0 01-.75-.75v-9.5z"/>
      </svg>
    ),
  }
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 border rounded text-[10px] font-mono ${statusStyles[status]} ${className}`}>
      {statusIcons[status]}
      #{number}
    </span>
  )
}
