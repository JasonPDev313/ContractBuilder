'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signContract, declineContract } from '@/actions/signatures'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/hooks/use-toast'
import { CheckCircle, XCircle } from 'lucide-react'
import { SignaturePad } from '@/components/features/signatures/signature-pad'
import type { SignatureData } from '@/lib/validations/signature'

interface SignatureFormProps {
  token: string
  signerName: string
}

export function SignatureForm({ token, signerName }: SignatureFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null)

  async function handleSign() {
    if (!signatureData) return
    setIsLoading(true)

    try {
      // Get client IP and user agent
      const ipResponse = await fetch('/api/ip')
      const { ip } = await ipResponse.json()
      const userAgent = navigator.userAgent

      await signContract({
        token,
        signatureData,
        ipAddress: ip,
        userAgent,
      })

      toast({
        title: 'Success',
        description: 'Contract signed successfully',
      })

      router.push(`/sign/${token}/success`)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sign contract',
      })
      setIsLoading(false)
    }
  }

  async function handleDecline() {
    if (!confirm('Are you sure you want to decline this contract?')) {
      return
    }

    setIsLoading(true)

    try {
      await declineContract(token)

      toast({
        title: 'Contract Declined',
        description: 'You have declined to sign this contract',
      })

      router.push('/')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
      })
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign Contract</CardTitle>
        <CardDescription>
          Hi {signerName}, please review the contract above and draw your signature below
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            By signing below, you agree to the terms and conditions outlined in
            this contract. Your signature will be legally binding and will be
            recorded along with your IP address and timestamp for audit purposes.
          </AlertDescription>
        </Alert>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Draw your signature
          </label>
          <SignaturePad onSignatureChange={setSignatureData} />
        </div>
      </CardContent>
      <CardFooter className="flex gap-4">
        <Button
          onClick={handleSign}
          disabled={isLoading || !signatureData}
          className="flex-1"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          {isLoading ? 'Signing...' : 'Sign Contract'}
        </Button>
        <Button
          onClick={handleDecline}
          disabled={isLoading}
          variant="outline"
          className="flex-1"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Decline
        </Button>
      </CardFooter>
    </Card>
  )
}
