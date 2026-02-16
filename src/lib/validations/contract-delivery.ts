import { z } from 'zod'

export const sendContractSchema = z.object({
  contractId: z.string().cuid(),
  recipientName: z.string().min(1, 'Recipient name is required').max(200),
  recipientEmail: z.string().email('Invalid email address'),
  recipientPhone: z.string().optional(),
  emailSubject: z.string().optional(),
  emailMessage: z.string().optional(),
  tokenExpiresAt: z.date().optional(),
})

export const trackPublicViewSchema = z.object({
  accessToken: z.string().min(32, 'Invalid access token'),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
})

export const cancelContractSchema = z.object({
  contractId: z.string().cuid(),
  reason: z.string().optional(),
})

export const resendContractSchema = z.object({
  contractId: z.string().cuid(),
  recipientId: z.string().cuid(),
  emailSubject: z.string().optional(),
  emailMessage: z.string().optional(),
})

export type SendContractInput = z.infer<typeof sendContractSchema>
export type TrackPublicViewInput = z.infer<typeof trackPublicViewSchema>
export type CancelContractInput = z.infer<typeof cancelContractSchema>
export type ResendContractInput = z.infer<typeof resendContractSchema>
