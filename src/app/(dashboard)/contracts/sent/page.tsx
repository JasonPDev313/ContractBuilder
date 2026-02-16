import { getSentContracts } from '@/actions/contract-delivery'
import { SentContractsList } from '@/components/features/contracts/sent-contracts-list'
import { notFound } from 'next/navigation'

export default async function SentContractsPage() {
  const result = await getSentContracts()

  if (!result.success) {
    notFound()
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sent Contracts</h1>
        <p className="text-muted-foreground">
          View and manage contracts you've sent to recipients
        </p>
      </div>

      <SentContractsList contracts={result.contracts || []} />
    </div>
  )
}
