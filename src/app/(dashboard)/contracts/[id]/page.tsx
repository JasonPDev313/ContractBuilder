import { getContract } from '@/actions/contracts'
import { ContractDetail } from '@/components/features/contracts/contract-detail'
import { notFound } from 'next/navigation'

interface ContractPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ContractPage({ params }: ContractPageProps) {
  try {
    const { id } = await params
    const contract = await getContract(id)
    return <ContractDetail contract={contract} />
  } catch (error) {
    notFound()
  }
}
