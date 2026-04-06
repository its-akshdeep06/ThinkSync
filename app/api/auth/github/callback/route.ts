import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'
import { createToken } from '@/lib/auth-server'

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? 'Ov23liwoGI6vDrWr9VBz'
const GITHUB_CLIENT_SECRET =
  process.env.GITHUB_CLIENT_SECRET ?? '115e33eb5bfa1967622ace4ed14e5efbc81e90d5'

// POST /api/auth/github/callback — exchange GitHub OAuth code for a JWT.
export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

    // Exchange code → access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    })
    const tokenData = await tokenRes.json()
    if (tokenData.error) {
      return NextResponse.json(
        { error: tokenData.error_description ?? tokenData.error },
        { status: 400 }
      )
    }

    const accessToken: string = tokenData.access_token

    // Fetch GitHub user profile
    const ghRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    })
    const ghUser = await ghRes.json()

    // Upsert into Supabase
    const { data: user, error } = await supabase
      .from('users')
      .upsert(
        {
          github_id: ghUser.id,
          login: ghUser.login,
          avatar_url: ghUser.avatar_url,
          access_token: accessToken,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'github_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Supabase upsert error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const token = createToken(user)
    const isProduction = process.env.NODE_ENV === 'production'

    const response = NextResponse.json({
      token,
      user: { id: user.id, login: user.login, avatar_url: user.avatar_url, github_id: user.github_id },
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
