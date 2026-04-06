interface RiskBadgeProps {
  level: 'safe' | 'review' | 'high'
  percentage: number
  className?: string
}

const variants = {
  safe: {
    dot: 'bg-ts-emerald',
    bg: 'bg-ts-emerald-dim',
    text: 'text-ts-emerald',
  },
  review: {
    dot: 'bg-ts-amber',
    bg: 'bg-ts-amber-dim',
    text: 'text-ts-amber',
  },
  high: {
    dot: 'bg-ts-red',
    bg: 'bg-ts-red-dim',
    text: 'text-ts-red',
  },
}

export function RiskBadge({ level, percentage, className = '' }: RiskBadgeProps) {
  const variant = variants[level]
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] ${variant.bg} ${className}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${variant.dot}`} />
      <span className={`font-mono text-[9px] font-medium ${variant.text}`}>
        {percentage}%
      </span>
    </div>
  )
}
