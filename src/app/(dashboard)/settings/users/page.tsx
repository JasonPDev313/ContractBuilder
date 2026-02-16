'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Send, Trash2, UserPlus, RefreshCw } from 'lucide-react'
import {
  getCurrentUser,
  getOrgMembers,
  getOrgInvites,
  inviteUser,
  resendInvite,
  revokeInvite,
  updateMemberRole,
  removeMember,
} from '@/actions/user-management'
import { toast } from '@/hooks/use-toast'

type Member = {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: Date
}

type Invite = {
  id: string
  email: string
  role: string
  expiresAt: Date
  createdAt: Date
  invitedBy: { name: string | null }
}

const ROLES = [
  { value: 'ADMIN', label: 'Admin', description: 'Full access' },
  { value: 'MANAGER', label: 'Manager', description: 'Can manage contracts' },
  { value: 'VIEWER', label: 'Viewer', description: 'Read-only access' },
]

function roleBadgeVariant(role: string) {
  switch (role) {
    case 'ADMIN':
      return 'default' as const
    case 'MANAGER':
      return 'secondary' as const
    default:
      return 'outline' as const
  }
}

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('VIEWER')
  const [isInviting, setIsInviting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const isAdmin = currentUser?.role === 'ADMIN'

  const loadData = useCallback(async () => {
    const [userResult, membersResult, invitesResult] = await Promise.all([
      getCurrentUser(),
      getOrgMembers(),
      getOrgInvites(),
    ])
    if (userResult.success) setCurrentUser(userResult.user)
    if (membersResult.success) setMembers(membersResult.members || [])
    if (invitesResult.success) setInvites(invitesResult.invites || [])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setIsInviting(true)
    try {
      const result = await inviteUser({ email: inviteEmail.trim(), role: inviteRole })
      if (result.success) {
        toast({ title: 'Invitation sent', description: `Invite link created for ${inviteEmail}` })
        await navigator.clipboard.writeText(result.inviteLink!)
        toast({ title: 'Link copied', description: 'Invite link has been copied to your clipboard' })
        setInviteEmail('')
        setInviteRole('VIEWER')
        loadData()
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send invitation' })
    } finally {
      setIsInviting(false)
    }
  }

  const handleResendInvite = async (inviteId: string) => {
    setActionLoading(inviteId)
    try {
      const result = await resendInvite({ inviteId })
      if (result.success) {
        await navigator.clipboard.writeText(result.inviteLink!)
        toast({ title: 'Invite resent', description: 'New invite link copied to clipboard' })
        loadData()
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to resend invitation' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    setActionLoading(inviteId)
    try {
      const result = await revokeInvite({ inviteId })
      if (result.success) {
        toast({ title: 'Invitation revoked' })
        loadData()
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to revoke invitation' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId)
    try {
      const result = await updateMemberRole({ userId, role: newRole })
      if (result.success) {
        toast({ title: 'Role updated' })
        loadData()
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update role' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveMember = async (userId: string, name: string | null) => {
    if (!confirm(`Remove ${name || 'this user'} from the organization?`)) return
    setActionLoading(userId)
    try {
      const result = await removeMember({ userId })
      if (result.success) {
        toast({ title: 'Member removed' })
        loadData()
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove member' })
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Team Members</h2>
        <p className="text-sm text-muted-foreground">
          Manage who has access to your organization
        </p>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Members</CardTitle>
          <CardDescription>
            {members.length} member{members.length !== 1 ? 's' : ''} in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                {isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const isCurrentUser = member.id === currentUser?.id
                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.name || '—'}
                      {isCurrentUser && (
                        <Badge variant="outline" className="ml-2 text-xs">you</Badge>
                      )}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      {isAdmin && !isCurrentUser ? (
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleRoleChange(member.id, value)}
                          disabled={actionLoading === member.id}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={roleBadgeVariant(member.role)}>
                          {member.role}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        {!isCurrentUser && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveMember(member.id, member.name)}
                            disabled={actionLoading === member.id}
                          >
                            {actionLoading === member.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invite Section — Admin only */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              <UserPlus className="inline h-5 w-5 mr-2" />
              Invite Team Member
            </CardTitle>
            <CardDescription>
              Send an invitation link to add someone to your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="inviteEmail">Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                />
              </div>
              <div className="w-[150px] space-y-2">
                <Label htmlFor="inviteRole">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger id="inviteRole">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()}>
                {isInviting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Invite
              </Button>
            </div>

            {/* Pending Invites */}
            {invites.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Pending Invitations ({invites.length})
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Invited By</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell className="font-medium">{invite.email}</TableCell>
                        <TableCell>
                          <Badge variant={roleBadgeVariant(invite.role)}>
                            {invite.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {invite.invitedBy.name || '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Resend invite"
                              onClick={() => handleResendInvite(invite.id)}
                              disabled={actionLoading === invite.id}
                            >
                              {actionLoading === invite.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              title="Revoke invite"
                              onClick={() => handleRevokeInvite(invite.id)}
                              disabled={actionLoading === invite.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
