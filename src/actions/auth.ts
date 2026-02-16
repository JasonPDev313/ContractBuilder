'use server'

import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations/auth'

export async function register(data: unknown) {
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

    // Get or create default organization
    let defaultOrg = await prisma.organization.findUnique({
      where: { slug: 'default' },
    })

    if (!defaultOrg) {
      defaultOrg = await prisma.organization.create({
        data: {
          name: 'Default Organization',
          slug: 'default',
          plan: 'FREE',
        },
      })
    }

    // Create user and assign to default organization
    await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        organizationId: defaultOrg.id,
      },
    })

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
