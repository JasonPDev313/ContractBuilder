import { z } from 'zod'

export const contractSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  expiresAt: z.date().optional(),
})

export const sendContractSchema = z.object({
  contractId: z.string(),
  recipients: z
    .array(
      z.object({
        email: z.string().email('Invalid email'),
        name: z.string().min(1, 'Name is required'),
      })
    )
    .min(1, 'At least one recipient is required'),
})

export type ContractInput = z.infer<typeof contractSchema>
export type SendContractInput = z.infer<typeof sendContractSchema>
