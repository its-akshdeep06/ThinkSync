'use client'

import { useEffect, useState } from 'react'

interface RingData {
  level: number
  count: number
  label: string
}

interface ImpactRadiusProps {
  rings: RingData[]
  animate?: boolean
}

const ringColors = [
  { stroke: '#34D399', fill: '#34D399' }, // emerald - direct
  { stroke: '#FBBF24', fill: '#FBBF24' }, // amber - 1 degree
  { stroke: '#F87171', fill: '#F87171' }, // red - 2 degree
]

export function ImpactRadius({ rings, animate = true }: ImpactRadiusProps) {
  const [visibleRings, setVisibleRings] = useState(animate ? 0 : rings.length)
  
  useEffect(() => {
    if (!animate) return
    
    const timers = rings.map((_, i) => 
      setTimeout(() => setVisibleRings(i + 1), i * 300)
    )
    
    return () => timers.forEach(clearTimeout)
  }, [animate, rings])
  
  const centerX = 150
  const centerY = 150
  const baseRadius = 30
  const ringSpacing = 40
  
  // Generate node positions for each ring
  const generateNodes = (ringIndex: number, count: number) => {
    const radius = baseRadius + (ringIndex + 1) * ringSpacing
    const nodes = []
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2
      nodes.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      })
    }
    return nodes
  }
  
  return (
    <div className="w-full h-full flex flex-col">
      <svg viewBox="0 0 300 300" className="flex-1 w-full">
        {/* Ring circles */}
        {rings.map((ring, i) => {
          if (i >= visibleRings) return null
          const radius = baseRadius + (i + 1) * ringSpacing
          const color = ringColors[i] || ringColors[ringColors.length - 1]
          
          return (
            <circle
              key={`ring-${i}`}
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke={color.stroke}
              strokeWidth={0.5}
              strokeOpacity={0.3}
              style={{
                transformOrigin: `${centerX}px ${centerY}px`,
                animation: animate ? `ring-expand 300ms ease-out forwards` : undefined,
              }}
            />
          )
        })}
        
        {/* Connecting lines */}
        {rings.map((ring, ringIndex) => {
          if (ringIndex >= visibleRings) return null
          const nodes = generateNodes(ringIndex, ring.count)
          const color = ringColors[ringIndex] || ringColors[ringColors.length - 1]
          
          return nodes.map((node, nodeIndex) => (
            <line
              key={`line-${ringIndex}-${nodeIndex}`}
              x1={centerX}
              y1={centerY}
              x2={node.x}
              y2={node.y}
              stroke={color.stroke}
              strokeWidth={0.5}
              strokeOpacity={0.4}
            />
          ))
        })}
        
        {/* Center node */}
        <circle
          cx={centerX}
          cy={centerY}
          r={8}
          fill="#818CF8"
          stroke="#0A0F1A"
          strokeWidth={2}
        />
        
        {/* Ring nodes */}
        {rings.map((ring, ringIndex) => {
          if (ringIndex >= visibleRings) return null
          const nodes = generateNodes(ringIndex, ring.count)
          const color = ringColors[ringIndex] || ringColors[ringColors.length - 1]
          
          return nodes.map((node, nodeIndex) => (
            <circle
              key={`node-${ringIndex}-${nodeIndex}`}
              cx={node.x}
              cy={node.y}
              r={4}
              fill={color.fill}
              stroke="#0A0F1A"
              strokeWidth={1}
              className="node-pop"
              style={{
                animationDelay: animate ? `${ringIndex * 300 + nodeIndex * 50}ms` : undefined,
              }}
            />
          ))
        })}
      </svg>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 py-4">
        {rings.map((ring, i) => {
          const color = ringColors[i] || ringColors[ringColors.length - 1]
          return (
            <div key={i} className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color.fill }}
              />
              <span className="font-mono text-[8px] text-ts-text-dim">
                {ring.level} deg {ring.label} ({ring.count})
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
