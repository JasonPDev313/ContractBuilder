'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { getOrgDefaults, upsertOrgDefaults } from '@/actions/org-defaults'
import { toast } from '@/hooks/use-toast'

interface CustomPolicy {
  name: string
  content: string
}

interface FormData {
  venueName: string
  venueAddress: string
  signerName: string
  signerTitle: string
  signerEmail: string
  signerPhone: string
  defaultDepositPercent: string
  defaultPaymentTerms: string
  defaultCancellationPolicy: string
  defaultWeatherPolicy: string
  defaultAlcoholPolicy: string
  defaultLiabilityTerms: string
  jurisdiction: string
  governingLaw: string
}

const EMPTY_FORM: FormData = {
  venueName: '',
  venueAddress: '',
  signerName: '',
  signerTitle: '',
  signerEmail: '',
  signerPhone: '',
  defaultDepositPercent: '',
  defaultPaymentTerms: '',
  defaultCancellationPolicy: '',
  defaultWeatherPolicy: '',
  defaultAlcoholPolicy: '',
  defaultLiabilityTerms: '',
  jurisdiction: '',
  governingLaw: '',
}

export default function ContractDefaultsPage() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [customPolicies, setCustomPolicies] = useState<CustomPolicy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const result = await getOrgDefaults()
      if (result.success && result.defaults) {
        const d = result.defaults
        setForm({
          venueName: d.venueName || '',
          venueAddress: d.venueAddress || '',
          signerName: d.signerName || '',
          signerTitle: d.signerTitle || '',
          signerEmail: d.signerEmail || '',
          signerPhone: d.signerPhone || '',
          defaultDepositPercent:
            d.defaultDepositPercent != null
              ? String(d.defaultDepositPercent)
              : '',
          defaultPaymentTerms: d.defaultPaymentTerms || '',
          defaultCancellationPolicy: d.defaultCancellationPolicy || '',
          defaultWeatherPolicy: d.defaultWeatherPolicy || '',
          defaultAlcoholPolicy: d.defaultAlcoholPolicy || '',
          defaultLiabilityTerms: d.defaultLiabilityTerms || '',
          jurisdiction: d.jurisdiction || '',
          governingLaw: d.governingLaw || '',
        })
        // Load custom policies from JSON
        const policies = d.customPolicies as CustomPolicy[] | null
        if (policies && Array.isArray(policies)) {
          setCustomPolicies(policies)
        }
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const addCustomPolicy = () => {
    setCustomPolicies((prev) => [...prev, { name: '', content: '' }])
  }

  const updateCustomPolicy = (
    index: number,
    field: 'name' | 'content',
    value: string
  ) => {
    setCustomPolicies((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    )
  }

  const removeCustomPolicy = (index: number) => {
    setCustomPolicies((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Filter out empty custom policies
      const validPolicies = customPolicies.filter(
        (p) => p.name.trim() && p.content.trim()
      )

      const payload = {
        venueName: form.venueName || null,
        venueAddress: form.venueAddress || null,
        signerName: form.signerName || null,
        signerTitle: form.signerTitle || null,
        signerEmail: form.signerEmail || null,
        signerPhone: form.signerPhone || null,
        defaultDepositPercent: form.defaultDepositPercent
          ? parseInt(form.defaultDepositPercent, 10)
          : null,
        defaultPaymentTerms: form.defaultPaymentTerms || null,
        defaultCancellationPolicy: form.defaultCancellationPolicy || null,
        defaultWeatherPolicy: form.defaultWeatherPolicy || null,
        defaultAlcoholPolicy: form.defaultAlcoholPolicy || null,
        defaultLiabilityTerms: form.defaultLiabilityTerms || null,
        customPolicies: validPolicies.length > 0 ? validPolicies : null,
        jurisdiction: form.jurisdiction || null,
        governingLaw: form.governingLaw || null,
      }

      const result = await upsertOrgDefaults(payload)

      if (result.success) {
        // Clean up empty policies in UI after save
        setCustomPolicies(validPolicies)
        toast({
          title: 'Saved',
          description: 'Contract defaults updated successfully.',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to save defaults',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'An error occurred',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Contract Defaults</h2>
          <p className="text-sm text-muted-foreground">
            Set organization-wide defaults that auto-fill when creating new
            contracts. These can be overridden per contract.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Defaults
        </Button>
      </div>

      {/* Venue Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Venue Information</CardTitle>
          <CardDescription>
            Default venue details for your contracts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="venueName">Venue Name</Label>
              <Input
                id="venueName"
                placeholder="e.g., Meadow Brook Country Club"
                value={form.venueName}
                onChange={(e) => handleChange('venueName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venueAddress">Venue Address</Label>
              <Input
                id="venueAddress"
                placeholder="e.g., 123 Fairway Dr, Anytown, ST 12345"
                value={form.venueAddress}
                onChange={(e) => handleChange('venueAddress', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authorized Signer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Authorized Signer</CardTitle>
          <CardDescription>
            Default signer information for contract signatures
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="signerName">Full Name</Label>
              <Input
                id="signerName"
                placeholder="e.g., Jane Smith"
                value={form.signerName}
                onChange={(e) => handleChange('signerName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signerTitle">Title</Label>
              <Input
                id="signerTitle"
                placeholder="e.g., General Manager"
                value={form.signerTitle}
                onChange={(e) => handleChange('signerTitle', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signerEmail">Email</Label>
              <Input
                id="signerEmail"
                type="email"
                placeholder="e.g., jane@meadowbrook.com"
                value={form.signerEmail}
                onChange={(e) => handleChange('signerEmail', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signerPhone">Phone</Label>
              <Input
                id="signerPhone"
                placeholder="e.g., (555) 123-4567"
                value={form.signerPhone}
                onChange={(e) => handleChange('signerPhone', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Defaults</CardTitle>
          <CardDescription>
            Default payment and deposit terms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultDepositPercent">
                Default Deposit Percentage
              </Label>
              <Input
                id="defaultDepositPercent"
                type="number"
                min="0"
                max="100"
                placeholder="e.g., 25"
                value={form.defaultDepositPercent}
                onChange={(e) =>
                  handleChange('defaultDepositPercent', e.target.value)
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultPaymentTerms">Payment Terms</Label>
            <Textarea
              id="defaultPaymentTerms"
              placeholder="e.g., Net 30 from date of invoice. Accepted methods: check, credit card, ACH transfer."
              value={form.defaultPaymentTerms}
              onChange={(e) =>
                handleChange('defaultPaymentTerms', e.target.value)
              }
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultCancellationPolicy">
              Cancellation Policy
            </Label>
            <Textarea
              id="defaultCancellationPolicy"
              placeholder="e.g., Full refund if cancelled 90+ days before event. 50% refund if cancelled 30-89 days before event. No refund within 30 days."
              value={form.defaultCancellationPolicy}
              onChange={(e) =>
                handleChange('defaultCancellationPolicy', e.target.value)
              }
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Policy Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Policy Defaults</CardTitle>
          <CardDescription>
            Standard policies included in your contracts. Add as many as you
            need.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Built-in policy fields */}
          <div className="space-y-2">
            <Label htmlFor="defaultWeatherPolicy">Weather Policy</Label>
            <Textarea
              id="defaultWeatherPolicy"
              placeholder="e.g., In the event of inclement weather, the course reserves the right to modify the event format..."
              value={form.defaultWeatherPolicy}
              onChange={(e) =>
                handleChange('defaultWeatherPolicy', e.target.value)
              }
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultAlcoholPolicy">Alcohol Policy</Label>
            <Textarea
              id="defaultAlcoholPolicy"
              placeholder="e.g., All alcohol must be purchased through the venue's licensed bar service. Outside alcohol is not permitted."
              value={form.defaultAlcoholPolicy}
              onChange={(e) =>
                handleChange('defaultAlcoholPolicy', e.target.value)
              }
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultLiabilityTerms">Liability Terms</Label>
            <Textarea
              id="defaultLiabilityTerms"
              placeholder="e.g., Client assumes responsibility for any damages caused by event attendees to the venue property..."
              value={form.defaultLiabilityTerms}
              onChange={(e) =>
                handleChange('defaultLiabilityTerms', e.target.value)
              }
              rows={4}
            />
          </div>

          {/* Custom policies */}
          {customPolicies.length > 0 && (
            <div className="border-t pt-6 space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                Custom Policies
              </p>
              {customPolicies.map((policy, index) => (
                <div
                  key={index}
                  className="rounded-lg border bg-muted/30 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`policy-name-${index}`}>
                        Policy Name
                      </Label>
                      <Input
                        id={`policy-name-${index}`}
                        placeholder="e.g., Dress Code Policy"
                        value={policy.name}
                        onChange={(e) =>
                          updateCustomPolicy(index, 'name', e.target.value)
                        }
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeCustomPolicy(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`policy-content-${index}`}>
                      Policy Content
                    </Label>
                    <Textarea
                      id={`policy-content-${index}`}
                      placeholder="Enter the policy details..."
                      value={policy.content}
                      onChange={(e) =>
                        updateCustomPolicy(index, 'content', e.target.value)
                      }
                      rows={4}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={addCustomPolicy}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Policy
          </Button>
        </CardContent>
      </Card>

      {/* Legal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legal</CardTitle>
          <CardDescription>
            Default jurisdiction and governing law
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Input
                id="jurisdiction"
                placeholder="e.g., State of Michigan"
                value={form.jurisdiction}
                onChange={(e) => handleChange('jurisdiction', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="governingLaw">Governing Law</Label>
              <Input
                id="governingLaw"
                placeholder="e.g., Laws of the State of Michigan"
                value={form.governingLaw}
                onChange={(e) => handleChange('governingLaw', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom save button */}
      <div className="flex justify-end pb-6">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Defaults
        </Button>
      </div>
    </div>
  )
}
