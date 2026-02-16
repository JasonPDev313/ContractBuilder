import { z } from 'zod'

// A single point in normalized 0..1 coordinate space
const pointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
})

// A single stroke is an array of points (minimum 2 to form a line)
const strokeSchema = z.array(pointSchema).min(2).max(1000)

// The complete signature data object
export const signatureDataSchema = z.object({
  strokes: z
    .array(strokeSchema)
    .min(1, 'At least one stroke is required')
    .max(50, 'Too many strokes'),
})

// Schema for the signContract action input
export const signContractSchema = z.object({
  token: z.string().min(1),
  signatureData: signatureDataSchema,
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
})

export type SignatureData = z.infer<typeof signatureDataSchema>
export type SignContractInput = z.infer<typeof signContractSchema>
