import { getPublicContract, trackPublicView } from '@/actions/contract-delivery'
import { PublicContractView } from '@/components/features/contracts/public-contract-view'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'

interface PublicContractPageProps {
  params: Promise<{
    token: string
  }>
}

export default async function PublicContractPage({
  params,
}: PublicContractPageProps) {
  const { token } = await params
  const headersList = await headers()

  // Get IP address and user agent for tracking
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined
  const userAgent = headersList.get('user-agent') || undefined

  // Track the view
  const trackResult = await trackPublicView({
    accessToken: token,
    ipAddress,
    userAgent,
  })

  if (!trackResult.success) {
    // Show error page for invalid/expired/cancelled contracts
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {trackResult.error === 'This contract has been cancelled'
              ? 'Contract Cancelled'
              : 'Invalid Link'}
          </h3>
          <p className="text-sm text-gray-500">
            {trackResult.error ||
              'This contract link is invalid or has expired.'}
          </p>
        </div>
      </div>
    )
  }

  // Get the full contract details
  const contractResult = await getPublicContract(token)

  if (!contractResult.success || !contractResult.contract) {
    notFound()
  }

  return (
    <PublicContractView
      contract={contractResult.contract}
      recipient={contractResult.recipient}
      viewInfo={{
        viewCount: trackResult.viewCount || 0,
        isFirstView: trackResult.isFirstView || false,
      }}
    />
  )
}
