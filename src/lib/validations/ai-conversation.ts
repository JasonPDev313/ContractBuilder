import { z } from 'zod'

/**
 * Validation schema for sending a message in a conversation
 */
export const sendMessageSchema = z.object({
  conversationId: z.string().cuid(),
  userMessage: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
})

/**
 * Validation schema for generating a contract from a conversation
 */
export const generateFromConversationSchema = z.object({
  conversationId: z.string().cuid(),
  finalReview: z.boolean().optional(),
})

/**
 * Validation schema for converting a contract to a template
 */
export const convertToTemplateSchema = z.object({
  contractId: z.string().cuid(),
  templateName: z.string().min(1, 'Template name is required').max(200),
  templateDescription: z.string().max(1000).optional(),
  templateCategory: z.string().max(100).optional(),
})

/**
 * Expected AI response schema for conversation messages
 */
export const aiResponseSchema = z.object({
  message: z.string().min(1),
  extractedData: z.record(z.unknown()).optional(),
  isComplete: z.boolean(),
  nextQuestion: z.string().optional(),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type GenerateFromConversationInput = z.infer<typeof generateFromConversationSchema>
export type ConvertToTemplateInput = z.infer<typeof convertToTemplateSchema>
export type AIResponseData = z.infer<typeof aiResponseSchema>
