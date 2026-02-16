'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSessionOrgId, requireAuth } from '@/lib/auth-utils'
import {
  updateContractSectionSchema,
  reorderContractSectionsSchema,
  addContractSectionSchema,
  type UpdateContractSectionInput,
  type ReorderContractSectionsInput,
  type AddContractSectionInput,
} from '@/lib/validations/contract-section'

/**
 * Get all sections for a contract, ordered by the order field.
 */
export async function getContractSections(contractId: string) {
  try {
    const session = requireAuth(await auth())
    const orgId = await getSessionOrgId(session)

    // Verify contract ownership
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { organizationId: true, createdById: true },
    })

    if (!contract) {
      return { success: false, error: 'Contract not found' }
    }

    // User must own the contract or be in same org
    if (
      contract.organizationId !== orgId &&
      contract.createdById !== session.user.id
    ) {
      return { success: false, error: 'Unauthorized' }
    }

    const sections = await prisma.contractSection.findMany({
      where: { contractId },
      orderBy: {
        order: 'asc',
      },
    })

    return { success: true, sections }
  } catch (error) {
    console.error('Error fetching contract sections:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch contract sections',
    }
  }
}

/**
 * Update an individual contract section.
 * Marks the section as edited if the body or title is changed.
 */
export async function updateContractSection(
  sectionId: string,
  data: UpdateContractSectionInput
) {
  try {
    const session = requireAuth(await auth())
    const orgId = await getSessionOrgId(session)

    const validated = updateContractSectionSchema.parse(data)

    // Verify ownership via contract
    const section = await prisma.contractSection.findUnique({
      where: { id: sectionId },
      include: {
        contract: {
          select: {
            organizationId: true,
            createdById: true,
          },
        },
      },
    })

    if (!section) {
      return { success: false, error: 'Section not found' }
    }

    // User must own the contract or be in same org
    if (
      section.contract.organizationId !== orgId &&
      section.contract.createdById !== session.user.id
    ) {
      return { success: false, error: 'Unauthorized' }
    }

    // Mark as edited if title or body is being changed
    const isBeingEdited = !!(validated.title || validated.body)

    const updatedSection = await prisma.contractSection.update({
      where: { id: sectionId },
      data: {
        ...validated,
        ...(isBeingEdited && { isEdited: true }),
      },
    })

    return { success: true, section: updatedSection }
  } catch (error) {
    console.error('Error updating contract section:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update contract section',
    }
  }
}

/**
 * Add a new section to an existing contract.
 */
export async function addContractSection(data: AddContractSectionInput) {
  try {
    const session = requireAuth(await auth())
    const orgId = await getSessionOrgId(session)

    const validated = addContractSectionSchema.parse(data)

    // Verify contract ownership
    const contract = await prisma.contract.findUnique({
      where: { id: validated.contractId },
      select: { organizationId: true, createdById: true },
    })

    if (!contract) {
      return { success: false, error: 'Contract not found' }
    }

    // User must own the contract or be in same org
    if (
      contract.organizationId !== orgId &&
      contract.createdById !== session.user.id
    ) {
      return { success: false, error: 'Unauthorized' }
    }

    const section = await prisma.contractSection.create({
      data: {
        contractId: validated.contractId,
        title: validated.title,
        body: validated.body,
        order: validated.order,
        isEdited: false,
      },
    })

    return { success: true, section }
  } catch (error) {
    console.error('Error adding contract section:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to add contract section',
    }
  }
}

/**
 * Reorder contract sections in bulk.
 * Uses a transaction to ensure consistency.
 */
export async function reorderContractSections(
  data: ReorderContractSectionsInput
) {
  try {
    const session = requireAuth(await auth())
    const orgId = await getSessionOrgId(session)

    const validated = reorderContractSectionsSchema.parse(data)

    // Verify contract ownership
    const contract = await prisma.contract.findUnique({
      where: { id: validated.contractId },
      select: { organizationId: true, createdById: true },
    })

    if (!contract) {
      return { success: false, error: 'Contract not found' }
    }

    // User must own the contract or be in same org
    if (
      contract.organizationId !== orgId &&
      contract.createdById !== session.user.id
    ) {
      return { success: false, error: 'Unauthorized' }
    }

    // Update order for all sections in a transaction
    await prisma.$transaction(
      validated.sectionIds.map((sectionId, index) =>
        prisma.contractSection.update({
          where: { id: sectionId },
          data: { order: index },
        })
      )
    )

    return { success: true }
  } catch (error) {
    console.error('Error reordering contract sections:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to reorder contract sections',
    }
  }
}

/**
 * Delete a contract section.
 */
export async function deleteContractSection(sectionId: string) {
  try {
    const session = requireAuth(await auth())
    const orgId = await getSessionOrgId(session)

    // Verify ownership via contract
    const section = await prisma.contractSection.findUnique({
      where: { id: sectionId },
      include: {
        contract: {
          select: {
            organizationId: true,
            createdById: true,
          },
        },
      },
    })

    if (!section) {
      return { success: false, error: 'Section not found' }
    }

    // User must own the contract or be in same org
    if (
      section.contract.organizationId !== orgId &&
      section.contract.createdById !== session.user.id
    ) {
      return { success: false, error: 'Unauthorized' }
    }

    await prisma.contractSection.delete({
      where: { id: sectionId },
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting contract section:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete contract section',
    }
  }
}
