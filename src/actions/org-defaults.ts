'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSessionOrgId, requireAuth } from '@/lib/auth-utils'
import { upsertOrgDefaultsSchema } from '@/lib/validations/org-defaults'

/**
 * Get org contract defaults for the current session org.
 * Returns null if no defaults have been set yet.
 */
export async function getOrgDefaults() {
  try {
    const session = requireAuth(await auth())
    const orgId = await getSessionOrgId(session)

    const defaults = await prisma.orgContractDefaults.findUnique({
      where: { organizationId: orgId },
    })

    return { success: true as const, defaults }
  } catch (error) {
    console.error('Error fetching org defaults:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to fetch org defaults',
    }
  }
}

/**
 * Upsert org contract defaults for the current session org.
 */
export async function upsertOrgDefaults(data: unknown) {
  try {
    const session = requireAuth(await auth())
    const orgId = await getSessionOrgId(session)

    const validated = upsertOrgDefaultsSchema.parse(data)

    // Clean empty strings to null
    const cleaned = Object.fromEntries(
      Object.entries(validated).map(([key, value]) => [
        key,
        value === '' ? null : value,
      ])
    )

    const defaults = await prisma.orgContractDefaults.upsert({
      where: { organizationId: orgId },
      create: {
        organizationId: orgId,
        ...cleaned,
      },
      update: cleaned,
    })

    return { success: true as const, defaults }
  } catch (error) {
    console.error('Error upserting org defaults:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to save org defaults',
    }
  }
}
