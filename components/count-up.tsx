'use client'

import { useEffect, useState, useRef } from 'react'

interface CountUpProps {
  end: number
  suffix?: string
  prefix?: string
  duration?: number
  className?: string
  startOnView?: boolean
}

// easeOutCubic: t => 1 - Math.pow(1 - t, 3)
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

export function CountUp({ 
  end, 
  suffix = '', 
  prefix = '',
  duration = 1200,
  className = '',
  startOnView = true,
}: CountUpProps) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(!startOnView)
  const containerRef = useRef<HTMLDivElement>(null)
  const startTimeRef = useRef<number | null>(null)
  const animationRef = useRef<number>(0)
  
  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true)
      return
    }
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    
    return () => observer.disconnect()
  }, [startOnView])
  
  useEffect(() => {
    if (!hasStarted) return
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }
      
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)
      
      setCount(Math.floor(easedProgress * end))
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setCount(end)
      }
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => cancelAnimationFrame(animationRef.current)
  }, [hasStarted, end, duration])
  
  return (
    <div ref={containerRef} className={className}>
      {prefix}{count}{suffix}
    </div>
  )
}
