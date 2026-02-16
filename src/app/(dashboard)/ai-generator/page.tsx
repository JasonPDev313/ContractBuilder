'use client'

import { useEffect, useState } from 'react'
import { ChatInterface } from '@/components/features/ai-generator/chat-interface'
import { ContractPreviewPanel } from '@/components/features/ai-generator/contract-preview-panel'
import { SaveAsTemplateDialog } from '@/components/features/ai-generator/save-as-template-dialog'
import { BulkFillModal } from '@/components/features/ai-generator/bulk-fill-modal'
import { getEssentialFields } from '@/lib/contract-fields'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, RotateCcw, Sparkles, MessageSquare, FileText, ClipboardEdit, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { checkFieldCompleteness, validateContractForExecution, getMissingFields } from '@/lib/contract-fields'
import { createConversation, getConversation } from '@/actions/ai-conversations'
import { toast } from '@/hooks/use-toast'
import { type ContractType } from '@/lib/contract-blueprints'
import { LegalDisclaimer } from '@/components/ui/legal-disclaimer'

interface Message {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  createdAt: Date
}

const CONTRACT_TYPE_OPTIONS: Array<{
  value: ContractType
  label: string
  description: string
}> = [
  {
    value: 'GOLF_OUTING',
    label: 'Golf Outing',
    description: 'One-time golf tournament or corporate outing',
  },
  {
    value: 'GOLF_LEAGUE',
    label: 'Golf League',
    description: 'Recurring golf league with weekly play',
  },
  {
    value: 'WEDDING',
    label: 'Wedding',
    description: 'Wedding venue and reception agreement',
  },
  {
    value: 'SPECIAL_EVENT',
    label: 'Banquet/Special Event',
    description: 'General banquet, party, or corporate event',
  },
  {
    value: 'OTHER',
    label: 'Custom Contract',
    description: 'Event contracts, vendor agreements, facility rentals, sponsorships, and more',
  },
]

const QUICK_START_SUGGESTIONS = [
  { label: 'Event Contract', prompt: 'I need a contract for a private event.' },
  { label: 'Vendor Agreement', prompt: 'I need a vendor services agreement.' },
  { label: 'Facility Rental', prompt: 'I need a facility rental agreement.' },
  { label: 'Sponsorship Agreement', prompt: 'I need a sponsorship agreement.' },
]

