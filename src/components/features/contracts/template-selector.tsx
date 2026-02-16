'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Search } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string | null
  category: string | null
  _count: {
    sections: number
  }
}

interface TemplateSelectorProps {
  templates: Template[]
}

export function TemplateSelector({ templates }: TemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Get unique categories
  const categories = Array.from(
    new Set(templates.map((t) => t.category).filter(Boolean))
  ) as string[]

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      !selectedCategory || template.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">
            No templates available yet
          </p>
          <Button asChild>
            <Link href="/templates/new">Create Your First Template</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        )}
      </div>

      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              No templates match your search
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader className="flex-1">
                {template.category && (
                  <Badge variant="outline" className="w-fit mb-2">
                    {template.category}
                  </Badge>
                )}
                <CardTitle className="text-lg line-clamp-2">
                  {template.name}
                </CardTitle>
                {template.description && (
                  <CardDescription className="line-clamp-3">
                    {template.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <FileText className="mr-2 h-4 w-4" />
                  {template._count.sections} section
                  {template._count.sections !== 1 ? 's' : ''}
                </div>
                <Button asChild className="w-full">
                  <Link href={`/contracts/from-template/${template.id}`}>
                    Use This Template
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
