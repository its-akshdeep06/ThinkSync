'use client'

import { useEffect, useState, useRef } from 'react'

const steps = [
  { label: 'Connect', description: 'Link your repository' },
  { label: 'Analyze', description: 'Build knowledge graph' },
  { label: 'Describe', description: 'State your intent' },
  { label: 'Review', description: 'Inspect the change plan' },
  { label: 'Ship', description: 'Open the PR' },
]

export function FlowSteps() {
  const [isVisible, setIsVisible] = useState(false)
  const [lineProgress, setLineProgress] = useState(0)
  const [visibleSteps, setVisibleSteps] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    
    return () => observer.disconnect()
  }, [])
  
  useEffect(() => {
    if (!isVisible) return
    
    // Animate line over 800ms
    const lineStart = performance.now()
    const animateLine = (timestamp: number) => {
      const elapsed = timestamp - lineStart
      const progress = Math.min(elapsed / 800, 1)
      setLineProgress(progress)
      
      if (progress < 1) {
        requestAnimationFrame(animateLine)
      }
    }
    requestAnimationFrame(animateLine)
    
    // Stagger step labels with 300ms per step
    const stepTimers = steps.map((_, i) => 
      setTimeout(() => setVisibleSteps(i + 1), 800 + i * 300)
    )
    
    return () => stepTimers.forEach(clearTimeout)
  }, [isVisible])
  
  return (
    <div ref={containerRef} className="w-full max-w-4xl mx-auto py-16">
      <div className="relative flex items-center justify-between">
        {/* Background line */}
        <div className="absolute top-3 left-0 right-0 h-[1px] bg-ts-border" />
        
        {/* Animated line */}
        <div 
          className="absolute top-3 left-0 h-[1px] bg-ts-emerald transition-none"
          style={{ width: `${lineProgress * 100}%` }}
        />
        
        {/* Steps */}
        {steps.map((step, i) => (
          <div 
            key={step.label}
            className="relative flex flex-col items-center z-10"
            style={{
              opacity: i < visibleSteps ? 1 : 0.3,
              transition: 'opacity 300ms ease',
            }}
          >
            {/* Node */}
            <div 
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                i < visibleSteps 
                  ? 'bg-ts-emerald border-ts-emerald' 
                  : 'bg-ts-surface border-ts-border'
              }`}
            >
              {i < visibleSteps && (
                <svg className="w-3 h-3 text-ts-base" viewBox="0 0 12 12" fill="none">
                  <path 
                    d="M2 6L5 9L10 3" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            
            {/* Label */}
            <span className="mt-3 font-mono text-[10px] uppercase tracking-wider text-ts-text-primary">
              {step.label}
            </span>
            
            {/* Description */}
            <span className="mt-1 font-sans text-[10px] text-ts-text-dim text-center max-w-[80px]">
              {step.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
