'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSessionOrgId } from '@/lib/auth-utils'
import {
  sendContractSchema,
  trackPublicViewSchema,
  cancelContractSchema,
  resendContractSchema,
  type SendContractInput,
  type TrackPublicViewInput,
  type CancelContractInput,
  type ResendContractInput,
} from '@/lib/validations/contract-delivery'
import { createHash, randomBytes } from 'crypto'

// Generate a secure random token
function generateAccessToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url') // 43 characters, URL-safe
  const hash = createHash('sha256').update(token).digest('hex')
  return { token, hash }
}

// Hash a token for verification
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Send a contract to a recipient
 * Generates a unique public access link and creates delivery record
 */
export async function sendContract(data: unknown) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const validatedData = sendContractSchema.parse(data)
    const orgId = await getSessionOrgId(session)

    // Verify contract ownership
    const contract = await prisma.contract.findUnique({
      where: { id: validatedData.contractId },
      include: {
        sections: { orderBy: { order: 'asc' } },
      },
    })

    if (!contract || contract.organizationId !== orgId) {
      return { success: false, error: 'Contract not found or unauthorized' }
    }

    // Cannot send already sent/completed/cancelled contracts
    if (
      contract.status === 'SENT' ||
      contract.status === 'VIEWED' ||
      contract.status === 'COMPLETED'
    ) {
      return {
        success: false,
        error: `Cannot send contract with status: ${contract.status}`,
      }
    }

    // Generate secure access token
    const { token, hash } = generateAccessToken()

    // Create recipient and delivery in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create or update recipient
      const recipient = await tx.contractRecipient.create({
        data: {
          name: validatedData.recipientName,
          email: validatedData.recipientEmail,
          phone: validatedData.recipientPhone,
          contractId: contract.id,
          accessToken: token,
          accessTokenHash: hash,
          tokenExpiresAt: validatedData.tokenExpiresAt,
        },
      })

      // Create delivery record
      const delivery = await tx.contractDelivery.create({
        data: {
          contractId: contract.id,
          recipientId: recipient.id,
          deliveryMethod: 'EMAIL',
          sentBy: session.user.id,
          emailSubject:
            validatedData.emailSubject || `Contract: ${contract.title}`,
          emailBody: validatedData.emailMessage,
        },
      })

      // Update contract status to SENT
      await tx.contract.update({
        where: { id: contract.id },
        data: { status: 'SENT' },
      })

      // Log event
      await tx.contractEvent.create({
        data: {
          contractId: contract.id,
          recipientId: recipient.id,
          eventType: 'SENT',
          userId: session.user.id,
          description: `Contract sent to ${validatedData.recipientEmail}`,
          eventData: {
            deliveryId: delivery.id,
            recipientName: validatedData.recipientName,
            recipientEmail: validatedData.recipientEmail,
          },
        },
      })

      return { recipient, delivery }
    })

    // Generate public link
    const publicLink = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL}/c/${token}`

    return {
      success: true,
      recipientId: result.recipient.id,
      deliveryId: result.delivery.id,
      publicLink,
      message: 'Contract sent successfully',
    }
  } catch (error) {
    console.error('Error sending contract:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to send contract' }
  }
}

/**
 * Track when a recipient views the contract via public link
 */
export async function trackPublicView(data: unknown) {
  try {
    const validatedData = trackPublicViewSchema.parse(data)

    // Hash the token to find the recipient
    const tokenHash = hashToken(validatedData.accessToken)

    const recipient = await prisma.contractRecipient.findUnique({
      where: { accessTokenHash: tokenHash },
      include: {
        contract: true,
      },
    })

    if (!recipient) {
      return { success: false, error: 'Invalid or expired link' }
    }

    // Check if token is expired
    if (recipient.tokenExpiresAt && recipient.tokenExpiresAt < new Date()) {
      return { success: false, error: 'This link has expired' }
    }

    // Check if contract is cancelled
    if (recipient.contract.status === 'CANCELLED') {
      return { success: false, error: 'This contract has been cancelled' }
    }

    const isFirstView = recipient.viewCount === 0

    // Update recipient view tracking and contract status
    await prisma.$transaction(async (tx) => {
      // Update recipient view data
      await tx.contractRecipient.update({
        where: { id: recipient.id },
        data: {
          viewCount: { increment: 1 },
          firstViewedAt: isFirstView ? new Date() : recipient.firstViewedAt,
          lastViewedAt: new Date(),
          lastActivityAt: new Date(),
        },
      })

      // Update contract status to VIEWED if this is first view and status is SENT
      if (isFirstView && recipient.contract.status === 'SENT') {
        await tx.contract.update({
          where: { id: recipient.contractId },
          data: { status: 'VIEWED' },
        })
      }

      // Log event only on first view
      if (isFirstView) {
        await tx.contractEvent.create({
          data: {
            contractId: recipient.contractId,
            recipientId: recipient.id,
            eventType: 'VIEWED',
            ipAddress: validatedData.ipAddress,
            userAgent: validatedData.userAgent,
            description: `Contract viewed by ${recipient.email}`,
            eventData: {
              recipientName: recipient.name,
              recipientEmail: recipient.email,
              firstView: true,
            },
          },
        })
      }
    })

    return {
      success: true,
      contract: {
        id: recipient.contract.id,
        title: recipient.contract.title,
        description: recipient.contract.description,
        status: recipient.contract.status,
      },
      recipient: {
        name: recipient.name,
        email: recipient.email,
      },
      viewCount: recipient.viewCount + 1,
      isFirstView,
    }
  } catch (error) {
    console.error('Error tracking view:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to track view' }
  }
}

/**
 * Cancel/recall a sent contract
 */
export async function cancelContract(data: unknown) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const validatedData = cancelContractSchema.parse(data)
    const orgId = await getSessionOrgId(session)

    // Verify contract ownership
    const contract = await prisma.contract.findUnique({
      where: { id: validatedData.contractId },
    })

    if (!contract || contract.organizationId !== orgId) {
      return { success: false, error: 'Contract not found or unauthorized' }
    }

    // Cannot cancel draft or already completed contracts
    if (contract.status === 'DRAFT') {
      return { success: false, error: 'Cannot cancel a draft contract' }
    }

    if (contract.status === 'COMPLETED') {
      return { success: false, error: 'Cannot cancel a completed contract' }
    }

    if (contract.status === 'CANCELLED') {
      return { success: false, error: 'Contract is already cancelled' }
    }

    // Update contract status and log event
    await prisma.$transaction(async (tx) => {
      // Update contract status
      await tx.contract.update({
        where: { id: contract.id },
        data: { status: 'CANCELLED' },
      })

      // Update all recipients' last activity
      await tx.contractRecipient.updateMany({
        where: { contractId: contract.id },
        data: { lastActivityAt: new Date() },
      })

      // Log cancellation event
      await tx.contractEvent.create({
        data: {
          contractId: contract.id,
          eventType: 'CANCELLED',
          userId: session.user.id,
          description: validatedData.reason
            ? `Contract cancelled: ${validatedData.reason}`
            : 'Contract cancelled',
          eventData: {
            cancelledBy: session.user.id,
            cancelledByName: session.user.name,
            reason: validatedData.reason,
          },
        },
      })
    })

    return {
      success: true,
      message: 'Contract cancelled successfully',
    }
  } catch (error) {
    console.error('Error cancelling contract:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to cancel contract' }
  }
}

/**
 * Resend contract to an existing recipient
 */
export async function resendContract(data: unknown) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const validatedData = resendContractSchema.parse(data)
    const orgId = await getSessionOrgId(session)

    // Verify contract ownership
    const contract = await prisma.contract.findUnique({
      where: { id: validatedData.contractId },
    })

    if (!contract || contract.organizationId !== orgId) {
      return { success: false, error: 'Contract not found or unauthorized' }
    }

    // Verify recipient belongs to this contract
    const recipient = await prisma.contractRecipient.findFirst({
      where: {
        id: validatedData.recipientId,
        contractId: contract.id,
      },
    })

    if (!recipient) {
      return { success: false, error: 'Recipient not found' }
    }

    // Cannot resend cancelled or completed contracts
    if (contract.status === 'CANCELLED') {
      return { success: false, error: 'Cannot resend a cancelled contract' }
    }

    if (contract.status === 'COMPLETED') {
      return { success: false, error: 'Cannot resend a completed contract' }
    }

    // Create new delivery record and log event
    const result = await prisma.$transaction(async (tx) => {
      // Create new delivery record (keeps same access token)
      const delivery = await tx.contractDelivery.create({
        data: {
          contractId: contract.id,
          recipientId: recipient.id,
          deliveryMethod: 'EMAIL',
          sentBy: session.user.id,
          emailSubject:
            validatedData.emailSubject || `Contract: ${contract.title}`,
          emailBody: validatedData.emailMessage,
        },
      })

      // Update recipient's last activity
      await tx.contractRecipient.update({
        where: { id: recipient.id },
        data: { lastActivityAt: new Date() },
      })

      // Log resend event
      await tx.contractEvent.create({
        data: {
          contractId: contract.id,
          recipientId: recipient.id,
          eventType: 'RESENT',
          userId: session.user.id,
          description: `Contract resent to ${recipient.email}`,
          eventData: {
            deliveryId: delivery.id,
            recipientEmail: recipient.email,
          },
        },
      })

      return { delivery }
    })

    // Public link remains the same (same access token)
    const publicLink = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL}/c/${recipient.accessToken}`

    return {
      success: true,
      deliveryId: result.delivery.id,
      publicLink,
      message: 'Contract resent successfully',
    }
  } catch (error) {
    console.error('Error resending contract:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to resend contract' }
  }
}

