'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Eye, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface Contract {
  id: string
  title: string
  description: string | null
  status: string
  createdAt: Date
  expiresAt: Date | null
  content?: string | null
  sections: Array<{
    id: string
    title: string
    body: string
    order: number
  }>
  template?: {
    name: string
    category: string | null
  } | null
}

interface Recipient {
  name: string
  email: string
}

interface ViewInfo {
  viewCount: number
  isFirstView: boolean
}

interface PublicContractViewProps {
  contract: Contract
  recipient: Recipient
  viewInfo: ViewInfo
}

const statusColors: Record<string, string> = {
  SENT: 'bg-blue-100 text-blue-800',
  VIEWED: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
}

export function PublicContractView({
  contract,
  recipient,
  viewInfo,
}: PublicContractViewProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {contract.title}
                </h1>
                {contract.template && (
                  <p className="text-sm text-gray-500">
                    {contract.template.name}
                    {contract.template.category && (
                      <span> • {contract.template.category}</span>
                    )}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="outline" className={statusColors[contract.status]}>
              {contract.status}
            </Badge>
          </div>

          {contract.description && (
            <p className="text-gray-600 mb-4">{contract.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>
                {viewInfo.viewCount} view{viewInfo.viewCount !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Created {format(new Date(contract.createdAt), 'PPP')}</span>
            </div>
            {contract.expiresAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Expires {format(new Date(contract.expiresAt), 'PPP')}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              Sent to: <span className="font-medium">{recipient.name}</span> (
              {recipient.email})
            </p>
          </div>
        </div>

        {/* Contract Sections */}
        <div className="space-y-4">
          {contract.sections && contract.sections.length > 0 ? (
            contract.sections.map((section, index) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {index + 1}. {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700">
                      {section.body}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700">
                    {contract.content || 'No content available'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            This is a read-only view of the contract. If you have questions,
            please contact the sender.
          </p>
          <p className="mt-2">
            Powered by{' '}
            <span className="font-semibold text-gray-700">Contract Caddie</span>{' '}
            Contract Management System
          </p>
        </div>
      </div>
    </div>
  )
}
