import { z } from 'zod'

const CONTRACT_TYPE_VALUES = [
  'GOLF_OUTING',
  'GOLF_LEAGUE',
  'WEDDING',
  'SPECIAL_EVENT',
  'OTHER',
] as const

/**
 * Validation schema for creating or updating a template section
 */
export const templateSectionSchema = z.object({
  title: z
    .string()
    .min(1, 'Section title is required')
    .max(200, 'Section title must be less than 200 characters'),
  body: z.string().min(1, 'Section body is required'),
  order: z.number().int().min(0, 'Order must be a non-negative integer'),
  isRequired: z.boolean().optional().default(true),
})

/**
 * Validation schema for creating a new contract template
 * Supports two modes:
 * 1. With contractType: seeds default sections automatically
 * 2. Without contractType: requires inline sections array
 */
export const createTemplateSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Template name is required')
      .max(200, 'Template name must be less than 200 characters'),
    description: z.string().optional(),
    category: z.string().optional(),
    contractType: z.enum(CONTRACT_TYPE_VALUES).optional(),
    sections: z.array(templateSectionSchema).optional(),
  })
  .refine(
    (data) =>
      data.contractType || (data.sections && data.sections.length > 0),
    {
      message: 'Either a contract type or at least one section is required',
    }
  )

/**
 * Validation schema for updating template metadata
 */
export const updateTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(200, 'Template name must be less than 200 characters')
    .optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
})

/**
 * Validation schema for adding a new section to an existing template
 */
export const addTemplateSectionSchema = z.object({
  templateId: z.string().cuid('Invalid template ID'),
  title: z
    .string()
    .min(1, 'Section title is required')
    .max(200, 'Section title must be less than 200 characters'),
  body: z.string().min(1, 'Section body is required'),
  order: z.number().int().min(0, 'Order must be a non-negative integer'),
  isRequired: z.boolean().optional().default(true),
  insertAfterOrder: z.number().int().min(-1).optional(),
})

/**
 * Validation schema for updating an existing template section
 */
export const updateTemplateSectionSchema = z.object({
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
  isRequired: z.boolean().optional(),
})

/**
 * Validation schema for reordering template sections
 */
export const reorderTemplateSectionsSchema = z.object({
  templateId: z.string().cuid('Invalid template ID'),
  sectionIds: z
    .array(z.string().cuid('Invalid section ID'))
    .min(1, 'Must provide at least one section ID'),
})

/**
 * Validation schema for toggling a template section's included state
 */
export const toggleTemplateSectionSchema = z.object({
  sectionId: z.string().cuid('Invalid section ID'),
})

/**
 * Type exports for TypeScript usage
 */
export type TemplateSectionInput = z.infer<typeof templateSectionSchema>
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>
export type AddTemplateSectionInput = z.infer<typeof addTemplateSectionSchema>
export type UpdateTemplateSectionInput = z.infer<
  typeof updateTemplateSectionSchema
>
export type ReorderTemplateSectionsInput = z.infer<
  typeof reorderTemplateSectionsSchema
>
export type ToggleTemplateSectionInput = z.infer<
  typeof toggleTemplateSectionSchema
>
