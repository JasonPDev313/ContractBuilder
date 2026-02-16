import { getContract } from '@/actions/contracts'
import { ContractDetail } from '@/components/features/contracts/contract-detail'
import { AutoRefresh } from '@/components/auto-refresh'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface ContractPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ContractPage({ params }: ContractPageProps) {
  try {
    const { id } = await params
    const contract = await getContract(id)
    const isAwaitingAction = contract.status === 'SENT' || contract.status === 'VIEWED'

    return (
      <>
        {isAwaitingAction && <AutoRefresh interval={10000} />}
        <ContractDetail contract={contract} />
      </>
    )
  } catch (error) {
    notFound()
  }
}
