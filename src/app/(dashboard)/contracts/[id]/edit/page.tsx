import { getContract } from '@/actions/contracts'
import { getContractSections } from '@/actions/contract-sections'
import { getContractExtractedData } from '@/actions/ai-conversations'
import { ContractForm } from '@/components/features/contracts/contract-form'
import { ContractSectionEditor } from '@/components/features/contracts/contract-section-editor'
import { type ContractType } from '@/lib/contract-blueprints'
import { notFound } from 'next/navigation'

interface EditContractPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditContractPage({
  params,
}: EditContractPageProps) {
  try {
    const { id } = await params
    const contract = await getContract(id)

    if (contract.status !== 'DRAFT') {
      notFound()
    }

    // Check if this is a section-based contract (created from template)
    const sectionsResult = await getContractSections(id)
    const isSectionBased =
      sectionsResult.success && sectionsResult.sections.length > 0

    if (isSectionBased && sectionsResult.sections) {
      // Fetch extracted data from the AI conversation (if any)
      const extractedResult = await getContractExtractedData(id)

      // Section-based contract editing
      return (
        <div className="max-w-4xl">
          <ContractSectionEditor
            contract={contract}
            sections={sectionsResult.sections}
            contractType={(contract.contractType || contract.template?.category) as ContractType | undefined}
            initialExtractedData={extractedResult.extractedData}
          />
        </div>
      )
    } else {
      // Legacy content-based contract editing
      return (
        <div className="max-w-2xl">
          <ContractForm contract={contract} mode="edit" />
        </div>
      )
    }
  } catch (error) {
    notFound()
  }
}
