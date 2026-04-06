'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface Node {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  ring: number
  type: 'function' | 'class' | 'import' | 'file'
  risk: 'safe' | 'review' | 'high'
  size: number
  connections: number
}

interface Edge {
  source: string
  target: string
}

interface KnowledgeGraphProps {
  interactive?: boolean
  showMinimap?: boolean
  className?: string
  onNodeSelect?: (node: Node | null) => void
  revealOnScroll?: boolean
}

const COLORS = {
  safe: '#34D399',
  review: '#FBBF24',
  high: '#F87171',
  indigo: '#818CF8',
  border: '#1E2A3D',
  surface: '#0A0F1A',
}

function generateNodes(count: number, width: number, height: number): Node[] {
  const nodes: Node[] = []
  const centerX = width / 2
  const centerY = height / 2
  
  // Center node
  nodes.push({
    id: 'center',
    x: centerX,
    y: centerY,
    vx: 0,
    vy: 0,
    ring: 0,
    type: 'function',
    risk: 'safe',
    size: 12,
    connections: 8,
  })
  
  // Generate rings of nodes
  const rings = [
    { count: 6, radius: 80, ring: 1 },
    { count: 10, radius: 160, ring: 2 },
    { count: 14, radius: 250, ring: 3 },
    { count: 18, radius: 350, ring: 4 },
  ]
  
  const types: Node['type'][] = ['function', 'class', 'import', 'file']
  const risks: Node['risk'][] = ['safe', 'safe', 'safe', 'review', 'high']
  
  rings.forEach((ringConfig) => {
    const actualCount = Math.min(ringConfig.count, count - nodes.length)
    for (let i = 0; i < actualCount; i++) {
      const angle = (i / ringConfig.count) * Math.PI * 2 + Math.random() * 0.3
      const radiusVariation = ringConfig.radius + (Math.random() - 0.5) * 40
      nodes.push({
        id: `node-${nodes.length}`,
        x: centerX + Math.cos(angle) * radiusVariation,
        y: centerY + Math.sin(angle) * radiusVariation,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        ring: ringConfig.ring,
        type: types[Math.floor(Math.random() * types.length)],
        risk: risks[Math.floor(Math.random() * risks.length)],
        size: 4 + Math.random() * 6,
        connections: Math.floor(Math.random() * 5) + 1,
      })
    }
  })
  
  return nodes.slice(0, count)
}

function generateEdges(nodes: Node[]): Edge[] {
  const edges: Edge[] = []
  const centerNode = nodes.find(n => n.id === 'center')
  
  if (!centerNode) return edges
  
  // Connect center to ring 1
  nodes.filter(n => n.ring === 1).forEach(node => {
    edges.push({ source: 'center', target: node.id })
  })
  
  // Connect rings
  nodes.forEach(node => {
    if (node.ring > 1) {
      const previousRing = nodes.filter(n => n.ring === node.ring - 1)
      if (previousRing.length > 0) {
        const closest = previousRing.reduce((prev, curr) => {
          const prevDist = Math.hypot(prev.x - node.x, prev.y - node.y)
          const currDist = Math.hypot(curr.x - node.x, curr.y - node.y)
          return prevDist < currDist ? prev : curr
        })
        edges.push({ source: closest.id, target: node.id })
      }
    }
  })
  
  // Add some cross-connections
  nodes.forEach(node => {
    if (Math.random() > 0.7 && node.ring > 0) {
      const sameRing = nodes.filter(n => n.ring === node.ring && n.id !== node.id)
      if (sameRing.length > 0) {
        const random = sameRing[Math.floor(Math.random() * sameRing.length)]
        edges.push({ source: node.id, target: random.id })
      }
    }
  })
  
  return edges
}

