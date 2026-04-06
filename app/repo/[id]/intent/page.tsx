'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { NavigationHeader } from '@/components/navigation-header'
import { TerminalInput } from '@/components/terminal-input'
import { StatusLog, type LogEntry } from '@/components/status-log'
import { ImpactRadius } from '@/components/impact-radius'
import { DynamicBackground } from '@/components/dynamic-background'
import { GitHubIcon, GitHubBranchBadge } from '@/components/github-icon'

const formatTime = () => {
  const now = new Date()
  return now.toTimeString().slice(0, 8)
}

const simulationSteps = [
  { delay: 500, status: 'active' as const, message: 'Parsing intent...' },
  { delay: 1000, status: 'complete' as const, message: 'Intent parsed successfully' },
  { delay: 500, status: 'active' as const, message: 'Loading knowledge graph...' },
  { delay: 1200, status: 'complete' as const, message: 'Knowledge graph loaded (1,893 nodes)' },
  { delay: 400, status: 'active' as const, message: 'Identifying affected functions...' },
  { delay: 1500, status: 'complete' as const, message: '4 direct touch-points identified' },
  { delay: 300, status: 'active' as const, message: 'Tracing 1-degree dependencies...' },
  { delay: 1000, status: 'complete' as const, message: '12 first-degree callers found' },
  { delay: 300, status: 'active' as const, message: 'Tracing 2-degree dependencies...' },
  { delay: 800, status: 'complete' as const, message: '7 transitive dependencies mapped' },
  { delay: 500, status: 'active' as const, message: 'Calculating risk scores...' },
  { delay: 1000, status: 'complete' as const, message: 'Risk analysis complete: 23% estimated impact' },
  { delay: 300, status: 'active' as const, message: 'Generating change plan...' },
  { delay: 2000, status: 'complete' as const, message: 'Change plan ready for review' },
]

export default function IntentConsolePage() {
  const router = useRouter()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [rings, setRings] = useState<Array<{ level: number; count: number; label: string }>>([])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const addLog = useCallback((status: LogEntry['status'], message: string) => {
    setLogs(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: formatTime(),
      status,
      message,
    }])
  }, [])
  
  const runSimulation = useCallback((step: number) => {
    if (step >= simulationSteps.length) {
      setIsProcessing(false)
      // Navigate to plan review after completion
      setTimeout(() => {
        router.push('/repo/1/plan/1')
      }, 1500)
      return
    }
    
    const { delay, status, message } = simulationSteps[step]
    
    timeoutRef.current = setTimeout(() => {
      addLog(status, message)
      setCurrentStep(step + 1)
      
      // Update impact radius based on step
      if (step === 5) {
        setRings([{ level: 0, count: 4, label: 'direct' }])
      } else if (step === 7) {
        setRings(prev => [...prev, { level: 1, count: 12, label: 'calls' }])
      } else if (step === 9) {
        setRings(prev => [...prev, { level: 2, count: 7, label: 'transitive' }])
      }
      
      runSimulation(step + 1)
    }, delay)
  }, [addLog, router])
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  const handleSubmit = useCallback((intent: string) => {
    if (isProcessing) return
    
    setIsProcessing(true)
    setLogs([])
    setRings([])
    setCurrentStep(0)
    
    addLog('complete', `Intent received: "${intent}"`)
    runSimulation(0)
  }, [isProcessing, addLog, runSimulation])
  
  return (
    <div className="min-h-screen bg-ts-base relative">
      {/* Dynamic background */}
      <div className="fixed inset-0 z-0 opacity-20">
        <DynamicBackground />
      </div>
      
      <NavigationHeader currentPath="~/acme-corp/payment-service/intent" />
      
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
                acme-corp/payment-service
              </span>
            </div>
          </div>
          
          <StatusLog entries={logs} />
          
          <div className="border-t border-ts-border">
            <TerminalInput 
              onSubmit={handleSubmit}
              disabled={isProcessing}
              placeholder={isProcessing ? 'Processing...' : 'Describe your intent...'}
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
                  className="h-full bg-ts-emerald transition-all duration-300"
                  style={{ width: `${(currentStep / simulationSteps.length) * 100}%` }}
                />
              </div>
              <p className="font-mono text-[8px] text-ts-text-dim mt-2 text-center">
                Step {currentStep} of {simulationSteps.length}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
