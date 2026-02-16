export interface Point {
  x: number
  y: number
}

export const SVG_VIEWBOX_WIDTH = 600
export const SVG_VIEWBOX_HEIGHT = 200

/**
 * Perpendicular distance from a point to a line segment (start..end).
 */
function perpendicularDistance(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSq = dx * dx + dy * dy

  if (lengthSq === 0) {
    return Math.sqrt((point.x - start.x) ** 2 + (point.y - start.y) ** 2)
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq
    )
  )
  const projX = start.x + t * dx
  const projY = start.y + t * dy

  return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2)
}

/**
 * Ramer-Douglas-Peucker line simplification.
 * epsilon is in normalized coordinate space (0..1).
 * Default 0.001 preserves fine detail suitable for signatures.
 */
export function simplifyStroke(
  points: Point[],
  epsilon: number = 0.001
): Point[] {
  if (points.length <= 2) return points

  let maxDist = 0
  let maxIndex = 0
  const start = points[0]
  const end = points[points.length - 1]

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], start, end)
    if (dist > maxDist) {
      maxDist = dist
      maxIndex = i
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyStroke(points.slice(0, maxIndex + 1), epsilon)
    const right = simplifyStroke(points.slice(maxIndex), epsilon)
    return [...left.slice(0, -1), ...right]
  }

  return [start, end]
}

/**
 * Convert canvas pixel coordinates to normalized 0..1 range.
 */
export function normalizePoint(
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number
): Point {
  return {
    x: Math.max(0, Math.min(1, x / canvasWidth)),
    y: Math.max(0, Math.min(1, y / canvasHeight)),
  }
}

/**
 * Convert normalized strokes to an SVG path d-attribute string.
 * Uses quadratic Bezier smoothing for natural-looking curves.
 * Coordinates are scaled to the fixed viewBox (600x200).
 */
export function strokesToSvgPath(strokes: Point[][]): string {
  const parts: string[] = []

  for (const stroke of strokes) {
    if (stroke.length < 2) continue

    const scaled = stroke.map((p) => ({
      x: p.x * SVG_VIEWBOX_WIDTH,
      y: p.y * SVG_VIEWBOX_HEIGHT,
    }))

    // Move to first point
    parts.push(`M ${scaled[0].x.toFixed(1)} ${scaled[0].y.toFixed(1)}`)

    if (scaled.length === 2) {
      // Simple line
      parts.push(`L ${scaled[1].x.toFixed(1)} ${scaled[1].y.toFixed(1)}`)
    } else {
      // Quadratic Bezier smoothing: use midpoints as curve endpoints,
      // actual points as control points
      for (let i = 1; i < scaled.length - 1; i++) {
        const midX = (scaled[i].x + scaled[i + 1].x) / 2
        const midY = (scaled[i].y + scaled[i + 1].y) / 2
        parts.push(
          `Q ${scaled[i].x.toFixed(1)} ${scaled[i].y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`
        )
      }
      // Final segment to last point
      const last = scaled[scaled.length - 1]
      const prev = scaled[scaled.length - 2]
      parts.push(
        `Q ${prev.x.toFixed(1)} ${prev.y.toFixed(1)} ${last.x.toFixed(1)} ${last.y.toFixed(1)}`
      )
    }
  }

  return parts.join(' ')
}
