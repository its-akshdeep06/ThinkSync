import { NextResponse } from 'next/server'

// GET /api/auth/github — build GitHub OAuth URL and return it.
// redirect_uri points to /dashboard so it matches the registered GitHub OAuth App callback.
export async function GET() {
  const state = Buffer.from(
    JSON.stringify({ ts: Date.now(), r: Math.random().toString(36).slice(7) })
  ).toString('base64')

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${process.env.FRONTEND_URL}/dashboard`,
    scope: 'repo user read:org',
    state,
  })

  return NextResponse.json({ url: `https://github.com/login/oauth/authorize?${params}` })
}
