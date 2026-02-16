'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Eye, MoreVertical, Send, XCircle, CheckCircle, Clock } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'

interface SentContract {
  id: string
  title: string
  status: string
  createdAt: Date
  updatedAt: Date
  recipients: Array<{
    id: string
    name: string
    email: string
    viewCount: number
    firstViewedAt: Date | null
    lastActivityAt: Date | null
  }>
  signatures: Array<{
    id: string
    signerName: string
    signerEmail: string
    status: string
    signedAt: Date | null
    createdAt: Date
  }>
  deliveries: Array<{
    id: string
    sentAt: Date
  }>
  createdBy: {
    id: string
    name: string | null
    email: string
  }
}

interface SentContractsListProps {
  contracts: SentContract[]
}

const statusColors: Record<string, string> = {
  SENT: 'bg-blue-100 text-blue-800',
  VIEWED: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
}

export function SentContractsList({ contracts }: SentContractsListProps) {
  const searchParams = useSearchParams()
  const initialStatus = searchParams.get('status') || 'all'
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus)
  const [emailFilter, setEmailFilter] = useState<string>('')

  const filteredContracts = contracts.filter((contract) => {
    const matchesStatus =
      statusFilter === 'all' || contract.status === statusFilter

    // Search in both recipients and signatures
    const matchesEmail =
      emailFilter === '' ||
      contract.recipients.some((r) =>
        r.email.toLowerCase().includes(emailFilter.toLowerCase())
      ) ||
      contract.signatures.some((s) =>
        s.signerEmail.toLowerCase().includes(emailFilter.toLowerCase())
      )
    return matchesStatus && matchesEmail
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sent Contracts</CardTitle>
        <CardDescription>
          {filteredContracts.length} contract(s) found
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by recipient email..."
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="VIEWED">Viewed</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Signatures</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No sent contracts found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((contract) => {
                    const primaryRecipient = contract.recipients[0]
                    const primarySignature = contract.signatures[0]
                    const lastDelivery = contract.deliveries[0]

                    // Use recipient data if available, fall back to signature data
                    const recipientName = primaryRecipient?.name || primarySignature?.signerName
                    const recipientEmail = primaryRecipient?.email || primarySignature?.signerEmail

                    // Sent date: delivery date, or signature created date, or contract updated date
                    const sentDate = lastDelivery?.sentAt || primarySignature?.createdAt || contract.updatedAt

                    // Signature progress
                    const totalSignatures = contract.signatures.length
                    const signedCount = contract.signatures.filter(s => s.status === 'SIGNED').length

                    return (
                      <TableRow key={contract.id}>
                        <TableCell>
                          <Link
                            href={`/contracts/${contract.id}`}
                            className="font-medium hover:underline"
                          >
                            {contract.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {recipientName || recipientEmail ? (
                            <div>
                              {recipientName && (
                                <div className="font-medium">
                                  {recipientName}
                                </div>
                              )}
                              {recipientEmail && (
                                <div className="text-sm text-muted-foreground">
                                  {recipientEmail}
                                </div>
                              )}
                              {(contract.signatures.length > 1 || contract.recipients.length > 1) && (
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  +{Math.max(contract.signatures.length, contract.recipients.length) - 1} more
                                </div>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusColors[contract.status]}
                          >
                            {contract.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {formatDate(sentDate)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {totalSignatures > 0 ? (
                            <div className="flex items-center gap-1.5">
                              {signedCount === totalSignatures ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Clock className="h-4 w-4 text-amber-500" />
                              )}
                              <span className="text-sm">
                                {signedCount}/{totalSignatures}
                              </span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/contracts/${contract.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              {contract.status !== 'CANCELLED' &&
                                contract.status !== 'COMPLETED' && (
                                  <>
                                    <DropdownMenuItem>
                                      <Send className="h-4 w-4 mr-2" />
                                      Resend
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive">
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Cancel
                                    </DropdownMenuItem>
                                  </>
                                )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
