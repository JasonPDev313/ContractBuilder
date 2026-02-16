'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSessionOrgId, requireAuth, requireAdmin } from '@/lib/auth-utils'
import {
  inviteUserSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
  revokeInviteSchema,
  resendInviteSchema,
} from '@/lib/validations/user-management'
import { createHash, randomBytes } from 'crypto'

function generateInviteToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('base64url')
  const hash = createHash('sha256').update(raw).digest('hex')
  return { raw, hash }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Get the current user's basic info (id, role) for client components.
 */
export async function getCurrentUser() {
  try {
    const session = requireAuth(await auth())
    return {
      success: true as const,
      user: {
        id: session.user.id,
        role: session.user.role,
      },
    }
  } catch {
    return { success: false as const, user: null }
  }
}

/**
 * Get all members of the current organization.
 */
export async function getOrgMembers() {
  try {
    const session = requireAuth(await auth())
    const orgId = await getSessionOrgId(session)

    const members = await prisma.user.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    })

    return { success: true as const, members }
  } catch (error) {
    console.error('Error fetching org members:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to fetch members',
    }
  }
}

/**
 * Get pending invitations for the current organization.
 */
export async function getOrgInvites() {
  try {
    const session = requireAuth(await auth())
    const orgId = await getSessionOrgId(session)

    const invites = await prisma.orgInvite.findMany({
      where: {
        organizationId: orgId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
        invitedBy: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true as const, invites }
  } catch (error) {
    console.error('Error fetching org invites:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to fetch invites',
    }
  }
}

/**
 * Invite a user to the current organization. Requires ADMIN role.
 */
export async function inviteUser(data: unknown) {
  try {
    const session = requireAuth(await auth())
    requireAdmin(session)
    const orgId = await getSessionOrgId(session)

    const validated = inviteUserSchema.parse(data)

    // Check if user is already in this org
    const existingMember = await prisma.user.findFirst({
      where: {
        email: validated.email,
        organizationId: orgId,
      },
    })

    if (existingMember) {
      return { success: false as const, error: 'This user is already a member of your organization' }
    }

    // Check for existing pending invite (delete it so we can create a fresh one)
    await prisma.orgInvite.deleteMany({
      where: {
        organizationId: orgId,
        email: validated.email,
      },
    })

    // Generate token
    const { raw, hash } = generateInviteToken()

    // Create invite with 7-day expiry
    await prisma.orgInvite.create({
      data: {
        organizationId: orgId,
        email: validated.email,
        role: validated.role,
        token: hash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        invitedById: session.user.id,
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const inviteLink = `${baseUrl}/accept-invite?token=${raw}`

    revalidatePath('/settings/users')

    return { success: true as const, inviteLink }
  } catch (error) {
    console.error('Error inviting user:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to send invitation',
    }
  }
}

/**
 * Resend an invitation with a new token. Requires ADMIN role.
 */
export async function resendInvite(data: unknown) {
  try {
    const session = requireAuth(await auth())
    requireAdmin(session)
    const orgId = await getSessionOrgId(session)

    const validated = resendInviteSchema.parse(data)

    const invite = await prisma.orgInvite.findFirst({
      where: {
        id: validated.inviteId,
        organizationId: orgId,
        acceptedAt: null,
        revokedAt: null,
      },
    })

    if (!invite) {
      return { success: false as const, error: 'Invitation not found' }
    }

    // Regenerate token and extend expiry
    const { raw, hash } = generateInviteToken()

    await prisma.orgInvite.update({
      where: { id: invite.id },
      data: {
        token: hash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const inviteLink = `${baseUrl}/accept-invite?token=${raw}`

    revalidatePath('/settings/users')

    return { success: true as const, inviteLink }
  } catch (error) {
    console.error('Error resending invite:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to resend invitation',
    }
  }
}

/**
 * Revoke a pending invitation. Requires ADMIN role.
 */
export async function revokeInvite(data: unknown) {
  try {
    const session = requireAuth(await auth())
    requireAdmin(session)
    const orgId = await getSessionOrgId(session)

    const validated = revokeInviteSchema.parse(data)

    const invite = await prisma.orgInvite.findFirst({
      where: {
        id: validated.inviteId,
        organizationId: orgId,
        acceptedAt: null,
        revokedAt: null,
      },
    })

    if (!invite) {
      return { success: false as const, error: 'Invitation not found' }
    }

    await prisma.orgInvite.update({
      where: { id: invite.id },
      data: { revokedAt: new Date() },
    })

    revalidatePath('/settings/users')

    return { success: true as const }
  } catch (error) {
    console.error('Error revoking invite:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to revoke invitation',
    }
  }
}

/**
 * Update a member's role. Requires ADMIN role.
 */
export async function updateMemberRole(data: unknown) {
  try {
    const session = requireAuth(await auth())
    requireAdmin(session)
    const orgId = await getSessionOrgId(session)

    const validated = updateMemberRoleSchema.parse(data)

    // Cannot change own role
    if (validated.userId === session.user.id) {
      return { success: false as const, error: 'You cannot change your own role' }
    }

    // Verify user belongs to this org
    const member = await prisma.user.findFirst({
      where: {
        id: validated.userId,
        organizationId: orgId,
      },
    })

    if (!member) {
      return { success: false as const, error: 'Member not found' }
    }

    // If demoting an admin, check that at least one other admin remains
    if (member.role === 'ADMIN' && validated.role !== 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: {
          organizationId: orgId,
          role: 'ADMIN',
        },
      })
      if (adminCount <= 1) {
        return { success: false as const, error: 'Cannot demote the last admin. Promote another member first.' }
      }
    }

    await prisma.user.update({
      where: { id: validated.userId },
      data: { role: validated.role },
    })

    revalidatePath('/settings/users')

    return { success: true as const }
  } catch (error) {
    console.error('Error updating member role:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to update role',
    }
  }
}

/**
 * Remove a member from the organization. Requires ADMIN role.
 */
export async function removeMember(data: unknown) {
  try {
    const session = requireAuth(await auth())
    requireAdmin(session)
    const orgId = await getSessionOrgId(session)

    const validated = removeMemberSchema.parse(data)

    // Cannot remove self
    if (validated.userId === session.user.id) {
      return { success: false as const, error: 'You cannot remove yourself from the organization' }
    }

    // Verify user belongs to this org
    const member = await prisma.user.findFirst({
      where: {
        id: validated.userId,
        organizationId: orgId,
      },
    })

    if (!member) {
      return { success: false as const, error: 'Member not found' }
    }

    // If removing an admin, check that at least one other admin remains
    if (member.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: {
          organizationId: orgId,
          role: 'ADMIN',
        },
      })
      if (adminCount <= 1) {
        return { success: false as const, error: 'Cannot remove the last admin' }
      }
    }

    // Remove from org — they'll get a new personal org on next login
    await prisma.user.update({
      where: { id: validated.userId },
      data: {
        organizationId: null,
        role: 'ADMIN', // They'll be admin of their new personal org
      },
    })

    revalidatePath('/settings/users')

    return { success: true as const }
  } catch (error) {
    console.error('Error removing member:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to remove member',
    }
  }
}

/**
 * Accept an organization invitation. No auth required — user may not be logged in.
 * Returns status info for the accept-invite page to render.
 */
export async function acceptInvite(token: string) {
  try {
    const tokenHash = hashToken(token)

    const invite = await prisma.orgInvite.findUnique({
      where: { token: tokenHash },
      include: {
        organization: { select: { name: true } },
      },
    })

    if (!invite) {
      return { success: false as const, error: 'Invalid invitation link' }
    }

    if (invite.revokedAt) {
      return { success: false as const, error: 'This invitation has been revoked' }
    }

    if (invite.acceptedAt) {
      return { success: false as const, error: 'This invitation has already been accepted' }
    }

    if (invite.expiresAt < new Date()) {
      return { success: false as const, error: 'This invitation has expired' }
    }

    // Check if a user with this email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
    })

    if (!existingUser) {
      // User needs to register first
      return {
        success: true as const,
        needsRegistration: true,
        email: invite.email,
        orgName: invite.organization.name,
      }
    }

    // Move user to the new org
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingUser.id },
        data: {
          organizationId: invite.organizationId,
          role: invite.role,
        },
      })

      await tx.orgInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      })
    })

    return {
      success: true as const,
      needsRegistration: false,
      orgName: invite.organization.name,
    }
  } catch (error) {
    console.error('Error accepting invite:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to accept invitation',
    }
  }
}
