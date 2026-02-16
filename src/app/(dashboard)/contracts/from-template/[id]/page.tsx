import { getTemplate } from '@/actions/templates'
import { VariableInputForm } from '@/components/features/contracts/variable-input-form'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function CreateFromTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getTemplate(id)

  if (!result.success || !result.template) {
    notFound()
  }

  const template = result.template

  // Extract all unique variables from all sections
  const allVariables = Array.from(
    new Set(template.sections.flatMap((section) => section.variables))
  )

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Create Contract from Template
        </h1>
        <p className="text-muted-foreground">
          Fill in the details to create a new contract
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-2">
            {template.category && (
              <Badge variant="outline">{template.category}</Badge>
            )}
            <CardTitle>{template.name}</CardTitle>
            {template.description && (
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            This template has {template.sections.length} section
            {template.sections.length !== 1 ? 's' : ''}
            {allVariables.length > 0 && (
              <> and requires {allVariables.length} variable
                {allVariables.length !== 1 ? 's' : ''} to be filled</>
            )}
          </div>
        </CardContent>
      </Card>

      <VariableInputForm
        templateId={template.id}
        templateName={template.name}
        sections={template.sections}
        variables={allVariables}
      />
    </div>
  )
}
