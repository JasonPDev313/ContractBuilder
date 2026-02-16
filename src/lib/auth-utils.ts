import { Session } from 'next-auth'

/**
 * Get the organization ID from the user's session.
 * Throws an error if the user is not assigned to an organization.
 *
 * @param session - The NextAuth session object
 * @returns The organization ID
 * @throws Error if user is not assigned to an organization
 */
export async function getSessionOrgId(session: Session): Promise<string> {
  if (!session?.user?.organizationId) {
    throw new Error('User not assigned to an organization')
  }
  return session.user.organizationId
}

/**
 * Verify that the user has access to a resource belonging to a specific organization.
 * Returns true if the user's organizationId matches the resource's organizationId.
 *
 * @param session - The NextAuth session object
 * @param resourceOrgId - The organization ID of the resource
 * @returns True if user has access, false otherwise
 */
export async function verifyOrgAccess(
  session: Session,
  resourceOrgId: string
): Promise<boolean> {
  try {
    const userOrgId = await getSessionOrgId(session)
    return userOrgId === resourceOrgId
  } catch {
    return false
  }
}

/**
 * Check if the user has admin privileges.
 *
 * @param session - The NextAuth session object
 * @returns True if user is an admin, false otherwise
 */
export function isAdmin(session: Session): boolean {
  return session?.user?.role === 'ADMIN'
}

/**
 * Require admin privileges. Throws an error if the user is not an admin.
 *
 * @param session - The NextAuth session object
 * @throws Error if user is not an admin
 */
export function requireAdmin(session: Session): void {
  if (!isAdmin(session)) {
    throw new Error('Admin privileges required')
  }
}

/**
 * Verify that the user is authenticated.
 * Throws an error if the session is invalid or the user is not authenticated.
 *
 * @param session - The NextAuth session object or null
 * @returns The authenticated session
 * @throws Error if user is not authenticated
 */
export function requireAuth(session: Session | null): Session {
  if (!session?.user) {
    throw new Error('Authentication required')
  }
  return session
}

/**
 * Check if the user has one of the specified roles.
 */
export function hasRole(session: Session, ...roles: string[]): boolean {
  return roles.includes(session?.user?.role)
}

/**
 * Require admin or manager privileges.
 * Throws an error if the user is neither an admin nor a manager.
 */
export function requireAdminOrManager(session: Session): void {
  if (!hasRole(session, 'ADMIN', 'MANAGER')) {
    throw new Error('Admin or Manager privileges required')
  }
}
