'use client'

import { useEffect, useRef } from 'react'

export interface LogEntry {
  id: string
  timestamp: string
  status: 'pending' | 'complete' | 'active' | 'error'
  message: string
}

interface StatusLogProps {
  entries: LogEntry[]
}

const statusConfig = {
  pending: { symbol: '△', color: 'text-ts-text-dim' },
  complete: { symbol: '✓', color: 'text-ts-emerald' },
  active: { symbol: '→', color: 'text-ts-indigo' },
  error: { symbol: '×', color: 'text-ts-red' },
}

export function StatusLog({ entries }: StatusLogProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [entries])
  
  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-1"
    >
      {entries.map((entry, i) => {
        const config = statusConfig[entry.status]
        const isNew = i === entries.length - 1
        
        return (
          <div 
            key={entry.id}
            className={`font-mono text-[10px] flex items-start gap-2 ${isNew ? 'log-entry' : ''}`}
          >
            <span className="text-ts-text-dim shrink-0">
              [{entry.timestamp}]
            </span>
            <span className={`shrink-0 ${config.color}`}>
              {config.symbol}
            </span>
            <span className={config.color}>
              {entry.message}
            </span>
          </div>
        )
      })}
    </div>
  )
}
