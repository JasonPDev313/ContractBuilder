'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function getSignatureByToken(token: string) {
  const signature = await prisma.signature.findUnique({
    where: { token },
    include: {
      contract: {
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })

  if (!signature) {
    throw new Error('Signature not found')
  }

  if (signature.status !== 'PENDING') {
    throw new Error('This signature request has already been processed')
  }

  // Check if expired
  if (signature.contract.expiresAt && new Date(signature.contract.expiresAt) < new Date()) {
    await prisma.signature.update({
      where: { id: signature.id },
      data: { status: 'EXPIRED' },
    })
    throw new Error('This signature request has expired')
  }

  return signature
}

export async function signContract({
  token,
  ipAddress,
  userAgent,
}: {
  token: string
  ipAddress?: string
  userAgent?: string
}) {
  const signature = await prisma.signature.findUnique({
    where: { token },
    include: {
      contract: {
        include: {
          signatures: true,
        },
      },
    },
  })

  if (!signature) {
    throw new Error('Signature not found')
  }

  if (signature.status !== 'PENDING') {
    throw new Error('This signature request has already been processed')
  }

  // Update signature
  await prisma.signature.update({
    where: { id: signature.id },
    data: {
      status: 'SIGNED',
      signedAt: new Date(),
      ipAddress,
      userAgent,
    },
  })

  // Check if all signatures are complete
  const allSignatures = signature.contract.signatures
  const allSigned = allSignatures.every(
    (s) => s.id === signature.id || s.status === 'SIGNED'
  )

  // If all signed, update contract status to COMPLETED
  if (allSigned) {
    await prisma.contract.update({
      where: { id: signature.contractId },
      data: { status: 'COMPLETED' },
    })
  }

  revalidatePath(`/contracts/${signature.contractId}`)

  return { success: true, allSigned }
}

export async function declineContract(token: string) {
  const signature = await prisma.signature.findUnique({
    where: { token },
  })

  if (!signature) {
    throw new Error('Signature not found')
  }

  if (signature.status !== 'PENDING') {
    throw new Error('This signature request has already been processed')
  }

  await prisma.signature.update({
    where: { id: signature.id },
    data: {
      status: 'DECLINED',
    },
  })

  revalidatePath(`/contracts/${signature.contractId}`)

  return { success: true }
}
