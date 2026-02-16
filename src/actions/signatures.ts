'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { signContractSchema, type SignatureData } from '@/lib/validations/signature'
import { strokesToSvgPath } from '@/lib/signature-utils'

export async function getSignatureByToken(token: string) {
  const signature = await prisma.signature.findUnique({
    where: { token },
    include: {
      contract: {
        include: {
          sections: {
            orderBy: { order: 'asc' as const },
          },
          signatures: {
            select: {
              id: true,
              signerName: true,
              signerEmail: true,
              status: true,
              signedAt: true,
              signatureSvg: true,
            },
          },
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

  // Check if expired
  if (
    signature.status === 'PENDING' &&
    signature.contract.expiresAt &&
    new Date(signature.contract.expiresAt) < new Date()
  ) {
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
  signatureData,
  ipAddress,
  userAgent,
}: {
  token: string
  signatureData: SignatureData
  ipAddress?: string
  userAgent?: string
}) {
  // Validate input
  signContractSchema.parse({ token, signatureData, ipAddress, userAgent })

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

  // Generate SVG path from stroke data
  const signatureSvg = strokesToSvgPath(signatureData.strokes)

  // Update signature with drawn signature data
  await prisma.signature.update({
    where: { id: signature.id },
    data: {
      status: 'SIGNED',
      signedAt: new Date(),
      ipAddress,
      userAgent,
      signatureData: signatureData as any,
      signatureSvg,
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
