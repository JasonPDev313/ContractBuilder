import { z } from 'zod'

const roleEnum = z.enum(['ADMIN', 'MANAGER', 'VIEWER'])

export const inviteUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: roleEnum,
})

export const updateMemberRoleSchema = z.object({
  userId: z.string().min(1),
  role: roleEnum,
})

export const removeMemberSchema = z.object({
  userId: z.string().min(1),
})

export const revokeInviteSchema = z.object({
  inviteId: z.string().min(1),
})

export const resendInviteSchema = z.object({
  inviteId: z.string().min(1),
})

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
})

export type InviteUserInput = z.infer<typeof inviteUserSchema>
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>
export type RevokeInviteInput = z.infer<typeof revokeInviteSchema>
export type ResendInviteInput = z.infer<typeof resendInviteSchema>
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>
