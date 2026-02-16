'use client'

import { useState, useMemo, Fragment } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Check,
  X,
  Sparkles,
  Loader2,
  FileText,
  Save,
  ScrollText,
  ListChecks,
  MessageSquare,
  ShieldAlert,
  AlertTriangle,
  ClipboardEdit,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { generateContractFromConversation } from '@/actions/ai-conversations'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { type ContractType } from '@/lib/contract-blueprints'
import {
  getEssentialFields,
  checkFieldCompleteness,
  validateContractForExecution,
  getMissingFields,
  type EssentialField,
  type FieldTier,
} from '@/lib/contract-fields'
import { getDefaultSections } from '@/lib/default-template-sections'
import {
  getVariableSegments,
  getFilledVariableCount,
} from '@/lib/template-variable-mapping'

type ViewMode = 'preview' | 'document' | 'summary'

interface ContractPreviewPanelProps {
  conversationId: string
  contractType?: ContractType
  extractedData: Record<string, unknown>
  isReadyToGenerate: boolean
  generatedContract?: {
    id: string
    title: string
    sections: Array<{
      id: string
      title: string
      body: string
      order: number
    }>
  }
  onGenerateComplete: (contractId: string) => void
  onSendMessage?: (message: string) => void
  onOpenBulkFill?: (tab?: 'required' | 'recommended' | 'optional' | 'all') => void
  onSaveAsTemplate?: () => void
}

function VariableText({
  text,
  extractedData,
}: {
  text: string
  extractedData: Record<string, unknown>
}) {
  const segments = useMemo(
    () => getVariableSegments(text, extractedData),
    [text, extractedData]
  )

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'filled') {
          return (
            <span key={i} className="font-medium text-foreground bg-green-100 dark:bg-green-900/30 px-0.5 rounded">
              {seg.content}
            </span>
          )
        }
        if (seg.type === 'unfilled') {
          return (
            <span key={i} className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-0.5 rounded text-xs font-mono">
              {seg.content}
            </span>
          )
        }
        return <Fragment key={i}>{seg.content}</Fragment>
      })}
    </>
  )
}

