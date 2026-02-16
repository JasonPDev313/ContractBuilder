import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LegalDisclaimerProps {
  className?: string
}

export function LegalDisclaimer({ className }: LegalDisclaimerProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950',
        className
      )}
    >
      <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0 dark:text-amber-400" />
      <p className="text-sm text-amber-800 dark:text-amber-200">
        <strong>Not Legal Advice.</strong> This template and any AI-generated
        content are provided for convenience only and do not constitute legal
        advice. You are responsible for reviewing and modifying all terms.
        Consult qualified legal counsel to confirm compliance with applicable law
        and suitability for your situation.
      </p>
    </div>
  )
}
