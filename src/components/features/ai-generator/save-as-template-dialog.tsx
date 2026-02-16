'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { convertContractToTemplate } from '@/actions/ai-conversations'
import { toast } from '@/hooks/use-toast'

interface SaveAsTemplateDialogProps {
  contractId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  extractedVariables?: string[]
}

export function SaveAsTemplateDialog({
  contractId,
  open,
  onOpenChange,
  extractedVariables = [],
}: SaveAsTemplateDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [templateCategory, setTemplateCategory] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!templateName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Template name is required',
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await convertContractToTemplate({
        contractId,
        templateName,
        templateDescription: templateDescription || undefined,
        templateCategory: templateCategory || undefined,
      })

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to create template',
        })
        return
      }

      toast({
        title: 'Template created!',
        description: 'Your contract has been saved as a reusable template.',
      })

      onOpenChange(false)
      router.push(`/templates/${result.templateId}/edit`)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Convert this AI-generated contract into a reusable template that you can use for future
            contracts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="templateName">
              Template Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Premium Wedding Package"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateCategory">Category</Label>
            <Select value={templateCategory} onValueChange={setTemplateCategory}>
              <SelectTrigger id="templateCategory">
                <SelectValue placeholder="Select category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEDDING">Wedding</SelectItem>
                <SelectItem value="GOLF_OUTING">Golf Outing</SelectItem>
                <SelectItem value="GOLF_LEAGUE">Golf League</SelectItem>
                <SelectItem value="SPECIAL_EVENT">Special Event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateDescription">Description</Label>
            <Textarea
              id="templateDescription"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Optional description of this template..."
              rows={3}
            />
          </div>

          {extractedVariables.length > 0 && (
            <div className="space-y-2">
              <Label>Extracted Variables</Label>
              <div className="flex flex-wrap gap-2 p-3 rounded-md border bg-muted/50">
                {extractedVariables.map((variable) => (
                  <Badge key={variable} variant="secondary">
                    {`{{${variable}}}`}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                These placeholders will be available when creating contracts from this template.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Template'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
