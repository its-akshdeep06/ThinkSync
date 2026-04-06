'use client'

import { useEffect, useState } from 'react'

interface SuccessCheckmarkProps {
  size?: number
  onComplete?: () => void
}

export function SuccessCheckmark({ size = 80, onComplete }: SuccessCheckmarkProps) {
  const [showCircle, setShowCircle] = useState(false)
  const [showCheck, setShowCheck] = useState(false)
  
  useEffect(() => {
    // Start circle animation immediately
    setShowCircle(true)
    
    // Start check after circle completes (500ms)
    const checkTimer = setTimeout(() => {
      setShowCheck(true)
    }, 500)
    
    // Call onComplete after full animation (1000ms)
    const completeTimer = setTimeout(() => {
      onComplete?.()
    }, 1000)
    
    return () => {
      clearTimeout(checkTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])
  
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const checkPath = `M ${size * 0.3} ${size * 0.5} L ${size * 0.45} ${size * 0.65} L ${size * 0.7} ${size * 0.35}`
  const checkLength = 60 // Approximate length of check path
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#34D399"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        style={{
          strokeDasharray: circumference,
          strokeDashoffset: showCircle ? 0 : circumference,
          transition: 'stroke-dashoffset 500ms ease-out',
          transform: 'rotate(-90deg)',
          transformOrigin: 'center',
        }}
      />
      
      {/* Checkmark */}
      <path
        d={checkPath}
        fill="none"
        stroke="#34D399"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: checkLength,
          strokeDashoffset: showCheck ? 0 : checkLength,
          transition: 'stroke-dashoffset 300ms ease-out',
        }}
      />
    </svg>
  )
}
