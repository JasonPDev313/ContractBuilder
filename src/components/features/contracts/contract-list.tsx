'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteContract } from '@/actions/contracts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreVertical, Eye, Edit, Send, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'

interface Contract {
  id: string
  title: string
  description: string | null
  status: string
  createdAt: Date
  updatedAt: Date
  signatures: Array<{ status: string }>
}

interface ContractListProps {
  contracts: Contract[]
}

const statusColors = {
  DRAFT: 'secondary',
  SENT: 'default',
  COMPLETED: 'default',
  EXPIRED: 'destructive',
  CANCELLED: 'destructive',
} as const

export function ContractList({ contracts }: ContractListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this contract?')) {
      return
    }

    setDeletingId(id)

    try {
      await deleteContract(id)
      toast({
        title: 'Success',
        description: 'Contract deleted successfully',
      })
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete contract',
      })
    } finally {
      setDeletingId(null)
    }
  }

  if (contracts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No contracts yet</p>
          <Button asChild>
            <Link href="/contracts/new">Create Your First Contract</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {contracts.map((contract) => {
        const signedCount = contract.signatures.filter(
          (s) => s.status === 'SIGNED'
        ).length
        const totalSignatures = contract.signatures.length

        return (
          <Card key={contract.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-xl">
                  <Link
                    href={`/contracts/${contract.id}`}
                    className="hover:underline"
                  >
                    {contract.title}
                  </Link>
                </CardTitle>
                {contract.description && (
                  <CardDescription>{contract.description}</CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={statusColors[contract.status as keyof typeof statusColors]}
                >
                  {contract.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deletingId === contract.id}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/contracts/${contract.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </DropdownMenuItem>
                    {contract.status === 'DRAFT' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href={`/contracts/${contract.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/contracts/${contract.id}/send`}>
                            <Send className="mr-2 h-4 w-4" />
                            Send
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={() => handleDelete(contract.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Updated {formatDate(contract.updatedAt)}</span>
                {totalSignatures > 0 && (
                  <span>
                    Signatures: {signedCount}/{totalSignatures}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
