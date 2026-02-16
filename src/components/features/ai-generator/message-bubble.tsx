'use client'

import { cn } from '@/lib/utils'
import { User, Bot } from 'lucide-react'

interface MessageBubbleProps {
  role: 'USER' | 'ASSISTANT'
  content: string
  timestamp?: Date
}

export function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
  const isUser = role === 'USER'

  return (
    <div
      className={cn(
        'flex gap-3 mb-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
      )}

      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        <div className="text-sm whitespace-pre-wrap break-words">{content}</div>
        {timestamp && (
          <div
            className={cn(
              'text-xs mt-1',
              isUser ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
            )}
          >
            {new Date(timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4 justify-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
        <Bot className="h-4 w-4 text-primary-foreground" />
      </div>

      <div className="bg-muted text-muted-foreground rounded-lg px-4 py-3">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  )
}
