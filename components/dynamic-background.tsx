'use client'

import { useEffect, useRef, useCallback } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  hue: number
}

interface GridLine {
  start: { x: number; y: number }
  end: { x: number; y: number }
  opacity: number
  delay: number
}

export function DynamicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const gridLinesRef = useRef<GridLine[]>([])
  const mouseRef = useRef({ x: 0, y: 0, active: false })
  const animationRef = useRef<number>(0)
  const timeRef = useRef(0)
  
  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = []
    const count = Math.floor((width * height) / 15000) // Responsive particle count
    
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        hue: Math.random() > 0.7 ? 160 : Math.random() > 0.5 ? 230 : 0, // emerald, indigo, or white
      })
    }
    particlesRef.current = particles
  }, [])
  
  const initGrid = useCallback((width: number, height: number) => {
    const lines: GridLine[] = []
    const spacing = 80
    
    // Vertical lines
    for (let x = 0; x < width; x += spacing) {
      lines.push({
        start: { x, y: 0 },
        end: { x, y: height },
        opacity: 0.03 + Math.random() * 0.02,
        delay: Math.random() * 2,
      })
    }
    
    // Horizontal lines
    for (let y = 0; y < height; y += spacing) {
      lines.push({
        start: { x: 0, y },
        end: { x: width, y },
        opacity: 0.03 + Math.random() * 0.02,
        delay: Math.random() * 2,
      })
    }
    
    gridLinesRef.current = lines
  }, [])
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.scale(dpr, dpr)
      initParticles(window.innerWidth, window.innerHeight)
      initGrid(window.innerWidth, window.innerHeight)
    }
    
    resize()
    window.addEventListener('resize', resize)
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true }
    }
    
    const handleMouseLeave = () => {
      mouseRef.current.active = false
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    
    const animate = () => {
      timeRef.current += 0.01
      const time = timeRef.current
      const width = window.innerWidth
      const height = window.innerHeight
      
      // Clear with subtle fade for trails
      ctx.fillStyle = 'rgba(6, 10, 18, 0.15)'
      ctx.fillRect(0, 0, width, height)
      
      // Draw animated grid
      gridLinesRef.current.forEach(line => {
        const pulseOpacity = line.opacity * (0.8 + Math.sin(time * 0.5 + line.delay) * 0.2)
        ctx.strokeStyle = `rgba(30, 42, 61, ${pulseOpacity})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(line.start.x, line.start.y)
        ctx.lineTo(line.end.x, line.end.y)
        ctx.stroke()
      })
      
      // Draw gradient orbs (ambient glow)
      const orbs = [
        { x: width * 0.2, y: height * 0.3, radius: 300, color: '129, 140, 248', intensity: 0.03 }, // indigo
        { x: width * 0.8, y: height * 0.7, radius: 350, color: '52, 211, 153', intensity: 0.025 }, // emerald
        { x: width * 0.5, y: height * 0.5, radius: 400, color: '52, 211, 153', intensity: 0.02 }, // center emerald
      ]
      
      orbs.forEach(orb => {
        const pulseRadius = orb.radius + Math.sin(time * 0.3) * 30
        const gradient = ctx.createRadialGradient(
          orb.x + Math.sin(time * 0.2) * 20,
          orb.y + Math.cos(time * 0.3) * 20,
          0,
          orb.x + Math.sin(time * 0.2) * 20,
          orb.y + Math.cos(time * 0.3) * 20,
          pulseRadius
        )
        gradient.addColorStop(0, `rgba(${orb.color}, ${orb.intensity})`)
        gradient.addColorStop(0.5, `rgba(${orb.color}, ${orb.intensity * 0.5})`)
        gradient.addColorStop(1, 'rgba(6, 10, 18, 0)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
      })
      
      // Update and draw particles
      const particles = particlesRef.current
      const mouse = mouseRef.current
      
      particles.forEach(particle => {
        // Mouse interaction
        if (mouse.active) {
          const dx = mouse.x - particle.x
          const dy = mouse.y - particle.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < 150) {
            const force = (150 - dist) / 150 * 0.02
            particle.vx -= (dx / dist) * force
            particle.vy -= (dy / dist) * force
          }
        }
        
        // Update position
        particle.x += particle.vx
        particle.y += particle.vy
        
        // Boundary wrap
        if (particle.x < 0) particle.x = width
        if (particle.x > width) particle.x = 0
        if (particle.y < 0) particle.y = height
        if (particle.y > height) particle.y = 0
        
        // Damping
        particle.vx *= 0.99
        particle.vy *= 0.99
        
        // Draw particle
        let color: string
        if (particle.hue === 160) {
          color = `rgba(52, 211, 153, ${particle.opacity})`
        } else if (particle.hue === 230) {
          color = `rgba(129, 140, 248, ${particle.opacity})`
        } else {
          color = `rgba(148, 163, 184, ${particle.opacity * 0.5})`
        }
        
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
      })
      
      // Draw connections between nearby particles
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < 100) {
            const opacity = (1 - dist / 100) * 0.1
            ctx.strokeStyle = `rgba(52, 211, 153, ${opacity})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        })
      })
      
      // Scan line effect
      const scanY = (time * 50) % height
      const scanGradient = ctx.createLinearGradient(0, scanY - 50, 0, scanY + 50)
      scanGradient.addColorStop(0, 'rgba(52, 211, 153, 0)')
      scanGradient.addColorStop(0.5, 'rgba(52, 211, 153, 0.02)')
      scanGradient.addColorStop(1, 'rgba(52, 211, 153, 0)')
      ctx.fillStyle = scanGradient
      ctx.fillRect(0, scanY - 50, width, 100)
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [initParticles, initGrid])
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: 'linear-gradient(180deg, #060A12 0%, #0A0F1A 50%, #060A12 100%)' }}
    />
  )
}
