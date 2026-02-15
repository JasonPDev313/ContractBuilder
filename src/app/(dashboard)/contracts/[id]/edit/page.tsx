import { getContract } from '@/actions/contracts'
import { ContractForm } from '@/components/features/contracts/contract-form'
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

    return (
      <div className="max-w-2xl">
        <ContractForm contract={contract} mode="edit" />
      </div>
    )
  } catch (error) {
    notFound()
  }
}
