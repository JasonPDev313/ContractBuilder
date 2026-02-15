'use client'

import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Edit, Send, Mail, CheckCircle, Clock, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Signature {
  id: string
  signerEmail: string
  signerName: string
  status: string
  signedAt: Date | null
  createdAt: Date
}

interface Contract {
  id: string
  title: string
  description: string | null
  content: string
  status: string
  createdAt: Date
  updatedAt: Date
  expiresAt: Date | null
  signatures: Signature[]
  createdBy: {
    name: string | null
    email: string | null
  }
}

interface ContractDetailProps {
  contract: Contract
}

const statusIcons = {
  PENDING: Clock,
  SIGNED: CheckCircle,
  DECLINED: XCircle,
  EXPIRED: XCircle,
}

const statusColors = {
  PENDING: 'secondary',
  SIGNED: 'default',
  DECLINED: 'destructive',
  EXPIRED: 'destructive',
} as const

export function ContractDetail({ contract }: ContractDetailProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-3xl">{contract.title}</CardTitle>
                <Badge>{contract.status}</Badge>
              </div>
              {contract.description && (
                <CardDescription className="text-base">
                  {contract.description}
                </CardDescription>
              )}
            </div>
            {contract.status === 'DRAFT' && (
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href={`/contracts/${contract.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/contracts/${contract.id}/send`}>
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Created by:</span>
              <span>{contract.createdBy.name || contract.createdBy.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Created:</span>
              <span>{formatDate(contract.createdAt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last updated:</span>
              <span>{formatDate(contract.updatedAt)}</span>
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
            <div className="rounded-lg border p-4 bg-muted/50">
              <p className="whitespace-pre-wrap">{contract.content}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {contract.signatures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Signatures</CardTitle>
            <CardDescription>
              {contract.signatures.filter((s) => s.status === 'SIGNED').length}/
              {contract.signatures.length} signatures completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contract.signatures.map((signature) => {
                const Icon = statusIcons[signature.status as keyof typeof statusIcons]
                return (
                  <div
                    key={signature.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{signature.signerName}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {signature.signerEmail}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={statusColors[signature.status as keyof typeof statusColors]}
                      >
                        {signature.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {signature.signedAt
                          ? `Signed ${formatDate(signature.signedAt)}`
                          : `Sent ${formatDate(signature.createdAt)}`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
