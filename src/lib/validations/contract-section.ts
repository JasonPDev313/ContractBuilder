import { z } from 'zod'

/**
 * Validation schema for updating a contract section
 */
export const updateContractSectionSchema = z.object({
  title: z
    .string()
    .min(1, 'Section title is required')
    .max(200, 'Section title must be less than 200 characters')
    .optional(),
  body: z.string().min(1, 'Section body is required').optional(),
  order: z
    .number()
    .int()
    .min(0, 'Order must be a non-negative integer')
    .optional(),
})

/**
 * Validation schema for reordering contract sections
 */
export const reorderContractSectionsSchema = z.object({
  contractId: z.string().cuid('Invalid contract ID'),
  sectionIds: z
    .array(z.string().cuid('Invalid section ID'))
    .min(1, 'Must provide at least one section ID'),
})

/**
 * Validation schema for creating a contract from a template
 */
export const createContractFromTemplateSchema = z.object({
  templateId: z.string().cuid('Invalid template ID'),
  title: z
    .string()
    .min(1, 'Contract title is required')
    .max(200, 'Contract title must be less than 200 characters'),
  description: z.string().optional(),
  variables: z.record(z.string(), z.string()).optional(),
  expiresAt: z
    .string()
    .datetime()
    .or(z.date())
    .optional()
    .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
})

/**
 * Validation schema for adding a new section to an existing contract
 */
export const addContractSectionSchema = z.object({
  contractId: z.string().cuid('Invalid contract ID'),
  title: z
    .string()
    .min(1, 'Section title is required')
    .max(200, 'Section title must be less than 200 characters'),
  body: z.string().min(1, 'Section body is required'),
  order: z.number().int().min(0, 'Order must be a non-negative integer'),
})

/**
 * Type exports for TypeScript usage
 */
export type UpdateContractSectionInput = z.infer<
  typeof updateContractSectionSchema
>
export type ReorderContractSectionsInput = z.infer<
  typeof reorderContractSectionsSchema
>
export type CreateContractFromTemplateInput = z.infer<
  typeof createContractFromTemplateSchema
>
export type AddContractSectionInput = z.infer<typeof addContractSectionSchema>
