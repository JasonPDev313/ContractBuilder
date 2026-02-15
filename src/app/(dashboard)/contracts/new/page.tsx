import { ContractForm } from '@/components/features/contracts/contract-form'

export default function NewContractPage() {
  return (
    <div className="max-w-2xl">
      <ContractForm mode="create" />
    </div>
  )
}
