import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  providers: [], // Configured in auth.ts with full server-side deps
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
      const isOnContracts = nextUrl.pathname.startsWith('/contracts')
      const isOnTemplates = nextUrl.pathname.startsWith('/templates')
      const isOnSettings = nextUrl.pathname.startsWith('/settings')
      const isOnAiGenerator = nextUrl.pathname.startsWith('/ai-generator')
      const isOnAuth = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register')

      if (isOnDashboard || isOnContracts || isOnTemplates || isOnSettings || isOnAiGenerator) {
        if (isLoggedIn) return true
        return false // Redirect to login
      } else if (isOnAuth) {
        if (isLoggedIn) return Response.redirect(new URL('/dashboard', nextUrl))
      }

      return true
    },
  },
} satisfies NextAuthConfig
