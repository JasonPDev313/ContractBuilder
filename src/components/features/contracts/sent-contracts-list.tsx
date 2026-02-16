'use client'

import { useState } from 'react'
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
import { Eye, MoreVertical, Send, XCircle } from 'lucide-react'
import { format } from 'date-fns'

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
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [emailFilter, setEmailFilter] = useState<string>('')

  const filteredContracts = contracts.filter((contract) => {
    const matchesStatus =
      statusFilter === 'all' || contract.status === statusFilter
    const matchesEmail =
      emailFilter === '' ||
      contract.recipients.some((r) =>
        r.email.toLowerCase().includes(emailFilter.toLowerCase())
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
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No sent contracts found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((contract) => {
                    const primaryRecipient = contract.recipients[0]
                    const lastDelivery = contract.deliveries[0]

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
                          {primaryRecipient ? (
                            <div>
                              <div className="font-medium">
                                {primaryRecipient.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {primaryRecipient.email}
                              </div>
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
                          {lastDelivery
                            ? format(new Date(lastDelivery.sentAt), 'PP')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {primaryRecipient?.lastActivityAt
                            ? format(
                                new Date(primaryRecipient.lastActivityAt),
                                'PP'
                              )
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {primaryRecipient?.viewCount || 0}
                            </span>
                          </div>
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
