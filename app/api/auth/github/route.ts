import { NextResponse } from 'next/server'

// GET /api/auth/github — build GitHub OAuth URL and return it.
// redirect_uri must exactly match what is registered in the GitHub OAuth App settings.
// The registered URL is /api/auth/callback — handled by app/api/auth/callback/page.tsx.
export async function GET() {
  const state = Buffer.from(
    JSON.stringify({ ts: Date.now(), r: Math.random().toString(36).slice(7) })
  ).toString('base64')

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${process.env.FRONTEND_URL}/api/auth/callback`,
    scope: 'repo user read:org',
    state,
  })

  return NextResponse.json({ url: `https://github.com/login/oauth/authorize?${params}` })
}
