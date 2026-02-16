'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { Sparkles, Loader2 } from 'lucide-react'
import { generateContractFromPrompt } from '@/actions/ai-contract-generation'
import { LegalDisclaimer } from '@/components/ui/legal-disclaimer'
import { getContractTypes, type ContractType } from '@/lib/contract-blueprints'

export function GenerateContractDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'basic' | 'terms' | 'advanced'>('basic')

  // Form state
  const [contractTypeEnum, setContractTypeEnum] = useState<ContractType>('GOLF_OUTING')
  const [contractType, setContractType] = useState('Golf Outing Contract')
  const [jurisdiction, setJurisdiction] = useState('Michigan, United States')
  const [tone, setTone] = useState<string>('neutral')
  const [riskPosture, setRiskPosture] = useState<string>('balanced')

  // Parties
  const [venueName, setVenueName] = useState('')
  const [clientName, setClientName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')

  // Key terms
  const [pricing, setPricing] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [depositDueDate, setDepositDueDate] = useState('')
  const [paymentSchedule, setPaymentSchedule] = useState('')
  const [alcoholPolicy, setAlcoholPolicy] = useState('')
  const [cancellationPolicy, setCancellationPolicy] = useState('')
  const [weatherPolicy, setWeatherPolicy] = useState('')
  const [liabilityTerms, setLiabilityTerms] = useState('')
  const [additionalTerms, setAdditionalTerms] = useState('')

  async function handleGenerate() {
    if (!contractTypeEnum || !contractType || !jurisdiction) {
      toast({
        variant: 'destructive',
        title: 'Missing required fields',
        description: 'Contract type and jurisdiction are required',
      })
      return
    }

    setLoading(true)

    try {
      const result = await generateContractFromPrompt({
        contractTypeEnum,
        contractType,
        jurisdiction,
        tone,
        riskPosture,
        venueName: venueName || undefined,
        clientName: clientName || undefined,
        eventDate: eventDate || undefined,
        location: location || undefined,
        pricing: pricing || undefined,
        depositAmount: depositAmount || undefined,
        depositDueDate: depositDueDate || undefined,
        paymentSchedule: paymentSchedule || undefined,
        alcoholPolicy: alcoholPolicy || undefined,
        cancellationPolicy: cancellationPolicy || undefined,
        weatherPolicy: weatherPolicy || undefined,
        liabilityTerms: liabilityTerms || undefined,
        additionalTerms: additionalTerms || undefined,
      })

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to generate contract',
        })
        return
      }

      toast({
        title: 'Contract generated!',
        description: `Created ${result.sectionCount} sections. Redirecting to editor...`,
      })

      setOpen(false)
      router.push(`/contracts/${result.contractId}`)
      router.refresh()
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Sparkles className="h-5 w-5 mr-2" />
          Generate Contract with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Full Contract with AI</DialogTitle>
          <DialogDescription>
            Generate a complete contract using AI assistance.
          </DialogDescription>
        </DialogHeader>
        <LegalDisclaimer />

        <div className="space-y-6">
          {/* Step navigation */}
          <div className="flex gap-2 border-b pb-2">
            <Button
              variant={step === 'basic' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStep('basic')}
            >
              1. Basics
            </Button>
            <Button
              variant={step === 'terms' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStep('terms')}
            >
              2. Terms
            </Button>
            <Button
              variant={step === 'advanced' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStep('advanced')}
            >
              3. Advanced
            </Button>
          </div>

          {/* Step: Basic info */}
          {step === 'basic' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contractTypeEnum">
                  Contract Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={contractTypeEnum}
                  onValueChange={(value: ContractType) => {
                    setContractTypeEnum(value)
                    const types = getContractTypes()
                    const selected = types.find((t) => t.value === value)
                    if (selected) {
                      setContractType(selected.label + ' Contract')
                    }
                  }}
                >
                  <SelectTrigger id="contractTypeEnum">
                    <SelectValue placeholder="Select contract type" />
                  </SelectTrigger>
                  <SelectContent>
                    {getContractTypes().map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{type.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {type.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jurisdiction">
                  Jurisdiction <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="jurisdiction"
                  placeholder="e.g., Michigan, United States"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                />
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
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
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
                      <SelectItem value="venue-favorable">
                        Venue-Favorable
                      </SelectItem>
                      <SelectItem value="client-favorable">
                        Client-Favorable
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="venueName">Venue Name</Label>
                  <Input
                    id="venueName"
                    placeholder="Optional"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    placeholder="Optional"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Event Location</Label>
                  <Input
                    id="location"
                    placeholder="Optional"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={() => setStep('terms')} className="w-full">
                Next: Key Terms
              </Button>
            </div>
          )}

          {/* Step: Terms */}
          {step === 'terms' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricing">Pricing</Label>
                  <Input
                    id="pricing"
                    placeholder="e.g., $85 per person or $2500 flat fee"
                    value={pricing}
                    onChange={(e) => setPricing(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Deposit Amount</Label>
                  <Input
                    id="depositAmount"
                    placeholder="e.g., 50% upfront"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="depositDueDate">Deposit Due Date</Label>
                  <Input
                    id="depositDueDate"
                    placeholder="e.g., 30 days before event"
                    value={depositDueDate}
                    onChange={(e) => setDepositDueDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentSchedule">Payment Schedule</Label>
                  <Input
                    id="paymentSchedule"
                    placeholder="e.g., Net 15 days"
                    value={paymentSchedule}
                    onChange={(e) => setPaymentSchedule(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
                <Textarea
                  id="cancellationPolicy"
                  placeholder="e.g., Full refund if cancelled 30+ days before, 50% if 7-30 days"
                  rows={2}
                  value={cancellationPolicy}
                  onChange={(e) => setCancellationPolicy(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weatherPolicy">Weather Policy</Label>
                <Textarea
                  id="weatherPolicy"
                  placeholder="e.g., Reschedule within 90 days, no refund"
                  rows={2}
                  value={weatherPolicy}
                  onChange={(e) => setWeatherPolicy(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alcoholPolicy">Alcohol Policy</Label>
                <Textarea
                  id="alcoholPolicy"
                  placeholder="e.g., No outside alcohol, cash bar only"
                  rows={2}
                  value={alcoholPolicy}
                  onChange={(e) => setAlcoholPolicy(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('basic')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep('advanced')}
                  className="flex-1"
                >
                  Next: Advanced
                </Button>
              </div>
            </div>
          )}

          {/* Step: Advanced */}
          {step === 'advanced' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="liabilityTerms">
                  Liability/Indemnity Terms
                </Label>
                <Textarea
                  id="liabilityTerms"
                  placeholder="Optional: Specific liability or indemnification requirements"
                  rows={3}
                  value={liabilityTerms}
                  onChange={(e) => setLiabilityTerms(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalTerms">
                  Additional Terms / Context
                </Label>
                <Textarea
                  id="additionalTerms"
                  placeholder="Any other important terms, conditions, or context for the AI to include"
                  rows={4}
                  value={additionalTerms}
                  onChange={(e) => setAdditionalTerms(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('terms')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Contract
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
