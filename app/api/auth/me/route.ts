import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'

// GET /api/auth/me — return the current authenticated user.
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  return NextResponse.json({
    user: {
      id: user.id,
      login: user.login,
      avatar_url: user.avatar_url,
      github_id: user.github_id,
      created_at: user.created_at,
    },
  })
}