export function KnowledgeGraph({ 
  interactive = false, 
  showMinimap = false,
  className = '',
  onNodeSelect,
  revealOnScroll = false,
}: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const nodesRef = useRef<Node[]>([])
  const edgesRef = useRef<Edge[]>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [visibleRings, setVisibleRings] = useState(revealOnScroll ? 0 : 4)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Initialize nodes and edges
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }
    
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])
  
  useEffect(() => {
    nodesRef.current = generateNodes(48, dimensions.width, dimensions.height)
    edgesRef.current = generateEdges(nodesRef.current)
  }, [dimensions])
  
  // Scroll-based reveal
  useEffect(() => {
    if (!revealOnScroll) {
      setVisibleRings(4)
      return
    }
    
    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight)
      const rings = Math.min(4, Math.floor(scrollPercent * 20) + 1)
      setVisibleRings(rings)
    }
    
    // Start with center node visible
    setVisibleRings(1)
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [revealOnScroll])
  
  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const dpr = window.devicePixelRatio || 1
    canvas.width = dimensions.width * dpr
    canvas.height = dimensions.height * dpr
    ctx.scale(dpr, dpr)
    
    let time = 0
    
    const animate = () => {
      time += 0.01
      ctx.clearRect(0, 0, dimensions.width, dimensions.height)
      
      const nodes = nodesRef.current
      const edges = edgesRef.current
      
      // Apply gentle force simulation
      nodes.forEach(node => {
        if (node.ring > 0) {
          node.x += node.vx + Math.sin(time + node.x * 0.01) * 0.3
          node.y += node.vy + Math.cos(time + node.y * 0.01) * 0.3
          
          // Boundary check
          const padding = 50
          if (node.x < padding) node.vx += 0.05
          if (node.x > dimensions.width - padding) node.vx -= 0.05
          if (node.y < padding) node.vy += 0.05
          if (node.y > dimensions.height - padding) node.vy -= 0.05
          
          // Damping
          node.vx *= 0.99
          node.vy *= 0.99
        }
      })
      
      // Draw edges
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source)
        const target = nodes.find(n => n.id === edge.target)
        
        if (!source || !target) return
        if (source.ring > visibleRings || target.ring > visibleRings) return
        
        ctx.beginPath()
        ctx.moveTo(source.x, source.y)
        ctx.lineTo(target.x, target.y)
        ctx.strokeStyle = `${COLORS.border}80`
        ctx.lineWidth = 0.5
        ctx.stroke()
      })
      
      // Draw nodes
      nodes.forEach(node => {
        if (node.ring > visibleRings) return
        
        const color = node.ring === 0 ? COLORS.indigo : COLORS[node.risk]
        const isSelected = selectedNode?.id === node.id
        
        // Pulse effect for center node
        if (node.ring === 0) {
          const pulseRadius = node.size + Math.sin(time * 2) * 4 + 8
          const gradient = ctx.createRadialGradient(
            node.x, node.y, node.size,
            node.x, node.y, pulseRadius
          )
          gradient.addColorStop(0, `${color}40`)
          gradient.addColorStop(1, `${color}00`)
          ctx.beginPath()
          ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2)
          ctx.fillStyle = gradient
          ctx.fill()
        }
        
        // Draw node shape based on type
        ctx.fillStyle = color
        ctx.strokeStyle = isSelected ? COLORS.safe : COLORS.surface
        ctx.lineWidth = isSelected ? 2 : 1
        
        const size = isSelected ? node.size * 1.5 : node.size
        
        if (node.type === 'function' || node.type === 'file') {
          // Circle
          ctx.beginPath()
          ctx.arc(node.x, node.y, size, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
        } else if (node.type === 'class') {
          // Rounded square
          const halfSize = size
          ctx.beginPath()
          ctx.roundRect(node.x - halfSize, node.y - halfSize, halfSize * 2, halfSize * 2, 2)
          ctx.fill()
          ctx.stroke()
        } else if (node.type === 'import') {
          // Diamond
          ctx.beginPath()
          ctx.moveTo(node.x, node.y - size)
          ctx.lineTo(node.x + size, node.y)
          ctx.lineTo(node.x, node.y + size)
          ctx.lineTo(node.x - size, node.y)
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
        }
      })
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [dimensions, selectedNode, visibleRings])
  
  // Handle click for interactive mode
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const clickedNode = nodesRef.current.find(node => {
      const dist = Math.hypot(node.x - x, node.y - y)
      return dist < node.size + 5
    })
    
    setSelectedNode(clickedNode || null)
    onNodeSelect?.(clickedNode || null)
  }, [interactive, onNodeSelect])
  
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className={`w-full h-full ${interactive ? 'cursor-pointer' : ''}`}
        style={{ width: dimensions.width, height: dimensions.height }}
      />
      
      {showMinimap && (
        <div className="absolute bottom-4 right-4 w-32 h-24 bg-ts-surface/80 border border-ts-border rounded overflow-hidden">
          <div className="w-full h-full relative">
            {nodesRef.current.slice(0, 20).map(node => (
              <div
                key={node.id}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  left: `${(node.x / dimensions.width) * 100}%`,
                  top: `${(node.y / dimensions.height) * 100}%`,
                  backgroundColor: node.ring === 0 ? COLORS.indigo : COLORS[node.risk],
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