export default function AIGeneratorPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<ContractType | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [extractedData, setExtractedData] = useState<Record<string, unknown>>({})
  const [isReadyToGenerate, setIsReadyToGenerate] = useState(false)
  const [generatedContract, setGeneratedContract] = useState<{
    id: string
    title: string
    sections: Array<{
      id: string
      title: string
      body: string
      order: number
    }>
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [pendingChatMessage, setPendingChatMessage] = useState<string | null>(null)
  const [showBulkFill, setShowBulkFill] = useState(false)
  const [bulkFillTab, setBulkFillTab] = useState<'required' | 'recommended' | 'optional' | 'all'>('required')
  const [quickStartPrompt, setQuickStartPrompt] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<'chat' | 'contract'>('chat')

  const initializeConversation = async (contractType: ContractType) => {
    setIsLoading(true)
    try {
      const result = await createConversation(contractType)

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to start conversation',
        })
        return
      }

      setConversationId(result.conversationId!)
      setMessages([
        {
          id: 'initial',
          role: 'ASSISTANT',
          content: result.initialMessage!,
          createdAt: new Date(),
        },
      ])
      setExtractedData(result.extractedData || { contractType })
      setIsReadyToGenerate(false)
      setGeneratedContract(null)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateComplete = async (contractId: string) => {
    if (!conversationId) return

    try {
      const result = await getConversation(conversationId)

      if (!result.success || !result.conversation) return

      if (result.conversation.generatedContract) {
        setGeneratedContract({
          id: result.conversation.generatedContract.id,
          title: result.conversation.generatedContract.title,
          sections: result.conversation.generatedContract.sections,
        })
      }
    } catch (error) {
      console.error('Error fetching generated contract:', error)
    }
  }

  const handleStartOver = () => {
    setSelectedType(null)
    setConversationId(null)
    setMessages([])
    setExtractedData({})
    setIsReadyToGenerate(false)
    setGeneratedContract(null)
  }

  const handleBeginConversation = (quickStart?: string) => {
    if (selectedType) {
      if (quickStart) {
        setQuickStartPrompt(quickStart)
      }
      initializeConversation(selectedType)
    }
  }

  // Auto-send quick-start prompt after conversation initializes
  useEffect(() => {
    if (conversationId && quickStartPrompt && !isLoading) {
      setPendingChatMessage(quickStartPrompt)
      setQuickStartPrompt(null)
    }
  }, [conversationId, quickStartPrompt, isLoading])

  // Compute mobile action bar data
  const essentialFields = getEssentialFields(selectedType || undefined)
  const { completedCount, totalCount } = selectedType
    ? checkFieldCompleteness(selectedType, extractedData)
    : { completedCount: 0, totalCount: essentialFields.length }
  const executionValidation = validateContractForExecution(selectedType || undefined, extractedData)
  const missingFields = getMissingFields(selectedType || undefined, extractedData)

  // Show contract type selection screen
  if (!conversationId) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center p-4 md:p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">AI Template Builder</CardTitle>
                <CardDescription className="mt-1">
                  Create professional contracts through conversation
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="contractType" className="text-base font-medium">
                What type of contract do you need?
              </Label>
              <Select
                value={selectedType || ''}
                onValueChange={(value) => setSelectedType(value as ContractType)}
              >
                <SelectTrigger id="contractType" className="h-12">
                  <SelectValue placeholder="Select contract type..." />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="py-3">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedType && (
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Selected:</strong>{' '}
                  {CONTRACT_TYPE_OPTIONS.find((opt) => opt.value === selectedType)?.label}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {CONTRACT_TYPE_OPTIONS.find((opt) => opt.value === selectedType)?.description}
                </p>
              </div>
            )}

            {selectedType === 'OTHER' && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Quick start — or begin a blank conversation:
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_START_SUGGESTIONS.map((suggestion) => (
                    <Button
                      key={suggestion.label}
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                      onClick={() => handleBeginConversation(suggestion.prompt)}
                    >
                      {suggestion.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => handleBeginConversation()}
                disabled={!selectedType || isLoading}
                className="flex-1 h-11"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Begin Conversation
                  </>
                )}
              </Button>
            </div>

            <LegalDisclaimer />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show loading state while initializing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Starting conversation...</p>
        </div>
      </div>
    )
  }

  // Shared panel refs
  const chatPanel = (
    <ChatInterface
      conversationId={conversationId}
      initialMessages={messages}
      onExtractedDataUpdate={setExtractedData}
      onReadyToGenerate={setIsReadyToGenerate}
      externalMessage={pendingChatMessage}
      onExternalMessageSent={() => setPendingChatMessage(null)}
    />
  )

  const previewPanel = (
    <ContractPreviewPanel
      conversationId={conversationId}
      contractType={selectedType || undefined}
      extractedData={extractedData}
      isReadyToGenerate={isReadyToGenerate}
      generatedContract={generatedContract || undefined}
      onGenerateComplete={handleGenerateComplete}
      onSendMessage={(msg) => {
        setPendingChatMessage(msg)
        setMobileTab('chat')
      }}
      onOpenBulkFill={(tab) => {
        setBulkFillTab(tab || 'required')
        setShowBulkFill(true)
      }}
      onSaveAsTemplate={() => setShowTemplateDialog(true)}
      hideBottomActions
    />
  )

  // Main conversation interface
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="border-b bg-background px-4 py-3 md:px-6 md:py-4 space-y-2 md:space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">AI Template Builder</h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              {CONTRACT_TYPE_OPTIONS.find((opt) => opt.value === selectedType)?.label} Contract
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleStartOver} disabled={isLoading}>
            <RotateCcw className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Start Over</span>
          </Button>
        </div>
        <div className="hidden md:block">
          <LegalDisclaimer />
        </div>
      </div>

      {/* Mobile: Tab bar */}
      <div className="md:hidden border-b bg-background">
        <div className="grid grid-cols-2">
          <button
            className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              mobileTab === 'chat'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground'
            }`}
            onClick={() => setMobileTab('chat')}
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </button>
          <button
            className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              mobileTab === 'contract'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground'
            }`}
            onClick={() => setMobileTab('contract')}
          >
            <FileText className="h-4 w-4" />
            Contract
            {missingFields.required.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {missingFields.required.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Desktop: Two-column layout */}
      <div className="flex-1 hidden md:grid md:grid-cols-[1fr_400px] lg:grid-cols-[1fr_500px] overflow-hidden">
        <div className="border-r h-full overflow-hidden">
          {chatPanel}
        </div>
        <div className="bg-muted/20 h-full overflow-hidden">
          <ContractPreviewPanel
            conversationId={conversationId}
            contractType={selectedType || undefined}
            extractedData={extractedData}
            isReadyToGenerate={isReadyToGenerate}
            generatedContract={generatedContract || undefined}
            onGenerateComplete={handleGenerateComplete}
            onSendMessage={setPendingChatMessage}
            onOpenBulkFill={(tab) => {
              setBulkFillTab(tab || 'required')
              setShowBulkFill(true)
            }}
            onSaveAsTemplate={() => setShowTemplateDialog(true)}
          />
        </div>
      </div>

      {/* Mobile: Tab content */}
      <div className="flex-1 md:hidden overflow-hidden pb-16">
        <div className={`h-full overflow-hidden ${mobileTab === 'chat' ? 'block' : 'hidden'}`}>
          {chatPanel}
        </div>
        <div className={`h-full overflow-hidden bg-muted/20 ${mobileTab === 'contract' ? 'block' : 'hidden'}`}>
          {previewPanel}
        </div>
      </div>

      {/* Mobile: Sticky bottom action bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t px-4 py-3" style={{ zIndex: 40 }}>
        {generatedContract ? (
          <div className="flex gap-2">
            <Button
              onClick={() => router.push(`/contracts/${generatedContract.id}`)}
              className="flex-1"
              size="sm"
            >
              <Save className="h-4 w-4 mr-1" />
              Save Draft
            </Button>
            <Button
              onClick={() => setShowTemplateDialog(true)}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <FileText className="h-4 w-4 mr-1" />
              Template
            </Button>
          </div>
        ) : mobileTab === 'chat' ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 text-xs text-muted-foreground">
              {completedCount}/{totalCount} fields
            </div>
            <Button size="sm" variant="outline" onClick={() => setMobileTab('contract')}>
              View Contract
              <FileText className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setBulkFillTab(missingFields.required.length > 0 ? 'required' : 'recommended')
                setShowBulkFill(true)
              }}
            >
              <ClipboardEdit className="h-4 w-4 mr-1" />
              Fill Fields
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => setMobileTab('contract')}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Generate
            </Button>
          </div>
        )}
      </div>

      {/* Save as Template Dialog */}
      {generatedContract && (
        <SaveAsTemplateDialog
          contractId={generatedContract.id}
          open={showTemplateDialog}
          onOpenChange={setShowTemplateDialog}
        />
      )}

      {/* Bulk Fill Modal */}
      <BulkFillModal
        open={showBulkFill}
        onOpenChange={setShowBulkFill}
        fields={essentialFields}
        extractedData={extractedData}
        initialTab={bulkFillTab}
        onSave={(data) => {
          setExtractedData((prev) => ({ ...prev, ...data }))
        }}
      />
    </div>
  )
}
