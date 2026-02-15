'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { contractSchema, sendContractSchema } from '@/lib/validations/contract'
import { auth } from '@/lib/auth'

export async function getContracts() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const contracts = await prisma.contract.findMany({
    where: { createdById: (session.user as any).id },
    include: {
      signatures: true,
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
      signatures: true,
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
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const validatedData = contractSchema.parse(data)

  const contract = await prisma.contract.create({
    data: {
      ...validatedData,
      createdById: session.user.id,
    },
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
