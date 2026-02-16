'use server'

import { hash } from 'bcryptjs'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations/auth'

export async function register(data: unknown, inviteToken?: string) {
  try {
    // Validate input
    const validatedData = registerSchema.parse(data)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return {
        success: false,
        error: 'A user with this email already exists',
      }
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 10)

    // Check if there's a valid invite token
    let inviteOrg: { id: string; role: 'ADMIN' | 'MANAGER' | 'VIEWER' } | null = null
    let inviteId: string | null = null

    if (inviteToken) {
      const tokenHash = createHash('sha256').update(inviteToken).digest('hex')
      const invite = await prisma.orgInvite.findUnique({
        where: { token: tokenHash },
      })

      if (
        invite &&
        !invite.acceptedAt &&
        !invite.revokedAt &&
        invite.expiresAt > new Date() &&
        invite.email === validatedData.email
      ) {
        inviteOrg = { id: invite.organizationId, role: invite.role }
        inviteId = invite.id
      }
    }

    if (inviteOrg) {
      // Join the invited organization
      await prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            name: validatedData.name,
            email: validatedData.email,
            password: hashedPassword,
            organizationId: inviteOrg!.id,
            role: inviteOrg!.role,
          },
        })

        await tx.orgInvite.update({
          where: { id: inviteId! },
          data: { acceptedAt: new Date() },
        })
      })
    } else {
      // Create a personal organization for the user
      const slug = validatedData.email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 50)

      const uniqueSlug = `${slug}-${Date.now().toString(36)}`

      const org = await prisma.organization.create({
        data: {
          name: validatedData.name ? `${validatedData.name}'s Organization` : 'My Organization',
          slug: uniqueSlug,
          plan: 'FREE',
        },
      })

      await prisma.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          organizationId: org.id,
        },
      })
    }

    return {
      success: true,
      message: 'Account created successfully',
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
