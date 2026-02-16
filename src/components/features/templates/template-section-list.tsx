'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  deleteTemplateSection,
  reorderTemplateSections,
  toggleTemplateSection,
  updateTemplateSection,
} from '@/actions/templates'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { TemplateSectionEditor } from './template-section-editor'
import {
  Plus,
  ChevronUp,
  ChevronDown,
  X,
  RotateCcw,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface TemplateSection {
  id: string
  title: string
  body: string
  order: number
  isRequired: boolean
  isDefault: boolean
  isIncluded: boolean
  variables: string[]
}

interface TemplateSectionListProps {
  templateId: string
  sections: TemplateSection[]
  contractType?: string | null
}

export function TemplateSectionList({
  templateId,
  sections: initialSections,
  contractType,
}: TemplateSectionListProps) {
  const router = useRouter()
  const [sections, setSections] = useState(initialSections)
  const [isAddingSection, setIsAddingSection] = useState(false)
  const [insertAfterOrder, setInsertAfterOrder] = useState<number | undefined>(
    undefined
  )
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  const [editingBodyId, setEditingBodyId] = useState<string | null>(null)
  const [editingBodyValue, setEditingBodyValue] = useState('')
  const [savingBodyId, setSavingBodyId] = useState<string | null>(null)

  const includedSections = sections
    .filter((s) => s.isIncluded)
    .sort((a, b) => a.order - b.order)
  const excludedSections = sections.filter((s) => !s.isIncluded)

  async function handleRemove(section: TemplateSection) {
    if (section.isDefault) {
      // Soft remove for default sections
      await handleToggle(section.id)
    } else {
      // Hard delete for custom sections
      if (!confirm('Are you sure you want to delete this custom section?')) {
        return
      }
      setDeletingId(section.id)
      try {
        const result = await deleteTemplateSection(section.id)
        if (result.success) {
          toast({ title: 'Section removed' })
          router.refresh()
        } else {
          throw new Error((result as any).error || 'Failed to remove section')
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description:
            error instanceof Error ? error.message : 'Failed to remove section',
        })
      } finally {
        setDeletingId(null)
      }
    }
  }

  async function handleToggle(sectionId: string) {
    setTogglingId(sectionId)
    try {
      const result = await toggleTemplateSection(sectionId)
      if (result.success) {
        router.refresh()
      } else {
        throw new Error((result as any).error || 'Failed to toggle section')
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to toggle section',
      })
    } finally {
      setTogglingId(null)
    }
  }

  async function moveSection(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= includedSections.length) return

    setIsReordering(true)

    const newSections = [...includedSections]
    const [movedSection] = newSections.splice(index, 1)
    newSections.splice(newIndex, 0, movedSection)

    // Optimistic update
    const updatedAll = sections.map((s) => {
      const idx = newSections.findIndex((ns) => ns.id === s.id)
      if (idx >= 0) return { ...s, order: idx }
      return s
    })
    setSections(updatedAll)

    try {
      const result = await reorderTemplateSections({
        templateId,
        sectionIds: newSections.map((s) => s.id),
      })

      if (result.success) {
        router.refresh()
      } else {
        setSections(initialSections)
        throw new Error((result as any).error || 'Failed to reorder sections')
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to reorder sections',
      })
    } finally {
      setIsReordering(false)
    }
  }

  function startEditingBody(section: TemplateSection) {
    setEditingBodyId(section.id)
    setEditingBodyValue(section.body)
  }

  async function saveBody(sectionId: string) {
    setSavingBodyId(sectionId)
    try {
      const result = await updateTemplateSection(sectionId, {
        body: editingBodyValue,
      })
      if (result.success) {
        setSections((prev) =>
          prev.map((s) =>
            s.id === sectionId ? { ...s, body: editingBodyValue } : s
          )
        )
        setEditingBodyId(null)
        toast({ title: 'Section updated' })
      } else {
        throw new Error((result as any).error || 'Failed to save section')
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to save section',
      })
    } finally {
      setSavingBodyId(null)
    }
  }

  function handleAddSection(afterOrder?: number) {
    setInsertAfterOrder(afterOrder)
    setIsAddingSection(true)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Template Sections</CardTitle>
              <CardDescription>
                {includedSections.length} included section
                {includedSections.length !== 1 ? 's' : ''}
                {excludedSections.length > 0 &&
                  ` · ${excludedSections.length} excluded`}
              </CardDescription>
            </div>
            <Button onClick={() => handleAddSection()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {includedSections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sections included. Add a section or re-include excluded
              sections below.
            </div>
          ) : (
            <div className="space-y-3">
              {includedSections.map((section, index) => (
                <Card
                  key={section.id}
                  className={
                    togglingId === section.id || deletingId === section.id
                      ? 'opacity-50'
                      : ''
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex flex-col gap-1 pt-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveSection(index, 'up')}
                            disabled={index === 0 || isReordering}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveSection(index, 'down')}
                            disabled={
                              index === includedSections.length - 1 ||
                              isReordering
                            }
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">
                              Section {index + 1}
                            </Badge>
                            {section.isDefault && (
                              <Badge
                                variant="secondary"
                                className="text-xs"
                              >
                                <Shield className="mr-1 h-3 w-3" />
                                Default
                              </Badge>
                            )}
                            {section.isRequired && (
                              <Badge variant="secondary" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-semibold">{section.title}</h4>

                          {/* Inline body editing */}
                          {editingBodyId === section.id ? (
                            <div className="mt-2 space-y-2">
                              <Textarea
                                value={editingBodyValue}
                                onChange={(e) =>
                                  setEditingBodyValue(e.target.value)
                                }
                                rows={8}
                                className="text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveBody(section.id)}
                                  disabled={savingBodyId === section.id}
                                >
                                  {savingBodyId === section.id
                                    ? 'Saving...'
                                    : 'Save'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingBodyId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p
                              className="text-sm text-muted-foreground mt-1 line-clamp-3 cursor-pointer hover:bg-muted/50 rounded p-1 -ml-1 transition-colors"
                              onClick={() => startEditingBody(section)}
                              title="Click to edit"
                            >
                              {section.body}
                            </p>
                          )}

                          {section.variables.length > 0 &&
                            editingBodyId !== section.id && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {section.variables.slice(0, 5).map((variable) => (
                                  <Badge
                                    key={variable}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {'{{'} {variable} {'}}'}
                                  </Badge>
                                ))}
                                {section.variables.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{section.variables.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemove(section)}
                          disabled={
                            togglingId === section.id ||
                            deletingId === section.id
                          }
                          title={
                            section.isDefault
                              ? 'Exclude section'
                              : 'Delete section'
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Excluded sections */}
      {excludedSections.length > 0 && (
        <Card>
          <Accordion type="single" collapsible>
            <AccordionItem value="excluded" className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    Excluded Sections ({excludedSections.length})
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="space-y-2">
                  {excludedSections.map((section) => (
                    <div
                      key={section.id}
                      className={`flex items-center justify-between p-3 rounded-lg border border-dashed opacity-60 ${
                        togglingId === section.id ? 'opacity-30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <EyeOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm line-through truncate">
                          {section.title}
                        </span>
                        {section.isDefault && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            Default
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(section.id)}
                        disabled={togglingId === section.id}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Re-include
                      </Button>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      )}

      <TemplateSectionEditor
        templateId={templateId}
        open={isAddingSection}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingSection(false)
            setInsertAfterOrder(undefined)
          }
        }}
        nextOrder={includedSections.length}
        insertAfterOrder={insertAfterOrder}
      />
    </div>
  )
}
