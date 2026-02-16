import { getTemplate } from '@/actions/templates'
import { TemplateForm } from '@/components/features/templates/template-form'
import { TemplateSectionList } from '@/components/features/templates/template-section-list'
import { Badge } from '@/components/ui/badge'
import { notFound } from 'next/navigation'

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  GOLF_OUTING: 'Golf Outing',
  GOLF_LEAGUE: 'Golf League',
  WEDDING: 'Wedding',
  SPECIAL_EVENT: 'Banquet/Special Event',
  OTHER: 'Other',
}

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getTemplate(id)

  if (!result.success || !result.template) {
    notFound()
  }

  const contractType = result.template.contractType

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Edit Template</h1>
          {contractType && (
            <Badge variant="secondary" className="text-sm">
              {CONTRACT_TYPE_LABELS[contractType] || contractType}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Update template metadata and manage sections
        </p>
      </div>

      <div className="space-y-6">
        <TemplateForm mode="edit" template={result.template} />
        <TemplateSectionList
          templateId={result.template.id}
          sections={result.template.sections}
          contractType={contractType}
        />
      </div>
    </div>
  )
}
