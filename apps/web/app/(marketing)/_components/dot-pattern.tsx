"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { cn } from "@/lib/utils"

export interface DotPatternProps {
  className?: string
  children?: React.ReactNode
  /** Dot diameter in pixels */
  dotSize?: number
  /** Gap between dots in pixels */
  gap?: number
  /** Base dot color (hex) */
  baseColor?: string
  /** Accent dot color (hex) */
  accentColor?: string
  /** Glow color on hover (hex) */
  glowColor?: string
  /** Background color */
  backgroundColor?: string
  /** Mouse proximity radius for highlighting */
  proximity?: number
  /** Glow intensity multiplier */
  glowIntensity?: number
  /** Wave animation speed (0 to disable) */
  waveSpeed?: number
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

interface Dot {
  x: number
  y: number
  baseOpacity: number
  tone: "base" | "accent"
}

export function DotPattern({
  className,
  children,
  dotSize = 2,
  gap = 28,
  baseColor = "#2c343d",
  accentColor = "#b88a55",
  glowColor = "#7ad3f7",
  backgroundColor = "#07090d",
  proximity = 160,
  glowIntensity = 1.1,
  waveSpeed = 0.45,
}: DotPatternProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dotsRef = useRef<Dot[]>([])
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const animationRef = useRef<number>()
  const startTimeRef = useRef(Date.now())
  const sizeRef = useRef({ width: 0, height: 0 })

  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor])
  const accentRgb = useMemo(() => hexToRgb(accentColor), [accentColor])
  const glowRgb = useMemo(() => hexToRgb(glowColor), [glowColor])

  const buildGrid = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    sizeRef.current = { width: rect.width, height: rect.height }

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const ctx = canvas.getContext("2d")
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const cellSize = dotSize + gap
    const cols = Math.ceil(rect.width / cellSize) + 1
    const rows = Math.ceil(rect.height / cellSize) + 1

    const offsetX = (rect.width - (cols - 1) * cellSize) / 2
    const offsetY = (rect.height - (rows - 1) * cellSize) / 2

    const dots: Dot[] = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        dots.push({
          x: offsetX + col * cellSize,
          y: offsetY + row * cellSize,
          baseOpacity: 0.25 + Math.random() * 0.25,
          tone: Math.random() < 0.18 ? "accent" : "base",
        })
      }
    }
    dotsRef.current = dots
  }, [dotSize, gap])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { width, height } = sizeRef.current
    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)

    const { x: mx, y: my } = mouseRef.current
    const proxSq = proximity * proximity
    const time = (Date.now() - startTimeRef.current) * 0.001 * waveSpeed

    const parallaxX = width ? ((mx - width / 2) / width) * 10 : 0
    const parallaxY = height ? ((my - height / 2) / height) * 8 : 0

    for (const dot of dotsRef.current) {
      const baseX = dot.x + parallaxX
      const baseY = dot.y + parallaxY

      const dx = baseX - mx
      const dy = baseY - my
      const distSq = dx * dx + dy * dy

      const depth = height ? 0.55 + (baseY / height) * 0.45 : 0.75

      const wave = Math.sin(baseX * 0.02 + baseY * 0.02 + time) * 0.5 + 0.5
      const waveOpacity = dot.baseOpacity * depth + wave * 0.18 * depth
      const waveScale = 1 + wave * 0.2

      let opacity = waveOpacity
      let scale = waveScale
      const toneRgb = dot.tone === "accent" ? accentRgb : baseRgb
      let r = toneRgb.r
      let g = toneRgb.g
      let b = toneRgb.b
      let glow = 0

      if (distSq < proxSq) {
        const dist = Math.sqrt(distSq)
        const t = 1 - dist / proximity
        const easedT = t * t * (3 - 2 * t)

        r = Math.round(r + (glowRgb.r - r) * easedT)
        g = Math.round(g + (glowRgb.g - g) * easedT)
        b = Math.round(b + (glowRgb.b - b) * easedT)

        opacity = Math.min(1, waveOpacity + easedT * 0.7)
        scale = waveScale + easedT * 0.9
        glow = easedT * glowIntensity
      }

      const radius = (dotSize / 2) * scale

      if (glow > 0) {
        const gradient = ctx.createRadialGradient(baseX, baseY, 0, baseX, baseY, radius * 4.5)
        gradient.addColorStop(0, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, ${glow * 0.35})`)
        gradient.addColorStop(0.5, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, ${glow * 0.12})`)
        gradient.addColorStop(1, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, 0)`)
        ctx.beginPath()
        ctx.arc(baseX, baseY, radius * 4.5, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(baseX, baseY, radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`
      ctx.fill()
    }

    animationRef.current = requestAnimationFrame(draw)
  }, [proximity, baseRgb, accentRgb, glowRgb, dotSize, glowIntensity, waveSpeed])

  useEffect(() => {
    buildGrid()

    const container = containerRef.current
    if (!container) return

    const ro = new ResizeObserver(buildGrid)
    ro.observe(container)

    return () => ro.disconnect()
  }, [buildGrid])

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [draw])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("mousemove", handleMouseMove)
      container.addEventListener("mouseleave", handleMouseLeave)
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove)
        container.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{ backgroundColor }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(90,140,165,0.18), transparent 55%), radial-gradient(circle at 80% 15%, rgba(210,160,100,0.12), transparent 55%), radial-gradient(circle at 60% 70%, rgba(110,180,210,0.16), transparent 60%)",
        }}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, transparent 42%, rgba(5,6,8,0.75) 100%)",
        }}
      />

      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  )
}

export default function DotPatternDemo() {
  return <DotPattern />
}
