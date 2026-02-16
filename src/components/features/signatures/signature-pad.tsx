'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Undo2, Trash2 } from 'lucide-react'
import {
  normalizePoint,
  simplifyStroke,
  type Point,
} from '@/lib/signature-utils'
import type { SignatureData } from '@/lib/validations/signature'

interface SignaturePadProps {
  onSignatureChange: (data: SignatureData | null) => void
  width?: number
  height?: number
}

const INK_COLOR = '#1a1a2e'
const LINE_WIDTH = 2.5
const PLACEHOLDER_TEXT = 'Sign here'

export function SignaturePad({
  onSignatureChange,
  width = 600,
  height = 200,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [strokes, setStrokes] = useState<Point[][]>([])
  const currentStrokeRef = useRef<Point[]>([])
  const rawPixelStrokeRef = useRef<{ x: number; y: number }[]>([])
  const isDrawingRef = useRef(false)

  const getCanvasRect = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.getBoundingClientRect()
  }, [])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.scale(dpr, dpr)
  }, [])

  const drawPlaceholder = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.save()
    ctx.fillStyle = '#d1d5db'
    ctx.font = '20px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(PLACEHOLDER_TEXT, rect.width / 2, rect.height / 2)

    // Draw baseline
    const baselineY = rect.height * 0.72
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(rect.width * 0.1, baselineY)
    ctx.lineTo(rect.width * 0.9, baselineY)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }, [])

  const redrawAllStrokes = useCallback(
    (strokeList: Point[][]) => {
      clearCanvas()

      if (strokeList.length === 0) {
        drawPlaceholder()
        return
      }

      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const rect = canvas.getBoundingClientRect()

      ctx.strokeStyle = INK_COLOR
      ctx.lineWidth = LINE_WIDTH
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      for (const stroke of strokeList) {
        if (stroke.length < 2) continue
        ctx.beginPath()
        ctx.moveTo(stroke[0].x * rect.width, stroke[0].y * rect.height)
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x * rect.width, stroke[i].y * rect.height)
        }
        ctx.stroke()
      }
    },
    [clearCanvas, drawPlaceholder]
  )

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    clearCanvas()
    drawPlaceholder()
  }, [clearCanvas, drawPlaceholder])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      canvas.setPointerCapture(e.pointerId)
      isDrawingRef.current = true

      const rect = getCanvasRect()
      if (!rect) return

      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const normalized = normalizePoint(x, y, rect.width, rect.height)

      currentStrokeRef.current = [normalized]
      rawPixelStrokeRef.current = [{ x, y }]

      // Clear placeholder on first stroke
      if (strokes.length === 0) {
        clearCanvas()
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.strokeStyle = INK_COLOR
      ctx.lineWidth = LINE_WIDTH
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(x, y)
    },
    [strokes.length, getCanvasRect, clearCanvas]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = getCanvasRect()
      if (!rect) return

      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const normalized = normalizePoint(x, y, rect.width, rect.height)

      currentStrokeRef.current.push(normalized)
      rawPixelStrokeRef.current.push({ x, y })

      // Draw incremental line segment
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const prev = rawPixelStrokeRef.current[rawPixelStrokeRef.current.length - 2]
      ctx.beginPath()
      ctx.moveTo(prev.x, prev.y)
      ctx.lineTo(x, y)
      ctx.stroke()
    },
    [getCanvasRect]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return
      isDrawingRef.current = false

      const canvas = canvasRef.current
      if (canvas) {
        canvas.releasePointerCapture(e.pointerId)
      }

      const rawStroke = currentStrokeRef.current
      if (rawStroke.length < 2) {
        currentStrokeRef.current = []
        rawPixelStrokeRef.current = []
        return
      }

      // Simplify stroke with RDP
      const simplified = simplifyStroke(rawStroke, 0.001)

      const newStrokes = [...strokes, simplified]
      setStrokes(newStrokes)
      onSignatureChange({ strokes: newStrokes })

      currentStrokeRef.current = []
      rawPixelStrokeRef.current = []
    },
    [strokes, onSignatureChange]
  )

  const handleClear = useCallback(() => {
    setStrokes([])
    onSignatureChange(null)
    clearCanvas()
    drawPlaceholder()
  }, [onSignatureChange, clearCanvas, drawPlaceholder])

  const handleUndo = useCallback(() => {
    if (strokes.length === 0) return
    const newStrokes = strokes.slice(0, -1)
    setStrokes(newStrokes)
    onSignatureChange(newStrokes.length > 0 ? { strokes: newStrokes } : null)
    redrawAllStrokes(newStrokes)
  }, [strokes, onSignatureChange, redrawAllStrokes])

  return (
    <div className="space-y-2">
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            aspectRatio: `${width} / ${height}`,
            touchAction: 'none',
            cursor: 'crosshair',
            display: 'block',
          }}
          aria-label="Signature drawing area"
          role="img"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Draw your signature using your mouse, finger, or stylus
        </p>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={strokes.length === 0}
          >
            <Undo2 className="h-3.5 w-3.5 mr-1" />
            Undo
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={strokes.length === 0}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  )
}
