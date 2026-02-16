'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSessionOrgId, requireAuth } from '@/lib/auth-utils'
import {
  createTemplateSchema,
  updateTemplateSchema,
  addTemplateSectionSchema,
  updateTemplateSectionSchema,
  reorderTemplateSectionsSchema,
  toggleTemplateSectionSchema,
  type CreateTemplateInput,
  type UpdateTemplateInput,
  type AddTemplateSectionInput,
  type UpdateTemplateSectionInput,
  type ReorderTemplateSectionsInput,
} from '@/lib/validations/template'
import { getDefaultSections } from '@/lib/default-template-sections'
import type { ContractType } from '@/lib/contract-blueprints'
import { getApplicableVenuePolicies, buildVenuePoliciesSectionBody } from '@/lib/venue-policies'
import type { Prisma } from '@prisma/client'

/**
 * Extract variable names from template section bodies.
 * Finds all {{variable_name}} patterns.
 */
function extractVariables(text: string): string[] {
  const variablePattern = /\{\{([^}]+)\}\}/g
  const matches = text.matchAll(variablePattern)
  const variables = new Set<string>()

  for (const match of matches) {
    variables.add(match[1].trim())
  }

  return Array.from(variables)
}

/**
 * Renumber all included sections sequentially (0, 1, 2, ...) in a single transaction.
 * This ensures orderIndex is always contiguous with no gaps.
 */
async function renumberIncludedSections(
  tx: Prisma.TransactionClient,
  templateId: string
) {
  const includedSections = await tx.templateSection.findMany({
    where: { templateId, isIncluded: true },
    orderBy: { order: 'asc' },
    select: { id: true },
  })

  await Promise.all(
    includedSections.map((section, index) =>
      tx.templateSection.update({
        where: { id: section.id },
        data: { order: index },
      })
    )
  )
}

/**
 * Get all active templates for the user's organization.
 * Optionally filter by category.
 */
export async function getTemplates(category?: string) {
  try {
    const session = requireAuth(await auth())
    const orgId = await getSessionOrgId(session)

    const templates = await prisma.contractTemplate.findMany({
      where: {
        organizationId: orgId,
        isActive: true,
        deletedAt: null,
        ...(category && { category }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            sections: true,
            contracts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return { success: true, templates }
  } catch (error) {
    console.error('Error fetching templates:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch templates',
    }
  }
}

/**
 * Get a single template with all its sections ordered by the order field.
 */
export async function getTemplate(id: string) {
  try {
    const session = requireAuth(await auth())
    const orgId = await getSessionOrgId(session)

    const template = await prisma.contractTemplate.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: {
            order: 'asc',
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            contracts: true,
          },
        },
      },
    })

    if (!template) {
      return { success: false, error: 'Template not found' }
    }

    if (template.organizationId !== orgId) {
      return { success: false, error: 'Unauthorized' }
    }

    return { success: true, template }
  } catch (error) {
    console.error('Error fetching template:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch template',
    }
  }
}

/**
 * Create a new contract template.
 * If contractType is provided, seeds default sections automatically.
 * Otherwise, uses the provided inline sections array.
 */
