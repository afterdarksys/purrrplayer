import { useEffect, useRef } from 'react'
import type { VisualizerMode } from '@/lib/prefs'

interface VisualizerProps {
  analyser: AnalyserNode | null
  mode: VisualizerMode
  active: boolean
}

export function Visualizer({ analyser, mode, active }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const frequencyData = new Uint8Array(analyser?.frequencyBinCount || 256)
    const timeData = new Uint8Array(analyser?.fftSize || 1024)

    function draw() {
      if (!canvas || !context) return
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      context.clearRect(0, 0, width, height)
      context.fillStyle = 'rgba(6, 8, 8, 0.82)'
      context.fillRect(0, 0, width, height)

      if (!analyser || !active) {
        drawIdle(context, width, height)
      } else if (mode === 'waveform') {
        analyser.getByteTimeDomainData(timeData)
        drawScope(context, timeData, width, height)
      } else {
        analyser.getByteFrequencyData(frequencyData)
        mode === 'bars'
          ? drawBars(context, frequencyData, width, height)
          : drawSpectrum(context, frequencyData, width, height)
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    rafRef.current = requestAnimationFrame(draw)

    return () => {
      observer.disconnect()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [analyser, active, mode])

  return <canvas ref={canvasRef} className="visualizer" aria-label="Audio visualization" />
}

function drawIdle(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)'
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let x = 0; x < width; x += 10) {
    const y = height * 0.5 + Math.sin(x * 0.04) * 8
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.stroke()
}

function drawSpectrum(ctx: CanvasRenderingContext2D, data: Uint8Array, width: number, height: number) {
  const bars = 72
  const step = Math.max(1, Math.floor(data.length / bars))
  const barWidth = width / bars
  for (let i = 0; i < bars; i++) {
    const value = data[i * step] / 255
    const barHeight = Math.max(3, value * height * 0.92)
    const hue = 38 + value * 78
    ctx.fillStyle = `hsla(${hue}, 92%, ${52 + value * 18}%, 0.9)`
    ctx.fillRect(i * barWidth + 1, height - barHeight, Math.max(2, barWidth - 3), barHeight)
  }
}

function drawBars(ctx: CanvasRenderingContext2D, data: Uint8Array, width: number, height: number) {
  const bars = 28
  const step = Math.max(1, Math.floor(data.length / bars))
  const barWidth = width / bars
  for (let i = 0; i < bars; i++) {
    const value = data[i * step] / 255
    const barHeight = Math.max(6, value * height)
    ctx.fillStyle = i % 2 ? 'rgba(34, 197, 94, 0.82)' : 'rgba(245, 158, 11, 0.86)'
    ctx.fillRect(i * barWidth + 4, height - barHeight, Math.max(4, barWidth - 8), barHeight)
  }
}

function drawScope(ctx: CanvasRenderingContext2D, data: Uint8Array, width: number, height: number) {
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.95)'
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let i = 0; i < data.length; i++) {
    const x = (i / (data.length - 1)) * width
    const y = (data[i] / 255) * height
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.stroke()
}
