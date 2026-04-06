'use client'

import { useEffect, useState, useRef } from 'react'

interface CharacterRevealProps {
  text: string
  className?: string
  charDelay?: number
  staggerDelay?: number
  periodDelay?: number
  startOnView?: boolean
}

export function CharacterReveal({ 
  text, 
  className = '',
  charDelay = 20,
  staggerDelay = 15,
  periodDelay = 600,
  startOnView = true,
}: CharacterRevealProps) {
  const [isVisible, setIsVisible] = useState(!startOnView)
  const [visibleChars, setVisibleChars] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!startOnView) {
      setIsVisible(true)
      return
    }
    
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
  }, [startOnView])
  
  useEffect(() => {
    if (!isVisible) return
    
    const chars = text.split('')
    let currentChar = 0
    
    const interval = setInterval(() => {
      if (currentChar < chars.length) {
        setVisibleChars(currentChar + 1)
        currentChar++
      } else {
        clearInterval(interval)
      }
    }, chars[currentChar] === '.' ? periodDelay : staggerDelay)
    
    return () => clearInterval(interval)
  }, [isVisible, text, staggerDelay, periodDelay])
  
  const chars = text.split('')
  
  return (
    <div ref={containerRef} className={className}>
      {chars.map((char, i) => (
        <span
          key={i}
          className="inline-block transition-all duration-20"
          style={{
            opacity: i < visibleChars ? 1 : 0,
            transform: i < visibleChars ? 'translateY(0)' : 'translateY(4px)',
            transitionDelay: `${i * charDelay}ms`,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </div>
  )
}
