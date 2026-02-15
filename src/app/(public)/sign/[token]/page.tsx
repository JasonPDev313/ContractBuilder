import { getSignatureByToken } from '@/actions/signatures'
import { SignatureForm } from '@/components/features/signatures/signature-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'

interface SignPageProps {
  params: Promise<{
    token: string
  }>
}

export default async function SignPage({ params }: SignPageProps) {
  try {
    const { token } = await params
    const signature = await getSignatureByToken(token)
    const { contract } = signature

    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <div className="w-full max-w-3xl space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Contract Signature Request</h1>
            <p className="text-muted-foreground mt-2">
              You have been invited to review and sign a contract
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
                <Badge>{contract.status}</Badge>
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

              <div>
                <h3 className="font-semibold mb-4">Contract Content</h3>
                <div className="rounded-lg border p-6 bg-muted/50">
                  <p className="whitespace-pre-wrap">{contract.content}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <SignatureForm token={token} signerName={signature.signerName} />
        </div>
      </div>
    )
  } catch (error) {
    notFound()
  }
}
