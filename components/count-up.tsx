'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

interface CountUpProps {
  end: number
  suffix?: string
  prefix?: string
  duration?: number
  className?: string
  startOnView?: boolean
  triggerStart?: boolean
}

// easeOutQuart: smooth deceleration
const easeOut = (t: number): number => 1 - Math.pow(1 - t, 4)

export function CountUp({ 
  end, 
  suffix = '', 
  prefix = '',
  duration = 1500,
  className = '',
  startOnView = true,
  triggerStart,
}: CountUpProps) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startTimeRef = useRef<number | null>(null)
  const animationRef = useRef<number>(0)
  const hasAnimated = useRef(false)

  // External trigger support
  useEffect(() => {
    if (triggerStart && !hasAnimated.current) {
      setHasStarted(true)
    }
  }, [triggerStart])

  // IntersectionObserver for viewport detection
  useEffect(() => {
    if (!startOnView || hasAnimated.current) return

    const el = containerRef.current
    if (!el) return

    // Fallback: if observer never fires, start after 3s
    const fallbackTimer = setTimeout(() => {
      if (!hasAnimated.current) {
        setHasStarted(true)
      }
    }, 3000)

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHasStarted(true)
            observer.disconnect()
            clearTimeout(fallbackTimer)
            break
          }
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px 0px',
      }
    )

    observer.observe(el)

    return () => {
      observer.disconnect()
      clearTimeout(fallbackTimer)
    }
  }, [startOnView])

  // Animation loop
  useEffect(() => {
    if (!hasStarted || hasAnimated.current) return
    hasAnimated.current = true

    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOut(progress)

      const currentValue = Math.round(easedProgress * end)
      setCount(currentValue)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setCount(end)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [hasStarted, end, duration])

  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{ minHeight: '1px' }}
    >
      {prefix}{count}{suffix}
    </div>
  )
}
