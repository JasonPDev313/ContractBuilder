'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createTemplateSchema,
  updateTemplateSchema,
} from '@/lib/validations/template'
import { createTemplate, updateTemplate } from '@/actions/templates'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { z } from 'zod'
import { Plus, Trash2, GripVertical, Info } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

type CreateTemplateData = z.infer<typeof createTemplateSchema>
type UpdateTemplateData = z.infer<typeof updateTemplateSchema>

const CONTRACT_TYPE_OPTIONS = [
  { value: 'GOLF_OUTING', label: 'Golf Outing', sectionCount: 21 },
  { value: 'GOLF_LEAGUE', label: 'Golf League', sectionCount: 19 },
  { value: 'WEDDING', label: 'Wedding', sectionCount: 25 },
  { value: 'SPECIAL_EVENT', label: 'Banquet/Special Event', sectionCount: 26 },
  { value: 'OTHER', label: 'Custom Contract', sectionCount: 12 },
] as const

interface TemplateFormProps {
  template?: {
    id: string
    name: string
    description: string | null
    category: string | null
    isActive: boolean
    contractType?: string | null
  }
  mode: 'create' | 'edit'
}

export function TemplateForm({ template, mode }: TemplateFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedContractType, setSelectedContractType] = useState<
    string | null
  >(null)

  const form = useForm<CreateTemplateData>({
    resolver: zodResolver(
      mode === 'create' ? createTemplateSchema : updateTemplateSchema
    ) as any,
    defaultValues:
      mode === 'create'
        ? {
            name: '',
            description: '',
            category: '',
            sections: [
              {
                title: '',
                body: '',
                order: 0,
                isRequired: true,
              },
            ],
          }
        : {
            name: template?.name || '',
            description: template?.description || '',
            category: template?.category || '',
            isActive: template?.isActive ?? true,
          } as any,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'sections',
  })

  const selectedOption = CONTRACT_TYPE_OPTIONS.find(
    (opt) => opt.value === selectedContractType
  )

  async function onSubmit(data: CreateTemplateData | UpdateTemplateData) {
    setIsLoading(true)

    try {
      if (mode === 'edit' && template) {
        const result = await updateTemplate(template.id, data)
        if (result.success) {
          toast({
            title: 'Success',
            description: 'Template updated successfully',
          })
          router.refresh()
        } else {
          throw new Error(result.error)
        }
      } else {
        // If a contract type was selected, include it and remove sections
        const createData = selectedContractType
          ? {
              ...(data as CreateTemplateData),
              contractType: selectedContractType as CreateTemplateData['contractType'],
              sections: undefined,
            }
          : (data as CreateTemplateData)

        const result = await createTemplate(createData)
        if (result.success && result.template) {
          toast({
            title: 'Success',
            description: selectedContractType
              ? `Template created with ${selectedOption?.sectionCount || 'default'} sections`
              : 'Template created successfully',
          })
          router.push(`/templates/${result.template.id}/edit`)
          router.refresh()
        } else {
          throw new Error(result.error)
        }
      }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Template Details' : 'Edit Template'}
        </CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Create a reusable template with sections'
            : 'Update template metadata'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {mode === 'create' && (
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Contract Type
                </label>
                <Select
                  value={selectedContractType || 'custom'}
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      setSelectedContractType(null)
                    } else {
                      setSelectedContractType(value)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contract type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                        {option.sectionCount > 0 && (
                          <span className="ml-2 text-muted-foreground">
                            ({option.sectionCount} sections)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">
                      None / Custom Template
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Select a type to start with pre-built default sections, or choose Custom to build from scratch
                </p>

                {selectedContractType && selectedOption && selectedOption.sectionCount > 0 && (
                  <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 mt-3 dark:border-blue-900 dark:bg-blue-950">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {selectedOption.sectionCount} default sections will be created
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        You&apos;ll be able to customize, remove, or add sections after creation.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Standard Golf Outing Package" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A template for standard golf outing contracts..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Golf, Wedding, Corporate, etc." {...field} />
                  </FormControl>
                  <FormDescription>
                    Helps organize templates in the library
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === 'edit' && (
              <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <label className="text-base font-medium">Active Template</label>
                  <p className="text-sm text-muted-foreground">
                    Inactive templates cannot be used to create new contracts
                  </p>
                </div>
                <Switch
                  checked={template?.isActive ?? true}
                  onCheckedChange={() => {}}
                />
              </div>
            )}

            {/* Only show inline sections if no contract type selected in create mode */}
            {mode === 'create' && !selectedContractType && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Template Sections</h3>
                    <p className="text-sm text-muted-foreground">
                      Add sections to your template. Use {'{{'} variable_name {'}}'}
                      for dynamic content.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        title: '',
                        body: '',
                        order: fields.length,
                        isRequired: true,
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Section
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                          <CardTitle className="text-base">
                            Section {index + 1}
                          </CardTitle>
                        </div>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name={`sections.${index}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Section Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Introduction, Terms & Conditions, etc."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`sections.${index}.body`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Section Content</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="This agreement is between {{client_name}} and..."
                                rows={6}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Use {'{{'} variable_name {'}}'} for dynamic content
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`sections.${index}.isRequired`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Required Section</FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? 'Saving...'
                  : mode === 'create'
                    ? 'Create Template'
                    : 'Update Template'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
