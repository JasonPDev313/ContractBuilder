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

    // Create a personal organization for the user
    const slug = validatedData.email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50)

    // Ensure unique slug by appending random suffix
    const uniqueSlug = `${slug}-${Date.now().toString(36)}`

    const org = await prisma.organization.create({
      data: {
        name: validatedData.name ? `${validatedData.name}'s Organization` : 'My Organization',
        slug: uniqueSlug,
        plan: 'FREE',
      },
    })

    // Create user and assign to their personal organization
    await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        organizationId: org.id,
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