/**
 * Get sent contracts for the organization
 */
export async function getSentContracts(filters?: {
  status?: string
  recipientEmail?: string
  startDate?: Date
  endDate?: Date
}) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const orgId = await getSessionOrgId(session)

    const where: any = {
      organizationId: orgId,
      status: {
        in: ['SENT', 'VIEWED', 'COMPLETED', 'CANCELLED'],
      },
    }

    if (filters?.status) {
      where.status = filters.status
    }

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        recipients: {
          where: filters?.recipientEmail
            ? {
                email: {
                  contains: filters.recipientEmail,
                  mode: 'insensitive',
                },
              }
            : undefined,
          orderBy: { createdAt: 'desc' },
        },
        signatures: {
          select: {
            id: true,
            signerName: true,
            signerEmail: true,
            status: true,
            signedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        deliveries: {
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return {
      success: true,
      contracts,
    }
  } catch (error) {
    console.error('Error fetching sent contracts:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to fetch sent contracts' }
  }
}

/**
 * Get contract events/activity timeline
 */
export async function getContractEvents(contractId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const orgId = await getSessionOrgId(session)

    // Verify contract ownership
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    })

    if (!contract || contract.organizationId !== orgId) {
      return { success: false, error: 'Contract not found or unauthorized' }
    }

    const events = await prisma.contractEvent.findMany({
      where: { contractId },
      include: {
        recipient: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return {
      success: true,
      events,
    }
  } catch (error) {
    console.error('Error fetching contract events:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to fetch contract events' }
  }
}

/**
 * Get public contract by access token (for recipient view)
 */
export async function getPublicContract(accessToken: string) {
  try {
    const tokenHash = hashToken(accessToken)

    const recipient = await prisma.contractRecipient.findUnique({
      where: { accessTokenHash: tokenHash },
      include: {
        contract: {
          include: {
            sections: {
              orderBy: { order: 'asc' },
            },
            template: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        },
      },
    })

    if (!recipient) {
      return { success: false, error: 'Invalid or expired link' }
    }

    // Check if token is expired
    if (recipient.tokenExpiresAt && recipient.tokenExpiresAt < new Date()) {
      return { success: false, error: 'This link has expired' }
    }

    // Check if contract is cancelled
    if (recipient.contract.status === 'CANCELLED') {
      return {
        success: false,
        error: 'This contract has been cancelled',
        cancelled: true,
      }
    }

    return {
      success: true,
      contract: recipient.contract,
      recipient: {
        name: recipient.name,
        email: recipient.email,
      },
    }
  } catch (error) {
    console.error('Error fetching public contract:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to fetch contract' }
  }
}
