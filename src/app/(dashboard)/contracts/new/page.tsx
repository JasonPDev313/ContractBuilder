import { ContractSectionForm } from '@/components/features/contracts/contract-section-form'
import { TemplateSelector } from '@/components/features/contracts/template-selector'
import { getTemplates } from '@/actions/templates'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function NewContractPage() {
  const result = await getTemplates()
  const templates = (result.success ? result.templates : []) || []

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Contract</h1>
        <p className="text-muted-foreground">
          Start from a template or create a blank contract
        </p>
      </div>

      <Tabs defaultValue="template" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="template">From Template</TabsTrigger>
          <TabsTrigger value="blank">Blank Contract</TabsTrigger>
        </TabsList>
        <TabsContent value="template" className="mt-6">
          <TemplateSelector templates={templates} />
        </TabsContent>
        <TabsContent value="blank" className="mt-6">
          <div className="max-w-2xl">
            <ContractSectionForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
