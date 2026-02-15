import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Get IP from various headers (depending on hosting/proxy setup)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'

  return NextResponse.json({ ip })
}
