'use server'

import { hash } from 'bcryptjs'
import { createHash, randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { registerSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/validations/auth'
import { sendPasswordResetEmail } from '@/lib/email/resend'

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

export async function requestPasswordReset(data: unknown) {
  try {
    const { email } = forgotPasswordSchema.parse(data)

    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        success: true,
        message: 'If an account exists with that email, you will receive a password reset link.',
      }
    }

    const token = randomUUID()

    // Delete any existing reset tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    })

    // Create new token (expires in 1 hour)
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    await sendPasswordResetEmail({
      to: email,
      name: user.name,
      resetToken: token,
    })

    return {
      success: true,
      message: 'If an account exists with that email, you will receive a password reset link.',
    }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function resetPassword(data: unknown) {
  try {
    const { token, password } = resetPasswordSchema.parse(data)

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!verificationToken) {
      return { success: false, error: 'Invalid or expired reset link' }
    }

    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: { token },
      })
      return { success: false, error: 'This reset link has expired. Please request a new one.' }
    }

    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const hashedPassword = await hash(password, 10)

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      })

      await tx.verificationToken.delete({
        where: { token },
      })
    })

    return {
      success: true,
      message: 'Password reset successfully. You can now sign in with your new password.',
    }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}
