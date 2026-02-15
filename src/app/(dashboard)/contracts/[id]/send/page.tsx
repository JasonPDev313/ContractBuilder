import { getContract } from '@/actions/contracts'
import { SendContractForm } from '@/components/features/contracts/send-contract-form'
import { notFound, redirect } from 'next/navigation'

interface SendContractPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function SendContractPage({
  params,
}: SendContractPageProps) {
  try {
    const { id } = await params
    const contract = await getContract(id)

    // Only allow sending DRAFT contracts
    if (contract.status !== 'DRAFT') {
      redirect(`/contracts/${id}`)
    }

    return (
      <div className="max-w-2xl">
        <SendContractForm
          contractId={contract.id}
          contractTitle={contract.title}
        />
      </div>
    )
  } catch (error) {
    notFound()
  }
}
