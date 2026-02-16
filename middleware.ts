import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

export default NextAuth(authConfig).auth

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sign/ (public signature pages)
     * - c/ (public contract pages)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|sign|c/).*)',
  ],
}
