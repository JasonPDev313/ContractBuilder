'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { contractSchema, sendContractSchema } from '@/lib/validations/contract'
import { createContractFromTemplateSchema } from '@/lib/validations/contract-section'
import { auth } from '@/lib/auth'
import { getSessionOrgId, requireAuth } from '@/lib/auth-utils'

export async function getContracts() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const contracts = await prisma.contract.findMany({
    where: { createdById: (session.user as any).id },
    include: {
      signatures: {
        select: {
          id: true,
          signerEmail: true,
          signerName: true,
          status: true,
          signedAt: true,
          signatureSvg: true,
          createdAt: true,
          updatedAt: true,
          contractId: true,
          token: true,
          signerId: true,
          ipAddress: true,
          userAgent: true,
        },
      },
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return contracts
}

export async function getContract(id: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      signatures: {
        select: {
          id: true,
          signerEmail: true,
          signerName: true,
          status: true,
          signedAt: true,
          signatureSvg: true,
          createdAt: true,
          updatedAt: true,
          contractId: true,
          token: true,
          signerId: true,
          ipAddress: true,
          userAgent: true,
        },
      },
      sections: {
        orderBy: {
          order: 'asc',
        },
      },
      template: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  if (!contract || contract.createdById !== (session.user as any).id) {
    throw new Error('Not found or unauthorized')
  }

  return contract
}

export async function createContract(data: unknown) {
  const session = requireAuth(await auth())
  const orgId = await getSessionOrgId(session)

  const validatedData = contractSchema.parse(data)

  const contract = await prisma.contract.create({
    data: {
      ...validatedData,
      createdById: session.user.id,
      organizationId: orgId,
    },
  })

  revalidatePath('/contracts')
  return contract
}

/**
 * Create a new contract from a template.
 * Copies all template sections, replaces variables, and increments usage count.
 */
export async function createContractFromTemplate(data: unknown) {
  const session = requireAuth(await auth())
  const orgId = await getSessionOrgId(session)

  const validatedData = createContractFromTemplateSchema.parse(data)

  // Fetch template with sections
  const template = await prisma.contractTemplate.findUnique({
    where: { id: validatedData.templateId },
    include: {
      sections: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  })

  if (!template) {
    throw new Error('Template not found')
  }

  if (template.organizationId !== orgId) {
    throw new Error('Unauthorized')
  }

  if (!template.isActive) {
    throw new Error('Template is not active')
  }

  // Replace variables in section bodies
  const replaceVariables = (text: string, variables?: Record<string, string>) => {
    let result = text
    if (!variables) return result
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
      result = result.replace(pattern, value)
    }
    return result
  }

  // Create contract with copied sections in a transaction
  const contract = await prisma.$transaction(async (tx) => {
    // Create the contract
    const newContract = await tx.contract.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        content: null, // Section-based contracts have null content
        templateId: template.id,
        organizationId: orgId,
        createdById: session.user.id,
        expiresAt: validatedData.expiresAt,
      },
    })

    // Copy all sections from template
    const sectionsData = template.sections.map((section) => ({
      contractId: newContract.id,
      title: section.title,
      body: replaceVariables(section.body, validatedData.variables as Record<string, string> | undefined),
      order: section.order,
      isEdited: false,
      originalTemplateSectionId: section.id,
    }))

    await tx.contractSection.createMany({
      data: sectionsData,
    })

    // Increment template usage count
    await tx.contractTemplate.update({
      where: { id: template.id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    })

    return newContract
  })

  revalidatePath('/contracts')
  return contract
}

export async function updateContract(id: string, data: unknown) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const validatedData = contractSchema.parse(data)

  const contract = await prisma.contract.findUnique({
    where: { id },
  })

  if (!contract || contract.createdById !== (session.user as any).id) {
    throw new Error('Not found or unauthorized')
  }

  const updated = await prisma.contract.update({
    where: { id },
    data: validatedData,
  })

  revalidatePath('/contracts')
  revalidatePath(`/contracts/${id}`)
  return updated
}

export async function deleteContract(id: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const contract = await prisma.contract.findUnique({
    where: { id },
  })

  if (!contract || contract.createdById !== (session.user as any).id) {
    throw new Error('Not found or unauthorized')
  }

  await prisma.contract.delete({
    where: { id },
  })

  revalidatePath('/contracts')
  return { success: true }
}

export async function sendContract(data: unknown) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const validatedData = sendContractSchema.parse(data)

  // Verify ownership
  const contract = await prisma.contract.findUnique({
    where: { id: validatedData.contractId },
  })

  if (!contract || contract.createdById !== (session.user as any).id) {
    throw new Error('Not found or unauthorized')
  }

  // Create signatures for each recipient
  const signatures = await Promise.all(
    validatedData.recipients.map((recipient) =>
      prisma.signature.create({
        data: {
          contractId: validatedData.contractId,
          signerEmail: recipient.email,
          signerName: recipient.name,
        },
      })
    )
  )

  // Update contract status
  await prisma.contract.update({
    where: { id: validatedData.contractId },
    data: { status: 'SENT' },
  })

  // Send emails to recipients with signature links
  const { sendContractInvitation } = await import('@/lib/email/resend')

  await Promise.all(
    signatures.map((signature) =>
      sendContractInvitation({
        to: signature.signerEmail,
        name: signature.signerName,
        contractTitle: contract.title,
        signatureToken: signature.token,
      })
    )
  )

  revalidatePath('/contracts')
  return signatures
}
