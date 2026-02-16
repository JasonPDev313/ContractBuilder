import { z } from 'zod'

export const suggestLanguageSchema = z.object({
  // Context
  contractSectionId: z.string().cuid().optional(),
  sectionTitle: z.string().min(1, 'Section title is required').max(200),
  existingContent: z.string().optional(),

  // Parameters
  tone: z.enum(['neutral', 'friendly', 'formal', 'firm']).default('neutral'),
  jurisdiction: z.string().optional(),
  clauseType: z.string().optional(),
  riskPosture: z.enum(['balanced', 'seller-favorable', 'customer-favorable']).default('balanced'),
  keyFacts: z.string().optional(),

  // Advanced options
  useFullContractContext: z.boolean().default(false),
  fullContractContent: z.string().optional(),
})

export const saveSuggestionSchema = z.object({
  contractSectionId: z.string().cuid().optional(),
  sectionTitle: z.string().min(1).max(200),
  originalContent: z.string().optional(),
  suggestedText: z.string().min(1),
  rationale: z.string().optional(),
  alternativeShorter: z.string().optional(),
  alternativeStricter: z.string().optional(),
  tone: z.string().optional(),
  jurisdiction: z.string().optional(),
  riskPosture: z.string().optional(),
  clauseType: z.string().optional(),
  model: z.string(),
})

export const updateUsageLimitSchema = z.object({
  aiDailyLimit: z.number().int().min(0).max(10000).optional(),
  aiMonthlyLimit: z.number().int().min(0).max(100000).optional(),
  aiModel: z.enum(['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo']).optional(),
  aiEnabled: z.boolean().optional(),
})

export type SuggestLanguageInput = z.infer<typeof suggestLanguageSchema>
export type SaveSuggestionInput = z.infer<typeof saveSuggestionSchema>
export type UpdateUsageLimitInput = z.infer<typeof updateUsageLimitSchema>
