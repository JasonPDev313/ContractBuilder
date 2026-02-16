'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2 } from 'lucide-react'
import { MessageBubble, TypingIndicator } from './message-bubble'
import { sendMessage } from '@/actions/ai-conversations'
import { toast } from '@/hooks/use-toast'

interface Message {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  createdAt: Date
}

interface ChatInterfaceProps {
  conversationId: string
  initialMessages: Message[]
  onExtractedDataUpdate: (data: Record<string, unknown>) => void
  onReadyToGenerate: (ready: boolean) => void
  externalMessage?: string | null
  onExternalMessageSent?: () => void
}

export function ChatInterface({
  conversationId,
  initialMessages,
  onExtractedDataUpdate,
  onReadyToGenerate,
  externalMessage,
  onExternalMessageSent,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pendingExternalRef = useRef<string | null>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Handle external messages from preview panel
  useEffect(() => {
    if (externalMessage && !isLoading && externalMessage !== pendingExternalRef.current) {
      pendingExternalRef.current = externalMessage
      setInputValue(externalMessage)
      onExternalMessageSent?.()
      // Auto-send after a brief delay so user sees what's being sent
      const timer = setTimeout(() => {
        setInputValue('')
        sendExternalMessage(externalMessage)
      }, 300)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalMessage])

  const sendExternalMessage = async (message: string) => {
    setIsLoading(true)

    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'USER',
      content: message,
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, tempUserMessage])

    try {
      const result = await sendMessage({
        conversationId,
        userMessage: message,
      })

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to send message',
        })
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
        return
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'ASSISTANT',
        content: result.assistantMessage || '',
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])

      if (result.extractedData) {
        onExtractedDataUpdate(result.extractedData)
      }
      if (result.isReadyToGenerate !== undefined) {
        onReadyToGenerate(result.isReadyToGenerate)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
      })
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
    } finally {
      setIsLoading(false)
      textareaRef.current?.focus()
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setIsLoading(true)

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'USER',
      content: userMessage,
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, tempUserMessage])

    try {
      const result = await sendMessage({
        conversationId,
        userMessage,
      })

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to send message',
        })
        // Remove temp user message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
        setInputValue(userMessage) // Restore input
        return
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'ASSISTANT',
        content: result.assistantMessage || '',
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])

      // Update extracted data
      if (result.extractedData) {
        onExtractedDataUpdate(result.extractedData)
      }

      // Update ready-to-generate status
      if (result.isReadyToGenerate !== undefined) {
        onReadyToGenerate(result.isReadyToGenerate)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
      })
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
      setInputValue(userMessage)
    } finally {
      setIsLoading(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role}
            content={message.content}
            timestamp={message.createdAt}
          />
        ))}

        {isLoading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t bg-background p-3 md:p-4">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[44px] md:min-h-[60px] max-h-[200px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="h-[44px] w-[44px] md:h-[60px] md:w-[60px] flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 hidden md:block">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
