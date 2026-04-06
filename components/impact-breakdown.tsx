'use client'

import { useEffect, useState } from 'react'

interface ImpactLevel {
  label: string
  count: number
  color: string
  bgColor: string
}

interface ImpactBreakdownProps {
  levels: ImpactLevel[]
  riskScore: number
}

export function ImpactBreakdown({ levels, riskScore }: ImpactBreakdownProps) {
  const [animatedRisk, setAnimatedRisk] = useState(0)
  const [animatedLevels, setAnimatedLevels] = useState<number[]>(levels.map(() => 0))
  
  const maxCount = Math.max(...levels.map(l => l.count))
  
  useEffect(() => {
    // Animate risk score
    const duration = 800
    const startTime = performance.now()
    
    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      
      setAnimatedRisk(Math.floor(eased * riskScore))
      setAnimatedLevels(levels.map(l => Math.floor(eased * l.count)))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [riskScore, levels])
  
  const getRiskColor = () => {
    if (riskScore < 30) return 'text-ts-emerald'
    if (riskScore < 60) return 'text-ts-amber'
    return 'text-ts-red'
  }
  
  const getRiskBgColor = () => {
    if (riskScore < 30) return 'bg-ts-emerald'
    if (riskScore < 60) return 'bg-ts-amber'
    return 'bg-ts-red'
  }
  
  return (
    <div className="space-y-6">
      {/* Impact Levels */}
      <div>
        <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim mb-4">
          Impact Breakdown
        </p>
        <div className="space-y-3">
          {levels.map((level, i) => (
            <div key={level.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[9px] text-ts-text-muted">
                  {level.label}
                </span>
                <span className={`font-mono text-[9px] ${level.color}`}>
                  {animatedLevels[i]} files
                </span>
              </div>
              <div className="h-2 bg-ts-elevated rounded overflow-hidden">
                <div 
                  className={`h-full ${level.bgColor} transition-all duration-800`}
                  style={{ 
                    width: `${maxCount > 0 ? (animatedLevels[i] / maxCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Risk Score */}
      <div>
        <p className="font-mono text-[9px] uppercase tracking-wider text-ts-text-dim mb-4">
          Risk Score
        </p>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3 bg-ts-elevated rounded overflow-hidden">
            <div 
              className={`h-full ${getRiskBgColor()} risk-fill`}
              style={{ '--risk-percent': `${riskScore}%` } as React.CSSProperties}
            />
          </div>
          <span className={`font-mono text-[16px] font-medium ${getRiskColor()}`}>
            {animatedRisk}%
          </span>
        </div>
        <p className="font-mono text-[8px] text-ts-text-ghost mt-2">
          {riskScore < 30 
            ? 'Low risk - safe to merge'
            : riskScore < 60
            ? 'Moderate risk - review recommended'
            : 'High risk - careful review required'
          }
        </p>
      </div>
    </div>
  )
}
