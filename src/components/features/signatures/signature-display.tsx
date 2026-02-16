import { SVG_VIEWBOX_WIDTH, SVG_VIEWBOX_HEIGHT } from '@/lib/signature-utils'
import { cn } from '@/lib/utils'

interface SignatureDisplayProps {
  svgPath: string
  signerName: string
  className?: string
}

export function SignatureDisplay({
  svgPath,
  signerName,
  className,
}: SignatureDisplayProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-white overflow-hidden',
        className
      )}
    >
      <svg
        viewBox={`0 0 ${SVG_VIEWBOX_WIDTH} ${SVG_VIEWBOX_HEIGHT}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        className="block"
        role="img"
        aria-label={`Signature of ${signerName}`}
      >
        <path
          d={svgPath}
          stroke="#1a1a2e"
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="border-t px-3 py-1.5">
        <p className="text-xs text-muted-foreground italic">{signerName}</p>
      </div>
    </div>
  )
}
