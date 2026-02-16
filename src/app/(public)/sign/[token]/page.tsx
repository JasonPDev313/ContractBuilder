import { getSignatureByToken } from '@/actions/signatures'
import { SignatureForm } from '@/components/features/signatures/signature-form'
import { SignatureDisplay } from '@/components/features/signatures/signature-display'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatDateTime } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

interface SignPageProps {
  params: Promise<{
    token: string
  }>
}

const signatureStatusConfig = {
  SIGNED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Signed' },
  PENDING: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Pending' },
  DECLINED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Declined' },
  EXPIRED: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Expired' },
} as const

export default async function SignPage({ params }: SignPageProps) {
  try {
    const { token } = await params
    const signature = await getSignatureByToken(token)
    const { contract } = signature

    const isAlreadySigned = signature.status === 'SIGNED'
    const isDeclined = signature.status === 'DECLINED'
    const isExpired = signature.status === 'EXPIRED'
    const isPending = signature.status === 'PENDING'

    const isSectionBased = contract.sections && contract.sections.length > 0

    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <div className="w-full max-w-3xl space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">
              {isAlreadySigned
                ? 'Fully Executed Contract'
                : isDeclined
                  ? 'Contract Declined'
                  : isExpired
                    ? 'Contract Expired'
                    : 'Contract Signature Request'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isAlreadySigned
                ? 'This contract has been signed by all parties'
                : isDeclined
                  ? 'This contract was declined'
                  : isExpired
                    ? 'This signature request has expired'
                    : 'You have been invited to review and sign a contract'}
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl">{contract.title}</CardTitle>
                  {contract.description && (
                    <CardDescription className="text-base">
                      {contract.description}
                    </CardDescription>
                  )}
                </div>
                <Badge
                  variant={contract.status === 'COMPLETED' ? 'default' : 'secondary'}
                >
                  {contract.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">From:</span>
                  <span>
                    {contract.createdBy.name || contract.createdBy.email}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(contract.createdAt)}</span>
                </div>
                {contract.expiresAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expires:</span>
                    <span>{formatDate(contract.expiresAt)}</span>
                  </div>
                )}
              </div>

              <Separator />

              {isSectionBased ? (
                <div className="space-y-4">
                  <h3 className="font-semibold">Contract Sections</h3>
                  {contract.sections.map((section: any, index: number) => (
                    <div key={section.id} className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">
                        {index + 1}. {section.title}
                      </h4>
                      <div className="rounded-lg border p-4 bg-muted/50">
                        <p className="whitespace-pre-wrap text-sm">{section.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold mb-4">Contract Content</h3>
                  <div className="rounded-lg border p-6 bg-muted/50">
                    <p className="whitespace-pre-wrap">{contract.content}</p>
                  </div>
                </div>
              )}

              {/* Signature Status Section - show when contract is signed/completed */}
              {!isPending && contract.signatures && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold">Signatures</h3>
                    {contract.signatures.map((sig: any) => {
                      const config = signatureStatusConfig[sig.status as keyof typeof signatureStatusConfig] || signatureStatusConfig.PENDING
                      const Icon = config.icon
                      return (
                        <div key={sig.id} className="rounded-lg border p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`rounded-full p-1.5 ${config.bg}`}>
                                <Icon className={`h-4 w-4 ${config.color}`} />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{sig.signerName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {sig.signerEmail}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={sig.status === 'SIGNED' ? 'default' : 'secondary'}
                              >
                                {config.label}
                              </Badge>
                              {sig.signedAt && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDateTime(sig.signedAt)}
                                </p>
                              )}
                            </div>
                          </div>
                          {sig.signatureSvg && (
                            <SignatureDisplay
                              svgPath={sig.signatureSvg}
                              signerName={sig.signerName}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {isPending && (
            <SignatureForm token={token} signerName={signature.signerName} />
          )}

          {!isPending && (
            <div className="text-center text-sm text-muted-foreground">
              <p>
                Powered by{' '}
                <span className="font-semibold">Contract Caddie</span>{' '}
                Contract Management System
              </p>
            </div>
          )}
        </div>
      </div>
    )
  } catch (error) {
    notFound()
  }
}
