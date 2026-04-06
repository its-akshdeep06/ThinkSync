import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth/logout — clear the auth cookie.
export async function POST(req: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production'
  const response = NextResponse.json({ success: true })
  response.cookies.set('token', '', {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    maxAge: 0,
    path: '/',
  })
  return response
}
