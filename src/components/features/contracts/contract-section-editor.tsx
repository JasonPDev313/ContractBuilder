'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateContractSection } from '@/actions/contract-sections'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { Edit, Save, X, ChevronDown, ChevronUp } from 'lucide-react'
import { type ContractType } from '@/lib/contract-blueprints'
import { MissingFieldsPanel } from './missing-fields-panel'

interface ContractSection {
  id: string
  title: string
  body: string
  order: number
  isEdited: boolean
}

interface Contract {
  id: string
  title: string
  description: string | null
  template?: {
    name: string
    category: string | null
  } | null
}

interface ContractSectionEditorProps {
  contract: Contract
  sections: ContractSection[]
  contractType?: ContractType | null
  initialExtractedData?: Record<string, unknown>
}

export function ContractSectionEditor({
  contract,
  sections: initialSections,
  contractType,
  initialExtractedData = {},
}: ContractSectionEditorProps) {
  const router = useRouter()
  const [sections, setSections] = useState(initialSections)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [extractedData, setExtractedData] = useState<Record<string, unknown>>(initialExtractedData)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map((s) => s.id))
  )

  function startEditing(section: ContractSection) {
    setEditingId(section.id)
    setEditTitle(section.title)
    setEditBody(section.body)
  }

  function cancelEditing() {
    setEditingId(null)
    setEditTitle('')
    setEditBody('')
  }

  async function saveSection(sectionId: string) {
    setIsSaving(true)

    try {
      const result = await updateContractSection(sectionId, {
        title: editTitle,
        body: editBody,
      })

      if (result.success && result.section) {
        toast({
          title: 'Success',
          description: 'Section updated successfully',
        })

        setSections((prev) =>
          prev.map((s) =>
            s.id === sectionId
              ? { ...s, title: editTitle, body: editBody, isEdited: true }
              : s
          )
        )

        setEditingId(null)
        router.refresh()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to update section',
      })
    } finally {
      setIsSaving(false)
    }
  }

  function toggleSection(sectionId: string) {
    setExpandedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Contract</h1>
        <p className="text-muted-foreground">
          Update contract sections and details
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{contract.title}</CardTitle>
          {contract.description && (
            <CardDescription>{contract.description}</CardDescription>
          )}
          {contract.template && (
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="outline">Template: {contract.template.name}</Badge>
              {contract.template.category && (
                <Badge variant="secondary">{contract.template.category}</Badge>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {contractType && (
        <Card>
          <CardHeader>
            <CardTitle>Contract Fields</CardTitle>
            <CardDescription>
              Track and fill in required contract details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MissingFieldsPanel
              contractType={contractType}
              extractedData={extractedData}
              onFieldsUpdate={(data) => {
                setExtractedData((prev) => ({ ...prev, ...data }))
              }}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contract Sections</CardTitle>
          <CardDescription>
            Edit individual sections of your contract
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.map((section, index) => {
            const isEditing = editingId === section.id
            const isExpanded = expandedSections.has(section.id)

            return (
              <Card key={section.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">Section {index + 1}</Badge>
                        {section.isEdited && (
                          <Badge variant="secondary">Edited</Badge>
                        )}
                      </div>
                      {isEditing ? (
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="font-semibold"
                        />
                      ) : (
                        <h4 className="font-semibold">{section.title}</h4>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSection(section.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => saveSection(section.id)}
                            disabled={isSaving}
                          >
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(section)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={10}
                        className="font-mono text-sm"
                      />
                    ) : (
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                        {section.body}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={() => router.push(`/contracts/${contract.id}`)}>
          View Contract
        </Button>
        <Button variant="outline" onClick={() => router.push('/contracts')}>
          Back to Contracts
        </Button>
      </div>
    </div>
  )
}
