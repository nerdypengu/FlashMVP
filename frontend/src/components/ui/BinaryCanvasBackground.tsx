import { useRef, useEffect } from 'react'

// Character set emphasizing binary '0' and '1' with matrix punctuation
const CHAR_SET = ' 01010101011001101.:+x#'
const CHAR_COUNT = CHAR_SET.length

// Color palette for mouse glow (electric cyan, blue, magenta, warm gold chromatic spectrum)
const GLOW_PALETTE = new Uint8Array([
  15, 98, 254,   // IBM Blue
  0, 218, 243,   // Electric Cyan
  66, 190, 101,  // Matrix Green-Cyan
  165, 110, 255, // Electric Purple
  255, 142, 97,  // Amber Coral
  255, 255, 141, // Pale Gold
  15, 98, 254,   // Loop back
])
const PALETTE_COLORS = GLOW_PALETTE.length / 3

const CELL_W = 7.5
const CELL_H = 13.0
const FONT_SIZE = 12
const HOVER_RADIUS = 200
const MAX_DISPLACEMENT = 14
const SPRING_STIFFNESS = -82
const SPRING_DAMPING = 8.5
const PUSH_FORCE = 520

function smoothstep(min: number, max: number, val: number) {
  const t = Math.min(1, Math.max(0, (val - min) / (max - min)))
  return t * t * (3 - 2 * t)
}

function pseudoRandom(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}

function noise2D(x: number, y: number) {
  const fx = Math.floor(x)
  const fy = Math.floor(y)
  const ix = (x - fx) * (x - fx) * (3 - 2 * (x - fx))
  const iy = (y - fy) * (y - fy) * (3 - 2 * (y - fy))
  const n00 = pseudoRandom(fx, fy)
  const n10 = pseudoRandom(fx + 1, fy)
  const n01 = pseudoRandom(fx, fy + 1)
  const n11 = pseudoRandom(fx + 1, fy + 1)
  const nx0 = n00 + (n10 - n00) * ix
  const nx1 = n01 + (n11 - n01) * ix
  return nx0 + (nx1 - nx0) * iy
}

