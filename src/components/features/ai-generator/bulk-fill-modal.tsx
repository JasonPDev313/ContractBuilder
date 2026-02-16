'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShieldAlert, AlertTriangle, CircleDot, Save } from 'lucide-react'
import type { EssentialField, FieldTier } from '@/lib/contract-fields'

interface BulkFillModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fields: EssentialField[]
  extractedData: Record<string, unknown>
  onSave: (data: Record<string, string>) => void
  initialTab?: 'required' | 'recommended' | 'optional' | 'all'
}

function groupFieldsBySection(fields: EssentialField[]): Record<string, EssentialField[]> {
  const groups: Record<string, EssentialField[]> = {}
  for (const field of fields) {
    const section = field.section || 'Other'
    if (!groups[section]) groups[section] = []
    groups[section].push(field)
  }
  return groups
}

function tierBadge(tier: FieldTier) {
  switch (tier) {
    case 'A':
      return (
        <Badge variant="destructive" className="text-[10px] h-4 px-1">
          Required
        </Badge>
      )
    case 'B':
      return (
        <Badge variant="outline" className="text-[10px] h-4 px-1 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
          Recommended
        </Badge>
      )
    case 'C':
      return (
        <Badge variant="outline" className="text-[10px] h-4 px-1 text-muted-foreground">
          Optional
        </Badge>
      )
  }
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: EssentialField
  value: string
  onChange: (value: string) => void
}) {
  const inputType = field.inputType || 'text'

  if (inputType === 'select' && field.selectOptions) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder={`Select ${field.label.toLowerCase()}...`} />
        </SelectTrigger>
        <SelectContent>
          {field.selectOptions.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (inputType === 'textarea') {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.description || `Enter ${field.label.toLowerCase()}`}
        rows={3}
        className="text-sm"
      />
    )
  }

  if (inputType === 'date') {
    return (
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9"
      />
    )
  }

  if (inputType === 'number') {
    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.description || `Enter ${field.label.toLowerCase()}`}
        className="h-9"
      />
    )
  }

  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.description || `Enter ${field.label.toLowerCase()}`}
      className="h-9"
    />
  )
}

function FieldList({
  fields,
  formData,
  existingData,
  onChange,
}: {
  fields: EssentialField[]
  formData: Record<string, string>
  existingData: Record<string, unknown>
  onChange: (key: string, value: string) => void
}) {
  const grouped = useMemo(() => groupFieldsBySection(fields), [fields])

  if (fields.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        All fields in this category are filled.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([section, sectionFields]) => (
        <div key={section}>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {section}
          </h4>
          <div className="space-y-3">
            {sectionFields.map((field) => {
              const existingValue = existingData[field.key]
              const hasExisting = existingValue !== undefined && existingValue !== null && existingValue !== ''

              return (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`bulk-${field.key}`} className="text-sm">
                      {field.label}
                    </Label>
                    {tierBadge(field.tier)}
                    {hasExisting && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1">
                        Filled
                      </Badge>
                    )}
                  </div>
                  <FieldInput
                    field={field}
                    value={formData[field.key] ?? (hasExisting ? String(existingValue) : '')}
                    onChange={(value) => onChange(field.key, value)}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export function BulkFillModal({
  open,
  onOpenChange,
  fields,
  extractedData,
  onSave,
  initialTab = 'required',
}: BulkFillModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({})

  const isMissing = (field: EssentialField) => {
    const value = extractedData[field.key]
    return value === undefined || value === null || value === ''
  }

  const missingRequired = useMemo(() => fields.filter((f) => f.tier === 'A' && isMissing(f)), [fields, extractedData])
  const missingRecommended = useMemo(() => fields.filter((f) => f.tier === 'B' && isMissing(f)), [fields, extractedData])
  const missingOptional = useMemo(() => fields.filter((f) => f.tier === 'C' && isMissing(f)), [fields, extractedData])
  const allMissing = useMemo(() => [...missingRequired, ...missingRecommended, ...missingOptional], [missingRequired, missingRecommended, missingOptional])

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    // Only save fields that have values
    const filled: Record<string, string> = {}
    for (const [key, value] of Object.entries(formData)) {
      if (value.trim()) {
        filled[key] = value.trim()
      }
    }
    if (Object.keys(filled).length > 0) {
      onSave(filled)
    }
    setFormData({})
    onOpenChange(false)
  }

  const handleCancel = () => {
    setFormData({})
    onOpenChange(false)
  }

  const filledCount = Object.values(formData).filter((v) => v.trim()).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Fill Missing Fields</DialogTitle>
          <DialogDescription>
            Fill in contract fields directly. These will be added to your extracted data.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={initialTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="required" className="text-xs gap-1">
              <ShieldAlert className="h-3 w-3" />
              Required
              {missingRequired.length > 0 && (
                <Badge variant="destructive" className="h-4 w-4 p-0 text-[10px] flex items-center justify-center rounded-full ml-0.5">
                  {missingRequired.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="recommended" className="text-xs gap-1">
              <AlertTriangle className="h-3 w-3" />
              Recommended
              {missingRecommended.length > 0 && (
                <Badge variant="outline" className="h-4 w-4 p-0 text-[10px] flex items-center justify-center rounded-full ml-0.5 border-amber-300">
                  {missingRecommended.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="optional" className="text-xs gap-1">
              <CircleDot className="h-3 w-3" />
              Optional
              {missingOptional.length > 0 && (
                <span className="text-[10px] text-muted-foreground ml-0.5">
                  {missingOptional.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">
              All ({allMissing.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-3 pr-1" style={{ maxHeight: 'calc(85vh - 220px)' }}>
            <TabsContent value="required" className="mt-0">
              <FieldList
                fields={missingRequired}
                formData={formData}
                existingData={extractedData}
                onChange={handleChange}
              />
            </TabsContent>
            <TabsContent value="recommended" className="mt-0">
              <FieldList
                fields={missingRecommended}
                formData={formData}
                existingData={extractedData}
                onChange={handleChange}
              />
            </TabsContent>
            <TabsContent value="optional" className="mt-0">
              <FieldList
                fields={missingOptional}
                formData={formData}
                existingData={extractedData}
                onChange={handleChange}
              />
            </TabsContent>
            <TabsContent value="all" className="mt-0">
              <FieldList
                fields={allMissing}
                formData={formData}
                existingData={extractedData}
                onChange={handleChange}
              />
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={filledCount === 0}>
            <Save className="h-4 w-4 mr-2" />
            Save {filledCount > 0 ? `(${filledCount} field${filledCount > 1 ? 's' : ''})` : 'Fields'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
