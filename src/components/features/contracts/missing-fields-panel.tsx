'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  ShieldAlert,
  AlertTriangle,
  ListChecks,
  ChevronUp,
  ChevronDown,
  ClipboardEdit,
  X,
} from 'lucide-react'
import {
  getEssentialFields,
  getMissingFields,
  type EssentialField,
} from '@/lib/contract-fields'
import { type ContractType } from '@/lib/contract-blueprints'
import { BulkFillModal } from '@/components/features/ai-generator/bulk-fill-modal'

interface MissingFieldsPanelProps {
  contractType: ContractType | undefined
  extractedData: Record<string, unknown>
  onFieldsUpdate: (data: Record<string, string>) => void
}

export function MissingFieldsPanel({
  contractType,
  extractedData,
  onFieldsUpdate,
}: MissingFieldsPanelProps) {
  const [expanded, setExpanded] = useState(true)
  const [showBulkFill, setShowBulkFill] = useState(false)
  const [bulkFillTab, setBulkFillTab] = useState<
    'required' | 'recommended' | 'optional' | 'all'
  >('required')

  const essentialFields = useMemo(
    () => getEssentialFields(contractType),
    [contractType]
  )

  const missingFields = useMemo(
    () => getMissingFields(contractType, extractedData),
    [contractType, extractedData]
  )

  const totalFields = essentialFields.length
  const filledCount = totalFields - missingFields.all.length
  const totalMissing = missingFields.all.length
  const percentage = totalFields > 0 ? Math.round((filledCount / totalFields) * 100) : 0

  if (totalFields === 0) return null

  return (
    <>
      <div className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Field Completion</span>
            <span className="text-muted-foreground">
              {filledCount}/{totalFields} fields ({percentage}%)
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        {/* Missing fields panel */}
        {totalMissing > 0 && (
          <div
            className={`rounded-lg border p-3 ${
              missingFields.required.length > 0
                ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
                : missingFields.recommended.length > 0
                  ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950'
                  : 'border-border bg-muted/30'
            }`}
          >
            {/* Header with collapse toggle */}
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setExpanded(!expanded)}
            >
              <div className="flex items-center gap-2">
                {missingFields.required.length > 0 ? (
                  <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                ) : missingFields.recommended.length > 0 ? (
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                ) : (
                  <ListChecks className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span
                  className={`text-sm font-semibold ${
                    missingFields.required.length > 0
                      ? 'text-red-800 dark:text-red-200'
                      : missingFields.recommended.length > 0
                        ? 'text-amber-800 dark:text-amber-200'
                        : 'text-foreground'
                  }`}
                >
                  Missing Fields ({totalMissing})
                </span>
                {missingFields.required.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="text-[10px] h-5 px-1.5"
                  >
                    {missingFields.required.length} required
                  </Badge>
                )}
              </div>
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {/* Expandable content */}
            {expanded && (
              <div className="mt-3">
                <Tabs
                  defaultValue={
                    missingFields.required.length > 0
                      ? 'required'
                      : 'recommended'
                  }
                >
                  <TabsList className="w-full h-8 p-0.5">
                    <TabsTrigger
                      value="required"
                      className="text-xs h-7 px-3 gap-1"
                      disabled={missingFields.required.length === 0}
                    >
                      Required
                      {missingFields.required.length > 0 && (
                        <span className="text-xs">
                          ({missingFields.required.length})
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="recommended"
                      className="text-xs h-7 px-3 gap-1"
                      disabled={missingFields.recommended.length === 0}
                    >
                      Recommended
                      {missingFields.recommended.length > 0 && (
                        <span className="text-xs">
                          ({missingFields.recommended.length})
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="optional"
                      className="text-xs h-7 px-3 gap-1"
                      disabled={missingFields.optional.length === 0}
                    >
                      Optional
                      {missingFields.optional.length > 0 && (
                        <span className="text-xs">
                          ({missingFields.optional.length})
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="required" className="mt-2">
                    <FieldList
                      fields={missingFields.required}
                      colorClass="text-red-700 dark:text-red-300"
                    />
                  </TabsContent>

                  <TabsContent value="recommended" className="mt-2">
                    <FieldList
                      fields={missingFields.recommended}
                      colorClass="text-amber-700 dark:text-amber-300"
                    />
                  </TabsContent>

                  <TabsContent value="optional" className="mt-2">
                    <FieldList
                      fields={missingFields.optional}
                      colorClass="text-muted-foreground"
                    />
                  </TabsContent>
                </Tabs>

                {/* Fill Fields button */}
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full ${
                      missingFields.required.length > 0
                        ? 'border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900'
                        : missingFields.recommended.length > 0
                          ? 'border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900'
                          : ''
                    }`}
                    onClick={() => {
                      setBulkFillTab(
                        missingFields.required.length > 0
                          ? 'required'
                          : 'recommended'
                      )
                      setShowBulkFill(true)
                    }}
                  >
                    <ClipboardEdit className="h-4 w-4 mr-2" />
                    Fill Fields
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {totalMissing === 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-3">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                All fields complete
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Fill Modal */}
      <BulkFillModal
        open={showBulkFill}
        onOpenChange={setShowBulkFill}
        fields={essentialFields}
        extractedData={extractedData}
        initialTab={bulkFillTab}
        onSave={onFieldsUpdate}
      />
    </>
  )
}

function FieldList({
  fields,
  colorClass,
}: {
  fields: EssentialField[]
  colorClass: string
}) {
  return (
    <ul className="space-y-1 max-h-36 overflow-y-auto">
      {fields.map((field) => (
        <li
          key={field.key}
          className={`text-xs flex items-center gap-1.5 ${colorClass}`}
        >
          <X className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{field.label}</span>
          {field.description && (
            <span className="text-muted-foreground truncate hidden sm:inline">
              — {field.description}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
