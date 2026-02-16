import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FileText, Send, CheckCircle, FileEdit } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const userId = (session.user as any).id

  // Fetch contract statistics in a single query
  const statusCounts = await prisma.contract.groupBy({
    by: ['status'],
    where: { createdById: userId },
    _count: { _all: true },
  })

  const countByStatus = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count._all])
  )
  const totalContracts = statusCounts.reduce((sum, s) => sum + s._count._all, 0)
  const draftContracts = countByStatus['DRAFT'] || 0
  const sentContracts = countByStatus['SENT'] || 0
  const completedContracts = countByStatus['COMPLETED'] || 0

  const stats = [
    {
      title: 'Total Contracts',
      value: totalContracts,
      description: 'All contracts created',
      icon: FileText,
      href: '/contracts/sent',
    },
    {
      title: 'Drafts',
      value: draftContracts,
      description: 'Contracts in draft status',
      icon: FileEdit,
      href: '/contracts?status=DRAFT',
    },
    {
      title: 'Sent',
      value: sentContracts,
      description: 'Contracts sent for signature',
      icon: Send,
      href: '/contracts/sent?status=SENT',
    },
    {
      title: 'Completed',
      value: completedContracts,
      description: 'Fully signed contracts',
      icon: CheckCircle,
      href: '/contracts/sent?status=COMPLETED',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your contract management
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
