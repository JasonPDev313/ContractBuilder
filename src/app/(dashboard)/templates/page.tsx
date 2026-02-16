import { getTemplates } from '@/actions/templates'
import { TemplateList } from '@/components/features/templates/template-list'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function TemplatesPage() {
  const result = await getTemplates()

  if (!result.success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
            <p className="text-muted-foreground">
              Create and manage reusable contract templates
            </p>
          </div>
        </div>
        <div className="text-destructive">{result.error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Create and manage reusable contract templates
          </p>
        </div>
        <Button asChild>
          <Link href="/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Link>
        </Button>
      </div>
      <TemplateList templates={result.templates} />
    </div>
  )
}