export default function BinaryCanvasBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let cols = 0
    let rows = 0
    let width = 0
    let height = 0
    let cellW = CELL_W
    let cellH = CELL_H
    let animId = 0

    let charIndices = new Uint8Array(0)
    let baseOpacity = new Float32Array(0)
    let mutateChance = new Float32Array(0)
    let dispX = new Float32Array(0)
    let dispY = new Float32Array(0)
    let velX = new Float32Array(0)
    let velY = new Float32Array(0)
    let activeIndices = new Int32Array(0)
    let isActive = new Uint8Array(0)
    let activeCount = 0
    let rainDrops = new Float32Array(0)
    let rainSpeeds = new Float32Array(0)

    let mouseX = -1000
    let mouseY = -1000
    let mouseVelocityX = 0
    let mouseVelocityY = 0
    let mouseActivity = 0
    let prevMouseX = -1000
    let prevMouseY = -1000

    const initGrid = () => {
      width = window.innerWidth
      height = window.innerHeight

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.textBaseline = 'top'

      const responsiveScale = width < 768 ? 0.65 : width < 1024 ? 0.82 : 1
      cellW = CELL_W * responsiveScale
      cellH = CELL_H * responsiveScale
      const scaledFontSize = Math.round(FONT_SIZE * responsiveScale)
      ctx.font = `${scaledFontSize}px "Geist Mono", "IBM Plex Mono", ui-monospace, monospace`

      cols = Math.ceil(width / cellW)
      rows = Math.ceil(height / cellH)
      const totalCells = cols * rows

      charIndices = new Uint8Array(totalCells)
      baseOpacity = new Float32Array(totalCells)
      mutateChance = new Float32Array(totalCells)
      dispX = new Float32Array(totalCells)
      dispY = new Float32Array(totalCells)
      velX = new Float32Array(totalCells)
      velY = new Float32Array(totalCells)
      activeIndices = new Int32Array(totalCells)
      isActive = new Uint8Array(totalCells)
      activeCount = 0

      for (let r = 0; r < rows; r++) {
        const rowNorm = (r * cellH) / height
        const rowDensity = 0.12 + 0.88 * smoothstep(0.1, 0.95, rowNorm)

        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c
          const colNorm = (c * cellW) / width
          const noise = Math.max(0, -0.15 + 1.45 * noise2D(c / 8, r / 4.5))
          const centerFalloff = 1 - 0.25 * Math.abs(colNorm - 0.5)
          const density = rowDensity * noise * centerFalloff

          mutateChance[idx] = 0.005 + Math.random() * 0.02
          if (Math.random() < density * 0.85) {
            charIndices[idx] = 1 + Math.floor(Math.random() ** 1.4 * (CHAR_COUNT - 1))
            baseOpacity[idx] = Math.min(0.85, density * (0.35 + Math.random() * 0.45))
          }
        }
      }

      rainDrops = new Float32Array(cols).fill(-1)
      rainSpeeds = new Float32Array(cols)
    }

    initGrid()

    const onPointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const nx = e.clientX - rect.left
      const ny = e.clientY - rect.top
      if (prevMouseX > -900) {
        mouseVelocityX = nx - prevMouseX
        mouseVelocityY = ny - prevMouseY
      }
      prevMouseX = mouseX = nx
      prevMouseY = mouseY = ny
      mouseActivity = 1
    }

    const onPointerLeave = () => {
      mouseX = -1000
      mouseY = -1000
      prevMouseX = -1000
      prevMouseY = -1000
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerleave', onPointerLeave)
    window.addEventListener('resize', initGrid)

    let lastTime = 0

    const render = (time: number) => {
      animId = requestAnimationFrame(render)

      const dt = lastTime ? Math.min(0.05, (time - lastTime) / 1000) : 0.016
      lastTime = time
      const sec = time / 1000

      mouseActivity += ((mouseX >= 0 ? 1 : 0) - mouseActivity) * Math.min(1, dt * 6)

      if (!prefersReducedMotion) {
        const total = charIndices.length
        for (let i = 0; i < total; i++) {
          if (baseOpacity[i] > 0 && Math.random() < mutateChance[i]) {
            charIndices[i] = 1 + Math.floor(Math.random() ** 1.4 * (CHAR_COUNT - 1))
          }
        }

        for (let c = 0; c < cols; c++) {
          if (rainDrops[c] < 0) {
            if (Math.random() < 0.0018) {
              rainDrops[c] = 0
              rainSpeeds[c] = (12 + Math.random() * 22) * (CELL_H / cellH)
            }
          } else {
            rainDrops[c] += rainSpeeds[c] * dt
            if (rainDrops[c] > rows + 16) rainDrops[c] = -1
          }
        }
      }

      if (mouseX >= 0) {
        const minC = Math.max(0, Math.floor((mouseX - HOVER_RADIUS) / cellW))
        const maxC = Math.min(cols - 1, Math.ceil((mouseX + HOVER_RADIUS) / cellW))
        const minR = Math.max(0, Math.floor((mouseY - HOVER_RADIUS) / cellH))
        const maxR = Math.min(rows - 1, Math.ceil((mouseY + HOVER_RADIUS) / cellH))

        const pushX = Math.max(-500, Math.min(500, mouseVelocityX * 0.35))
        const pushY = Math.max(-500, Math.min(500, mouseVelocityY * 0.35))

        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const idx = r * cols + c
            if (baseOpacity[idx] <= 0) continue

            const dx = c * cellW + cellW * 0.5 - mouseX
            const dy = r * cellH + cellH * 0.5 - mouseY
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist > HOVER_RADIUS) continue

            const force = smoothstep(0, 1, 1 - dist / HOVER_RADIUS)
            const pushMag = PUSH_FORCE * force * (1 - force) * 4
            const invDist = dist > 0.001 ? pushMag / dist : 0

            velX[idx] += (dx * invDist + pushX * force) * dt
            velY[idx] += (dy * invDist + pushY * force) * dt

            if (!isActive[idx]) {
              isActive[idx] = 1
              activeIndices[activeCount++] = idx
            }
          }
        }
      }

      for (let i = 0; i < activeCount; i++) {
        const idx = activeIndices[i]
        let px = dispX[idx], py = dispY[idx]
        let vx = velX[idx],  vy = velY[idx]

        vx += (SPRING_STIFFNESS * px - SPRING_DAMPING * vx) * dt
        vy += (SPRING_STIFFNESS * py - SPRING_DAMPING * vy) * dt
        px = Math.max(-MAX_DISPLACEMENT, Math.min(MAX_DISPLACEMENT, px + vx * dt))
        py = Math.max(-MAX_DISPLACEMENT, Math.min(MAX_DISPLACEMENT, py + vy * dt))

        if (Math.abs(px) + Math.abs(py) < 0.05 && Math.abs(vx) + Math.abs(vy) < 1) {
          dispX[idx] = dispY[idx] = velX[idx] = velY[idx] = 0
          isActive[idx] = 0
          activeIndices[i] = activeIndices[--activeCount]
          i--
          continue
        }

        dispX[idx] = px; dispY[idx] = py
        velX[idx] = vx;  velY[idx] = vy
      }

      const decay = Math.exp(-dt * 9)
      mouseVelocityX *= decay
      mouseVelocityY *= decay

      ctx.clearRect(0, 0, width, height)

      const hasMouseGlow = mouseActivity > 0.01 && mouseX >= 0
      const colorPhase = (sec * 0.06) % 1

      for (let r = 0; r < rows; r++) {
        const posY = r * cellH
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c
          let alpha = baseOpacity[idx]
          if (alpha <= 0) continue

          alpha *= prefersReducedMotion ? 1 : 0.7 + 0.3 * Math.sin(sec * 0.5 + idx * 0.35)

          const rainY = rainDrops[c]
          if (rainY >= 0) {
            const deltaR = rainY - r
            if (deltaR >= 0 && deltaR < 18) {
              alpha += deltaR < 1 ? 0.45 : 0.28 * (1 - deltaR / 18)
            }
          }

          if (alpha < 0.02) continue

          const posX = c * cellW
          const renderX = posX + dispX[idx]
          const renderY = posY + dispY[idx]

          if (hasMouseGlow) {
            const mxDist = posX + cellW * 0.5 - mouseX
            const myDist = posY + cellH * 0.5 - mouseY
            const mDist = Math.sqrt(mxDist * mxDist + myDist * myDist)

            if (mDist < HOVER_RADIUS * 1.15) {
              const glowIntensity = smoothstep(0, 1, 1 - mDist / (HOVER_RADIUS * 1.15)) * mouseActivity
              const colorPos = Math.min(0.9999, Math.max(0,
                ((mxDist + myDist) / (HOVER_RADIUS * 2.2) + 0.5 + colorPhase) % 1
              )) * (PALETTE_COLORS - 1)

              const baseColorIdx = Math.floor(colorPos) * 3
              const colorBlend = colorPos - Math.floor(colorPos)
              const nextColorIdx = Math.min(GLOW_PALETTE.length - 3, baseColorIdx + 3)

              const red   = Math.round(GLOW_PALETTE[baseColorIdx]     + (GLOW_PALETTE[nextColorIdx]     - GLOW_PALETTE[baseColorIdx])     * colorBlend)
              const green = Math.round(GLOW_PALETTE[baseColorIdx + 1] + (GLOW_PALETTE[nextColorIdx + 1] - GLOW_PALETTE[baseColorIdx + 1]) * colorBlend)
              const blue  = Math.round(GLOW_PALETTE[baseColorIdx + 2] + (GLOW_PALETTE[nextColorIdx + 2] - GLOW_PALETTE[baseColorIdx + 2]) * colorBlend)

              ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`
              ctx.globalAlpha = Math.min(0.95, alpha + glowIntensity * 0.6)
              ctx.fillText(CHAR_SET[charIndices[idx]], renderX, renderY)
              continue
            }
          }

          ctx.fillStyle = '#ffffff'
          ctx.globalAlpha = Math.min(0.7, alpha * 0.8)
          ctx.fillText(CHAR_SET[charIndices[idx]], renderX, renderY)
        }
      }

      ctx.globalAlpha = 1
    }

    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('resize', initGrid)
    }
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'auto',
        zIndex: 0,
        background: '#08090b',
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  )
}
