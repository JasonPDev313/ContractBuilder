import { TemplateForm } from '@/components/features/templates/template-form'

export default function NewTemplatePage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create Template</h1>
        <p className="text-muted-foreground">
          Build a reusable contract template with sections
        </p>
      </div>
      <TemplateForm mode="create" />
    </div>
  )
}
