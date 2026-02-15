import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
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

  // Fetch contract statistics
  const [totalContracts, draftContracts, sentContracts, completedContracts] =
    await Promise.all([
      prisma.contract.count({
        where: { createdById: userId },
      }),
      prisma.contract.count({
        where: {
          createdById: userId,
          status: 'DRAFT',
        },
      }),
      prisma.contract.count({
        where: {
          createdById: userId,
          status: 'SENT',
        },
      }),
      prisma.contract.count({
        where: {
          createdById: userId,
          status: 'COMPLETED',
        },
      }),
    ])

  const stats = [
    {
      title: 'Total Contracts',
      value: totalContracts,
      description: 'All contracts created',
      icon: FileText,
    },
    {
      title: 'Drafts',
      value: draftContracts,
      description: 'Contracts in draft status',
      icon: FileEdit,
    },
    {
      title: 'Sent',
      value: sentContracts,
      description: 'Contracts sent for signature',
      icon: Send,
    },
    {
      title: 'Completed',
      value: completedContracts,
      description: 'Fully signed contracts',
      icon: CheckCircle,
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
            <Card key={stat.title}>
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
          )
        })}
      </div>
    </div>
  )
}
