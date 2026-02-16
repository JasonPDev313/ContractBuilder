'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  updateTemplateSectionSchema,
  addTemplateSectionSchema,
  type UpdateTemplateSectionInput,
  type AddTemplateSectionInput,
} from '@/lib/validations/template'
import {
  addTemplateSection,
  updateTemplateSection,
} from '@/actions/templates'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

interface TemplateSectionEditorProps {
  templateId: string
  section?: {
    id: string
    title: string
    body: string
    order: number
    isRequired: boolean
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  nextOrder: number
  insertAfterOrder?: number
}

export function TemplateSectionEditor({
  templateId,
  section,
  open,
  onOpenChange,
  nextOrder,
  insertAfterOrder,
}: TemplateSectionEditorProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!section

  const form = useForm<UpdateTemplateSectionInput | AddTemplateSectionInput>({
    resolver: zodResolver(
      isEditing ? updateTemplateSectionSchema : addTemplateSectionSchema
    ),
    defaultValues: isEditing
      ? {
          title: section.title,
          body: section.body,
          order: section.order,
          isRequired: section.isRequired,
        }
      : {
          templateId,
          title: '',
          body: '',
          order: nextOrder,
          isRequired: true,
          insertAfterOrder,
        },
  })

  async function onSubmit(
    data: UpdateTemplateSectionInput | AddTemplateSectionInput
  ) {
    setIsLoading(true)

    try {
      if (isEditing && section) {
        const result = await updateTemplateSection(section.id, data)
        if (result.success) {
          toast({
            title: 'Success',
            description: 'Section updated successfully',
          })
          onOpenChange(false)
          router.refresh()
        } else {
          throw new Error(result.error)
        }
      } else {
        const result = await addTemplateSection(
          data as AddTemplateSectionInput
        )
        if (result.success) {
          toast({
            title: 'Success',
            description: 'Section added successfully',
          })
          form.reset()
          onOpenChange(false)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Section' : 'Add New Section'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the section title and content'
              : 'Add a new section to your template'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
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
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="This agreement is between {{client_name}} and..."
                      rows={10}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Use {'{{'} variable_name {'}}'} for dynamic content that will
                    be filled when creating a contract
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Required Section</FormLabel>
                    <FormDescription>
                      Required sections cannot be removed from contracts
                    </FormDescription>
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Add Section'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