export async function createTemplate(data: CreateTemplateInput) {
  try {
    const session = requireAuth(await auth())
    const orgId = await getSessionOrgId(session)

    const validated = createTemplateSchema.parse(data)

    if (validated.contractType) {
      // New path: create template + seed default sections in one transaction
      const defaultSections = getDefaultSections(validated.contractType as ContractType)

      const template = await prisma.$transaction(async (tx) => {
        const tmpl = await tx.contractTemplate.create({
          data: {
            name: validated.name,
            description: validated.description,
            category: validated.category,
            contractType: validated.contractType,
            organizationId: orgId,
            createdById: session.user.id,
          },
        })

        if (defaultSections && defaultSections.length > 0) {
          await tx.templateSection.createMany({
            data: defaultSections.map((s) => ({
              templateId: tmpl.id,
              title: s.title,
              body: s.body,
              order: s.order,
              isRequired: s.isRequired,
              isDefault: true,
              isIncluded: true,
              variables: extractVariables(s.body),
            })),
          })
        }

        // Inject Venue Policies section from org defaults
        if (validated.contractType) {
          const orgDefaults = await tx.orgContractDefaults.findUnique({
            where: { organizationId: orgId },
          })

          const policies = getApplicableVenuePolicies(orgDefaults, validated.contractType)

          if (policies.length > 0) {
            const venuePoliciesBody = buildVenuePoliciesSectionBody(policies)

            // Find the Governing Law section to insert before it
            const allSections = await tx.templateSection.findMany({
              where: { templateId: tmpl.id },
              orderBy: { order: 'asc' },
            })
            const governingLawSection = allSections.find((s) =>
              s.title.toLowerCase().includes('governing law')
            )
            const insertOrder = governingLawSection
              ? governingLawSection.order
              : allSections.length

            // Shift sections at or after insertOrder
            await tx.templateSection.updateMany({
              where: { templateId: tmpl.id, order: { gte: insertOrder } },
              data: { order: { increment: 1 } },
            })

            await tx.templateSection.create({
              data: {
                templateId: tmpl.id,
                title: 'Venue Policies',
                body: venuePoliciesBody,
                order: insertOrder,
                isRequired: false,
                isDefault: true,
                isIncluded: true,
                variables: [],
              },
            })
          }
        }

        return tx.contractTemplate.findUnique({
          where: { id: tmpl.id },
          include: {
            sections: { orderBy: { order: 'asc' } },
          },
        })
      })

      return { success: true, template }
    }

    // Legacy path: inline sections
    const sectionsWithVariables = (validated.sections || []).map((section) => ({
      ...section,
      variables: extractVariables(section.body),
    }))

    const template = await prisma.contractTemplate.create({
      data: {
        name: validated.name,
        description: validated.description,
        category: validated.category,
        organizationId: orgId,
        createdById: session.user.id,
        sections: {
          create: sectionsWithVariables,
        },
      },
      include: {
        sections: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    return { success: true, template }
  } catch (error) {
    console.error('Error creating template:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create template',
    }
  }
}

/**
 * Update template metadata (name, description, category, isActive).
 * Does not modify sections.
 */
export async function updateTemplate(id: string, data: UpdateTemplateInput) {
  try {
    const session = requireAuth(await auth())
    const orgId = await getSessionOrgId(session)

    const validated = updateTemplateSchema.parse(data)

    // Verify ownership
    const existing = await prisma.contractTemplate.findUnique({
      where: { id },
      select: { organizationId: true },
    })

    if (!existing) {
      return { success: false, error: 'Template not found' }
    }

    if (existing.organizationId !== orgId) {
      return { success: false, error: 'Unauthorized' }
    }

    const template = await prisma.contractTemplate.update({
      where: { id },
      data: validated,
      include: {
        sections: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    return { success: true, template }
  } catch (error) {
    console.error('Error updating template:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update template',
    }
  }
}

/**
 * Add a new section to an existing template.
 * Supports insertAfterOrder for precise positioning.
 * Renumbers all included sections in a transaction.
 */
export async function addTemplateSection(data: AddTemplateSectionInput) {
  try {
    const session = requireAuth(await auth())
    const orgId = await getSessionOrgId(session)

    const validated = addTemplateSectionSchema.parse(data)

    // Verify template ownership
    const template = await prisma.contractTemplate.findUnique({
      where: { id: validated.templateId },
      select: { organizationId: true },
    })

    if (!template) {
      return { success: false, error: 'Template not found' }
    }

    if (template.organizationId !== orgId) {
      return { success: false, error: 'Unauthorized' }
    }

    const section = await prisma.$transaction(async (tx) => {
      // Determine insert position
      const insertOrder =
        validated.insertAfterOrder !== undefined
          ? validated.insertAfterOrder + 1
          : validated.order

      const newSection = await tx.templateSection.create({
        data: {
          templateId: validated.templateId,
          title: validated.title,
          body: validated.body,
          order: insertOrder,
          isRequired: validated.isRequired,
          isDefault: false,
          isIncluded: true,
          variables: extractVariables(validated.body),
        },
      })

      await renumberIncludedSections(tx, validated.templateId)

      return newSection
    })

    return { success: true, section }
  } catch (error) {
    console.error('Error adding template section:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to add template section',
    }
  }
}

/**
 * Update an existing template section.
 * Re-extracts variables if body is updated.
 */
export async function updateTemplateSection(
  sectionId: string,
  data: UpdateTemplateSectionInput
) {
  try {
    const session = requireAuth(await auth())
    const orgId = await getSessionOrgId(session)

    const validated = updateTemplateSectionSchema.parse(data)

    // Verify ownership via template
    const section = await prisma.templateSection.findUnique({
      where: { id: sectionId },
      include: {
        template: {
          select: { organizationId: true },
        },
      },
    })

    if (!section) {
      return { success: false, error: 'Section not found' }
    }

    if (section.template.organizationId !== orgId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Re-extract variables if body is being updated
    const updateData = {
      ...validated,
      ...(validated.body && { variables: extractVariables(validated.body) }),
    }

    const updatedSection = await prisma.templateSection.update({
      where: { id: sectionId },
      data: updateData,
    })

    return { success: true, section: updatedSection }
  } catch (error) {
    console.error('Error updating template section:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update template section',
    }
  }
}

/**
 * Toggle a template section's included state (soft remove / re-include).
 * Renumbers all included sections in a single transaction.
 */
export async function toggleTemplateSection(sectionId: string) {
  try {
    const session = requireAuth(await auth())
    const orgId = await getSessionOrgId(session)

    // Verify ownership
    const section = await prisma.templateSection.findUnique({
      where: { id: sectionId },
      include: {
        template: {
          select: { organizationId: true, id: true },
        },
      },
    })

    if (!section) {
      return { success: false, error: 'Section not found' }
    }

    if (section.template.organizationId !== orgId) {
      return { success: false, error: 'Unauthorized' }
    }

    await prisma.$transaction(async (tx) => {
      // Toggle isIncluded
      await tx.templateSection.update({
        where: { id: sectionId },
        data: { isIncluded: !section.isIncluded },
      })

      // Renumber all included sections
      await renumberIncludedSections(tx, section.template.id)
    })

    return { success: true, isIncluded: !section.isIncluded }
  } catch (error) {
    console.error('Error toggling template section:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to toggle template section',
    }
  }
}

/**
 * Reorder template sections in bulk.
 * Uses a transaction to ensure consistency.
 * Only operates on included sections.
 */
export async function reorderTemplateSections(
  data: ReorderTemplateSectionsInput
) {
  try {
    const session = requireAuth(await auth())
    const orgId = await getSessionOrgId(session)

    const validated = reorderTemplateSectionsSchema.parse(data)

    // Verify template ownership
    const template = await prisma.contractTemplate.findUnique({
      where: { id: validated.templateId },
      select: { organizationId: true },
    })

    if (!template) {
      return { success: false, error: 'Template not found' }
    }

    if (template.organizationId !== orgId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Update order for all sections in a transaction
    await prisma.$transaction(
      validated.sectionIds.map((sectionId, index) =>
        prisma.templateSection.update({
          where: { id: sectionId },
          data: { order: index },
        })
      )
    )

    return { success: true }
  } catch (error) {
    console.error('Error reordering template sections:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to reorder template sections',
    }
  }
}

/**
 * Delete a template section.
 * Default sections are soft-removed (toggled to excluded).
 * Custom sections are hard-deleted.
 * Renumbers remaining included sections.
 */
export async function deleteTemplateSection(sectionId: string) {
  try {
    const session = requireAuth(await auth())
    const orgId = await getSessionOrgId(session)

    // Verify ownership via template
    const section = await prisma.templateSection.findUnique({
      where: { id: sectionId },
      include: {
        template: {
          select: { organizationId: true, id: true },
        },
      },
    })

    if (!section) {
      return { success: false, error: 'Section not found' }
    }

    if (section.template.organizationId !== orgId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Default sections: soft remove (toggle to excluded)
    if (section.isDefault) {
      return toggleTemplateSection(sectionId)
    }

    // Custom sections: hard delete + renumber
    await prisma.$transaction(async (tx) => {
      await tx.templateSection.delete({ where: { id: sectionId } })
      await renumberIncludedSections(tx, section.template.id)
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting template section:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete template section',
    }
  }
}

/**
 * Soft delete a template.
 * Sets deletedAt timestamp instead of actually deleting.
 */
export async function deleteTemplate(id: string) {
  try {
    const session = requireAuth(await auth())
    const orgId = await getSessionOrgId(session)

    // Verify ownership
    const template = await prisma.contractTemplate.findUnique({
      where: { id },
      select: { organizationId: true },
    })

    if (!template) {
      return { success: false, error: 'Template not found' }
    }

    if (template.organizationId !== orgId) {
      return { success: false, error: 'Unauthorized' }
    }

    await prisma.contractTemplate.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting template:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete template',
    }
  }
}
