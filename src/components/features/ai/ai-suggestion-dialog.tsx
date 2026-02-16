'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { Sparkles, Copy, Check, Loader2 } from 'lucide-react'
import { suggestContractLanguage } from '@/actions/ai-assistant'
import { LegalDisclaimer } from '@/components/ui/legal-disclaimer'

interface AISuggestionDialogProps {
  sectionTitle: string
  existingContent?: string
  contractSectionId?: string
  onInsert: (text: string) => void
  onAppend: (text: string) => void
}

export function AISuggestionDialog({
  sectionTitle,
  existingContent,
  contractSectionId,
  onInsert,
  onAppend,
}: AISuggestionDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tone, setTone] = useState<string>('neutral')
  const [jurisdiction, setJurisdiction] = useState('')
  const [riskPosture, setRiskPosture] = useState<string>('balanced')
  const [clauseType, setClauseType] = useState('')
  const [keyFacts, setKeyFacts] = useState(existingContent || '')
  const [suggestion, setSuggestion] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  // Refresh keyFacts when dialog opens with latest content
  useEffect(() => {
    if (open) {
      setKeyFacts(existingContent || '')
      setSuggestion(null)
    }
  }, [open, existingContent])

  async function handleSuggest() {
    setLoading(true)
    setSuggestion(null)

    try {
      const result = await suggestContractLanguage({
        contractSectionId,
        sectionTitle,
        existingContent,
        tone: tone as any,
        jurisdiction: jurisdiction || undefined,
        clauseType: clauseType || undefined,
        riskPosture: riskPosture as any,
        keyFacts: keyFacts || undefined,
      })

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to generate suggestion',
        })
        return
      }

      setSuggestion(result)
      toast({
        title: 'Success',
        description: 'AI suggestion generated successfully',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    } finally {
      setLoading(false)
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast({
      title: 'Copied',
      description: 'Suggestion copied to clipboard',
    })
    setTimeout(() => setCopied(false), 2000)
  }

  function handleInsert() {
    if (suggestion?.suggestion?.text) {
      onInsert(suggestion.suggestion.text)
      setOpen(false)
      setSuggestion(null)
      toast({
        title: 'Inserted',
        description: 'Suggestion inserted into section',
      })
    }
  }

  function handleAppend() {
    if (suggestion?.suggestion?.text) {
      onAppend(suggestion.suggestion.text)
      setOpen(false)
      setSuggestion(null)
      toast({
        title: 'Appended',
        description: 'Suggestion added to section',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          Suggest Language
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Contract Language Suggestion</DialogTitle>
          <DialogDescription>
            Get AI-powered suggestions for contract language.
          </DialogDescription>
        </DialogHeader>
        <LegalDisclaimer />

        {!suggestion ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Section: {sectionTitle}</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger id="tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="firm">Firm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskPosture">Risk Posture</Label>
                <Select value={riskPosture} onValueChange={setRiskPosture}>
                  <SelectTrigger id="riskPosture">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="seller-favorable">
                      Seller-Favorable
                    </SelectItem>
                    <SelectItem value="customer-favorable">
                      Customer-Favorable
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jurisdiction">Jurisdiction (Optional)</Label>
              <Input
                id="jurisdiction"
                placeholder="e.g., Michigan, United States"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clauseType">Clause Type (Optional)</Label>
              <Input
                id="clauseType"
                placeholder="e.g., Jurisdiction, Payment Terms, Termination"
                value={clauseType}
                onChange={(e) => setClauseType(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyFacts">
                Key Facts to Include (Optional)
              </Label>
              <Textarea
                id="keyFacts"
                placeholder="e.g., Golf course in Michigan, net 15 payment terms, 1.5% late fee"
                rows={3}
                value={keyFacts}
                onChange={(e) => setKeyFacts(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSuggest} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Suggestion
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Suggested Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Suggested Language
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(suggestion.suggestion.text)}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="whitespace-pre-wrap">{suggestion.suggestion.text}</p>
              </div>
            </div>

            {/* Rationale */}
            {suggestion.suggestion.rationale && (
              <div className="space-y-2">
                <Label className="text-base font-semibold">Why This Works</Label>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {suggestion.suggestion.rationale.map(
                    (point: string, idx: number) => (
                      <li key={idx}>{point}</li>
                    )
                  )}
                </ul>
              </div>
            )}

            {/* Alternatives */}
            {(suggestion.suggestion.alternatives?.shorter ||
              suggestion.suggestion.alternatives?.stricter) && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Alternatives</Label>

                {suggestion.suggestion.alternatives.shorter && (
                  <div className="space-y-2">
                    <Label className="text-sm">Shorter Version</Label>
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      <p className="whitespace-pre-wrap">
                        {suggestion.suggestion.alternatives.shorter}
                      </p>
                    </div>
                  </div>
                )}

                {suggestion.suggestion.alternatives.stricter && (
                  <div className="space-y-2">
                    <Label className="text-sm">Stricter Version</Label>
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      <p className="whitespace-pre-wrap">
                        {suggestion.suggestion.alternatives.stricter}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Usage Info */}
            {suggestion.usage && (
              <div className="text-xs text-muted-foreground">
                Model: {suggestion.usage.model} | Tokens:{' '}
                {suggestion.usage.totalTokens} | Cost: $
                {(suggestion.usage.estimatedCostCents / 100).toFixed(4)}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleInsert} className="flex-1">
                Replace Section
              </Button>
              <Button onClick={handleAppend} variant="outline" className="flex-1">
                Append to Section
              </Button>
              <Button
                onClick={() => handleCopy(suggestion.suggestion.text)}
                variant="outline"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <Button
              onClick={() => setSuggestion(null)}
              variant="ghost"
              className="w-full"
            >
              Try Different Options
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
