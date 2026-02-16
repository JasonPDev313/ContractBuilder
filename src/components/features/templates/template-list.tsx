'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteTemplate } from '@/actions/templates'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreVertical, Edit, Trash2, FileText, Copy } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'

interface Template {
  id: string
  name: string
  description: string | null
  category: string | null
  version: number
  isActive: boolean
  usageCount: number
  createdAt: Date
  updatedAt: Date
  createdBy: {
    id: string
    name: string | null
    email: string
  }
  _count: {
    sections: number
    contracts: number
  }
}

interface TemplateListProps {
  templates: Template[]
}

export function TemplateList({ templates }: TemplateListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    setDeletingId(id)

    try {
      const result = await deleteTemplate(id)
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Template deleted successfully',
        })
        router.refresh()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to delete template',
      })
    } finally {
      setDeletingId(null)
    }
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No templates yet</p>
          <Button asChild>
            <Link href="/templates/new">Create Your First Template</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <Card key={template.id} className="flex flex-col">
          <CardHeader className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              {template.category && (
                <Badge variant="outline">{template.category}</Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={deletingId === template.id}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/templates/${template.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/contracts/from-template/${template.id}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      Use Template
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onSelect={() => handleDelete(template.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardTitle className="text-xl line-clamp-2">
              {template.name}
            </CardTitle>
            {template.description && (
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {template._count.sections} section
                {template._count.sections !== 1 ? 's' : ''}
              </span>
              <span className="text-muted-foreground">
                Used {template.usageCount} time
                {template.usageCount !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Updated {formatDate(template.updatedAt)}</span>
              <Badge variant="secondary" className="text-xs">
                v{template.version}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
