import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import { compare } from 'bcryptjs'
import { authConfig } from './auth.config'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
        token.sub = user.id
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = (user as any).role

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            organizationId: true,
            organization: { select: { slug: true } },
          },
        })

        // Auto-create personal org for users without one or on shared default org
        const needsOwnOrg = !dbUser?.organizationId || dbUser.organization?.slug === 'default'

        if (needsOwnOrg) {
          const email = (user.email || 'user').split('@')[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .slice(0, 50)
          const org = await prisma.organization.create({
            data: {
              name: user.name ? `${user.name}'s Organization` : 'My Organization',
              slug: `${email}-${Date.now().toString(36)}`,
              plan: 'FREE',
            },
          })
          await prisma.user.update({
            where: { id: user.id! },
            data: { organizationId: org.id },
          })
          token.organizationId = org.id
        } else {
          token.organizationId = dbUser.organizationId
        }
      }

      // Always refresh role and org from DB to pick up changes (role updates, org moves)
      if (!user && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, organizationId: true },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.organizationId = dbUser.organizationId
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string | null
      }
      return session
    },
  },
})
