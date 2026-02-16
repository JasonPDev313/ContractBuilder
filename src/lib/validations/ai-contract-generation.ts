import { z } from 'zod'

/**
 * Input schema for full contract generation
 */
export const generateContractSchema = z.object({
  // Required core parameters
  contractTypeEnum: z.enum(['WEDDING', 'GOLF_OUTING', 'GOLF_LEAGUE', 'SPECIAL_EVENT']),
  contractType: z.string().min(1, 'Contract type is required').max(200),
  jurisdiction: z.string().min(1, 'Jurisdiction is required').max(200),
  tone: z.enum(['neutral', 'formal', 'friendly', 'firm']).default('neutral'),
  riskPosture: z
    .enum(['balanced', 'venue-favorable', 'client-favorable'])
    .default('balanced'),

  // Party information (optional)
  venueName: z.string().max(200).optional(),
  clientName: z.string().max(200).optional(),
  eventDate: z.string().max(100).optional(),
  location: z.string().max(200).optional(),

  // Key terms (structured fields)
  pricing: z.string().max(500).optional(),
  depositAmount: z.string().max(200).optional(),
  depositDueDate: z.string().max(200).optional(),
  paymentSchedule: z.string().max(500).optional(),
  alcoholPolicy: z.string().max(500).optional(),
  cancellationPolicy: z.string().max(500).optional(),
  weatherPolicy: z.string().max(500).optional(),
  liabilityTerms: z.string().max(500).optional(),
  forceMajeure: z.string().max(500).optional(),
  damagesLimits: z.string().max(500).optional(),

  // Free-form additional context
  additionalTerms: z.string().max(2000).optional(),

  // All remaining extracted data as key-value pairs
  allExtractedData: z.record(z.string(), z.unknown()).optional(),
})

/**
 * AI response schema - strict JSON structure
 */
export const aiContractResponseSchema = z.object({
  contractTitle: z.string().min(1).max(200),
  intro: z.string().max(2000).optional(),
  sections: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        body: z.string().min(1).max(10000),
      })
    )
    .min(1)
    .max(25), // Cap at 25 sections
  exhibits: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        body: z.string().min(1).max(10000),
      })
    )
    .max(10)
    .optional(), // Cap at 10 exhibits
})

export type GenerateContractInput = z.infer<typeof generateContractSchema>
export type AIContractResponse = z.infer<typeof aiContractResponseSchema>