export function ContractPreviewPanel({
  conversationId,
  contractType,
  extractedData,
  isReadyToGenerate,
  generatedContract,
  onGenerateComplete,
  onSendMessage,
  onOpenBulkFill,
  onSaveAsTemplate,
}: ContractPreviewPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [showValidationBlock, setShowValidationBlock] = useState(false)
  const [missingFieldsExpanded, setMissingFieldsExpanded] = useState(true)
  const router = useRouter()

  const essentialFields = useMemo(
    () => getEssentialFields(contractType),
    [contractType]
  )

  const { completedCount, totalCount } = useMemo(() => {
    if (!contractType) {
      return { completedCount: 0, totalCount: essentialFields.length }
    }
    return checkFieldCompleteness(contractType, extractedData)
  }, [contractType, extractedData, essentialFields])

  const progressPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  // Get the default sections for the contract type
  const defaultSections = useMemo(() => {
    return getDefaultSections(contractType) || []
  }, [contractType])

  // Execution validation
  const executionValidation = useMemo(
    () => validateContractForExecution(contractType, extractedData),
    [contractType, extractedData]
  )

  // Missing fields by tier
  const missingFields = useMemo(
    () => getMissingFields(contractType, extractedData),
    [contractType, extractedData]
  )

  const totalMissing = missingFields.all.length

  const handleGenerate = async () => {
    // Gate: block if Tier A fields are missing
    if (!executionValidation.canExecute) {
      setShowValidationBlock(true)
      toast({
        variant: 'destructive',
        title: 'Missing Required Fields',
        description: `${executionValidation.missingRequired.length} required field(s) must be provided before generating.`,
      })
      return
    }

    // Warn about Tier B fields but allow proceeding
    if (executionValidation.warnings.length > 0) {
      const proceed = confirm(
        `${executionValidation.warnings.length} recommended field(s) are missing:\n\n${executionValidation.warnings.map((f) => `• ${f.label}`).join('\n')}\n\nDo you want to continue anyway?`
      )
      if (!proceed) return
    }

    setIsGenerating(true)

    try {
      const result = await generateContractFromConversation({
        conversationId,
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
        description: `Created ${result.sectionCount} sections successfully.`,
      })

      onGenerateComplete(result.contractId!)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'An error occurred',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveDraft = () => {
    if (generatedContract) {
      router.push(`/contracts/${generatedContract.id}`)
    }
  }

  const handleSaveAsTemplate = () => {
    if (onSaveAsTemplate) {
      onSaveAsTemplate()
    } else if (generatedContract) {
      router.push(`/contracts/${generatedContract.id}`)
    }
  }

  // Show generated contract
  if (generatedContract) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold mb-2">{generatedContract.title}</h2>
          {contractType && (
            <Badge variant="secondary" className="mb-4">
              {contractType.replace('_', ' ')}
            </Badge>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <Accordion
            type="multiple"
            defaultValue={generatedContract.sections.map((s) => s.id)}
          >
            {generatedContract.sections.map((section) => (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{section.order + 1}</Badge>
                    <span className="font-medium">{section.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap">{section.body}</div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="p-6 border-t space-y-2">
          <Button onClick={handleSaveDraft} className="w-full" size="lg">
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          <Button
            onClick={handleSaveAsTemplate}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <FileText className="h-4 w-4 mr-2" />
            Save as Template
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with view toggle */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Contract Details</h3>
            {contractType && (
              <Badge variant="secondary" className="mt-1">
                {contractType.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode('preview')}
              title="Live Preview"
            >
              <FileText className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'document' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode('document')}
              title="Full Document"
            >
              <ScrollText className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'summary' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode('summary')}
              title="Summary"
            >
              <ListChecks className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {completedCount} of {totalCount} fields
            </span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-1.5" />
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'preview' && (
          <LivePreviewView
            sections={defaultSections}
            extractedData={extractedData}
            onSendMessage={onSendMessage}
          />
        )}
        {viewMode === 'document' && (
          <FullDocumentView
            sections={defaultSections}
            extractedData={extractedData}
          />
        )}
        {viewMode === 'summary' && (
          <SummaryView
            essentialFields={essentialFields}
            extractedData={extractedData}
          />
        )}
      </div>

      {/* Missing Fields Panel + Generate button */}
      <div className="border-t">
        {totalMissing > 0 && (
          <div className="px-4 pt-3">
            <div className={`rounded-lg border p-3 ${
              missingFields.required.length > 0
                ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
                : missingFields.recommended.length > 0
                  ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950'
                  : 'border-border bg-muted/30'
            }`}>
              {/* Header with collapse toggle */}
              <button
                className="flex items-center justify-between w-full"
                onClick={() => setMissingFieldsExpanded(!missingFieldsExpanded)}
              >
                <div className="flex items-center gap-2">
                  {missingFields.required.length > 0 ? (
                    <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  ) : missingFields.recommended.length > 0 ? (
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  ) : (
                    <ListChecks className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className={`text-xs font-semibold ${
                    missingFields.required.length > 0
                      ? 'text-red-800 dark:text-red-200'
                      : missingFields.recommended.length > 0
                        ? 'text-amber-800 dark:text-amber-200'
                        : 'text-foreground'
                  }`}>
                    Missing Fields ({totalMissing})
                  </span>
                  {missingFields.required.length > 0 && (
                    <Badge variant="destructive" className="text-[10px] h-4 px-1">
                      {missingFields.required.length} required
                    </Badge>
                  )}
                </div>
                {missingFieldsExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              {/* Expandable content */}
              {missingFieldsExpanded && (
                <div className="mt-2">
                  <Tabs defaultValue={missingFields.required.length > 0 ? 'required' : 'recommended'}>
                    <TabsList className="w-full h-7 p-0.5">
                      <TabsTrigger value="required" className="text-[10px] h-6 px-2 gap-1" disabled={missingFields.required.length === 0}>
                        Required
                        {missingFields.required.length > 0 && (
                          <span className="text-[10px]">({missingFields.required.length})</span>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="recommended" className="text-[10px] h-6 px-2 gap-1" disabled={missingFields.recommended.length === 0}>
                        Recommended
                        {missingFields.recommended.length > 0 && (
                          <span className="text-[10px]">({missingFields.recommended.length})</span>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="optional" className="text-[10px] h-6 px-2 gap-1" disabled={missingFields.optional.length === 0}>
                        Optional
                        {missingFields.optional.length > 0 && (
                          <span className="text-[10px]">({missingFields.optional.length})</span>
                        )}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="required" className="mt-1.5">
                      <ul className="space-y-1 max-h-28 overflow-y-auto">
                        {missingFields.required.map((field) => (
                          <li
                            key={field.key}
                            className="text-xs text-red-700 dark:text-red-300 flex items-center gap-1.5"
                          >
                            <X className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{field.label}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>

                    <TabsContent value="recommended" className="mt-1.5">
                      <ul className="space-y-1 max-h-28 overflow-y-auto">
                        {missingFields.recommended.map((field) => (
                          <li
                            key={field.key}
                            className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5"
                          >
                            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{field.label}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>

                    <TabsContent value="optional" className="mt-1.5">
                      <ul className="space-y-1 max-h-28 overflow-y-auto">
                        {missingFields.optional.map((field) => (
                          <li
                            key={field.key}
                            className="text-xs text-muted-foreground flex items-center gap-1.5"
                          >
                            <X className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{field.label}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                  </Tabs>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-2">
                    {onOpenBulkFill && (
                      <Button
                        variant="outline"
                        size="sm"
                        className={`flex-1 h-7 text-xs ${
                          missingFields.required.length > 0
                            ? 'border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900'
                            : 'border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900'
                        }`}
                        onClick={() => onOpenBulkFill(
                          missingFields.required.length > 0 ? 'required' : 'recommended'
                        )}
                      >
                        <ClipboardEdit className="h-3 w-3 mr-1" />
                        Fill Fields
                      </Button>
                    )}
                    {onSendMessage && (
                      <Button
                        variant="outline"
                        size="sm"
                        className={`flex-1 h-7 text-xs ${
                          missingFields.required.length > 0
                            ? 'border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900'
                            : 'border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900'
                        }`}
                        onClick={() => {
                          const fields = missingFields.required.length > 0
                            ? missingFields.required
                            : missingFields.recommended
                          onSendMessage(
                            `I need to provide the following information: ${fields.map((f) => f.label).join(', ')}.`
                          )
                        }}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Ask AI
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="p-4">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating Contract...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Contract
              </>
            )}
          </Button>
          {!executionValidation.canExecute && (
            <p className="text-xs text-red-600 dark:text-red-400 text-center mt-2">
              Provide all required fields before generating
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ──────────── View 1: Live Preview (Accordion) ──────────── */

function LivePreviewView({
  sections,
  extractedData,
  onSendMessage,
}: {
  sections: Array<{ title: string; body: string; order: number }>
  extractedData: Record<string, unknown>
  onSendMessage?: (message: string) => void
}) {
  if (sections.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        No default sections available for this contract type.
      </div>
    )
  }

  return (
    <div className="p-4">
      <Accordion type="multiple" className="space-y-2">
        {sections.map((section) => {
          const { filled, total } = getFilledVariableCount(
            section.body,
            extractedData
          )

          return (
            <AccordionItem
              key={section.order}
              value={`section-${section.order}`}
              className="border rounded-lg px-3"
            >
              <AccordionTrigger className="text-left hover:no-underline py-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge
                    variant="outline"
                    className="flex-shrink-0 text-xs h-5 w-5 p-0 flex items-center justify-center"
                  >
                    {section.order + 1}
                  </Badge>
                  <span className="text-sm font-medium truncate">
                    {section.title}
                  </span>
                  {total > 0 && (
                    <Badge
                      variant={filled === total ? 'default' : 'secondary'}
                      className="flex-shrink-0 text-xs ml-auto mr-2"
                    >
                      {filled}/{total}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground pb-2">
                  <VariableText
                    text={section.body}
                    extractedData={extractedData}
                  />
                </div>
                {onSendMessage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs mt-1 h-7"
                    onClick={() =>
                      onSendMessage(
                        `Let's work on the "${section.title}" section.`
                      )
                    }
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Ask AI about this section
                  </Button>
                )}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}

/* ──────────── View 2: Full Document ──────────── */

function FullDocumentView({
  sections,
  extractedData,
}: {
  sections: Array<{ title: string; body: string; order: number }>
  extractedData: Record<string, unknown>
}) {
  if (sections.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        No default sections available for this contract type.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {sections.map((section) => (
        <div key={section.order}>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs h-5 w-5 p-0 flex items-center justify-center flex-shrink-0"
            >
              {section.order + 1}
            </Badge>
            {section.title}
          </h4>
          <div className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground pl-7">
            <VariableText text={section.body} extractedData={extractedData} />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ──────────── View 3: Summary (Field Checklist) ──────────── */

function SummaryView({
  essentialFields,
  extractedData,
}: {
  essentialFields: EssentialField[]
  extractedData: Record<string, unknown>
}) {
  const tierAFields = essentialFields.filter((f) => f.tier === 'A')
  const tierBFields = essentialFields.filter((f) => f.tier === 'B')
  const tierCFields = essentialFields.filter((f) => f.tier === 'C')

  const renderField = (field: EssentialField) => {
    const value = extractedData[field.key]
    const isFilled = Boolean(value)

    return (
      <div
        key={field.key}
        className={`flex items-start gap-2 p-3 rounded-lg border ${
          !isFilled && field.tier === 'A'
            ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30'
            : ''
        }`}
      >
        {isFilled ? (
          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
        ) : field.tier === 'A' ? (
          <ShieldAlert className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
        ) : (
          <X className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{field.label}</div>
          {field.description && !isFilled && (
            <div className="text-xs text-muted-foreground">
              {field.description}
            </div>
          )}
          {isFilled && (
            <div className="text-sm text-muted-foreground truncate">
              {String(value)}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-2">
      {tierAFields.length > 0 && (
        <>
          <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            Required for Execution
          </h4>
          {tierAFields.map(renderField)}
        </>
      )}

      {tierBFields.length > 0 && (
        <>
          <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400 mt-4 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Recommended
          </h4>
          {tierBFields.map(renderField)}
        </>
      )}

      {tierCFields.length > 0 && (
        <>
          <h4 className="text-sm font-medium text-muted-foreground mt-4 mb-2">
            Optional
          </h4>
          {tierCFields.map(renderField)}
        </>
      )}

      {Object.keys(extractedData).length > 0 && (
        <>
          <h4 className="text-sm font-medium text-muted-foreground mt-6">
            Additional Details
          </h4>
          {Object.entries(extractedData)
            .filter(([key]) => !essentialFields.some((f) => f.key === key))
            .filter(([key]) => key !== 'contractType')
            .map(([key, value]) => (
              <div key={key} className="p-3 rounded-lg border">
                <div className="text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {String(value)}
                </div>
              </div>
            ))}
        </>
      )}
    </div>
  )
}
