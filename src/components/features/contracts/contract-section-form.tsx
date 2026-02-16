'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { Plus, Trash2, GripVertical, FileText } from 'lucide-react'
import { SaveAsTemplateDialog } from '@/components/features/ai-generator/save-as-template-dialog'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AISuggestionDialog } from '@/components/features/ai/ai-suggestion-dialog'

const contractSectionFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  expiresAt: z.date().optional(),
  sections: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().min(1, 'Section title is required').max(200),
        body: z.string().min(1, 'Section content is required'),
      })
    )
    .min(1, 'At least one section is required'),
})

type ContractSectionFormData = z.infer<typeof contractSectionFormSchema>

interface SortableSectionProps {
  id: string
  index: number
  section: { id: string; title: string; body: string }
  onRemove: () => void
  form: any
}

function SortableSection({ id, index, section, onRemove, form }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card rounded-lg border p-4 space-y-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
          <FormField
            control={form.control}
            name={`sections.${index}.title`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="Section title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <FormField
        control={form.control}
        name={`sections.${index}.body`}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Textarea
                placeholder="Section content"
                className="min-h-[150px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex justify-end">
        <AISuggestionDialog
          sectionTitle={form.watch(`sections.${index}.title`) || 'Untitled Section'}
          existingContent={form.watch(`sections.${index}.body`)}
          onInsert={(text) => {
            form.setValue(`sections.${index}.body`, text)
          }}
          onAppend={(text) => {
            const currentBody = form.getValues(`sections.${index}.body`)
            form.setValue(`sections.${index}.body`, currentBody + '\n\n' + text)
          }}
        />
      </div>
    </div>
  )
}

export function ContractSectionForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingAsTemplate, setIsSavingAsTemplate] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [createdContractId, setCreatedContractId] = useState<string | null>(null)

  const form = useForm<ContractSectionFormData>({
    resolver: zodResolver(contractSectionFormSchema),
    defaultValues: {
      title: '',
      description: '',
      sections: [
        {
          id: crypto.randomUUID(),
          title: '',
          body: '',
        },
      ],
    },
  })

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'sections',
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: any) {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id)
      const newIndex = fields.findIndex((field) => field.id === over.id)
      move(oldIndex, newIndex)
    }
  }

  async function createContractFromForm(data: ContractSectionFormData): Promise<string | null> {
    const response = await fetch('/api/contracts/create-with-sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        description: data.description || null,
        expiresAt: data.expiresAt ? data.expiresAt.toISOString() : null,
        sections: data.sections.map((section, index) => ({
          title: section.title,
          body: section.body,
          order: index,
        })),
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create contract')
    }

    const result = await response.json()
    return result.id
  }

  async function onSubmit(data: ContractSectionFormData) {
    setIsLoading(true)

    try {
      const contractId = await createContractFromForm(data)

      toast({
        title: 'Success',
        description: 'Contract created successfully',
      })
      router.push(`/contracts/${contractId}`)
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function onSaveAsTemplate() {
    const isValid = await form.trigger()
    if (!isValid) return

    setIsSavingAsTemplate(true)

    try {
      const data = form.getValues()
      const contractId = await createContractFromForm(data)

      if (contractId) {
        setCreatedContractId(contractId)
        setShowTemplateDialog(true)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create contract',
      })
    } finally {
      setIsSavingAsTemplate(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Contract</CardTitle>
        <CardDescription>
          Create a new contract with custom sections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Contract title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the contract"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiration Date (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={
                        field.value
                          ? new Date(field.value).toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e) => {
                        const date = e.target.value
                          ? new Date(e.target.value)
                          : undefined
                        field.onChange(date)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Contract Sections</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      id: crypto.randomUUID(),
                      title: '',
                      body: '',
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={fields.map((field) => field.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <SortableSection
                        key={field.id}
                        id={field.id}
                        index={index}
                        section={field}
                        onRemove={() => {
                          if (fields.length > 1) {
                            remove(index)
                          } else {
                            toast({
                              variant: 'destructive',
                              title: 'Error',
                              description: 'Contract must have at least one section',
                            })
                          }
                        }}
                        form={form}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading || isSavingAsTemplate}>
                {isLoading ? 'Creating...' : 'Create Contract'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onSaveAsTemplate}
                disabled={isLoading || isSavingAsTemplate}
              >
                <FileText className="h-4 w-4 mr-2" />
                {isSavingAsTemplate ? 'Saving...' : 'Save as Template'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading || isSavingAsTemplate}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      {createdContractId && (
        <SaveAsTemplateDialog
          contractId={createdContractId}
          open={showTemplateDialog}
          onOpenChange={(open) => {
            setShowTemplateDialog(open)
            if (!open) {
              router.push(`/contracts/${createdContractId}`)
              router.refresh()
            }
          }}
        />
      )}
    </Card>
  )
}
