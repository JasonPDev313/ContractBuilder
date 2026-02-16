import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import { compare } from 'bcryptjs'

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
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
    async jwt({ token, user, trigger }) {
      if (user) {
        // When user logs in, add custom properties to token
        token.sub = user.id // Standard NextAuth property for user ID
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = (user as any).role

        // Fetch organizationId from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { organizationId: true },
        })
        token.organizationId = dbUser?.organizationId || null
      }

      // Support updating organizationId without re-login
      if (trigger === 'update') {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub as string },
          select: { organizationId: true },
        })
        token.organizationId = dbUser?.organizationId || null
      }

      return token
    },
    async session({ session, token }) {
      // Construct session from token properties
      if (session.user) {
        session.user.id = token.sub as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string | null
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
      const isOnContracts = nextUrl.pathname.startsWith('/contracts')
      const isOnAuth = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register')

      if (isOnDashboard || isOnContracts) {
        if (isLoggedIn) return true
        return false // Redirect to login
      } else if (isOnAuth) {
        if (isLoggedIn) return Response.redirect(new URL('/dashboard', nextUrl))
      }

      return true
    },
  },
})
