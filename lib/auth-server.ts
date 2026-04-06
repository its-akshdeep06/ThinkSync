import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'
import { supabase } from './supabase-server'

const JWT_SECRET_RAW = process.env.JWT_SECRET ?? 'thinksync-jwt-secret-k9x2m7p4q8r3n6w1'

function secret() {
  return new TextEncoder().encode(JWT_SECRET_RAW)
}

/**
 * Extract and verify the JWT from the request (Authorization header or cookie).
 * Returns the full user row from Supabase, or null if unauthenticated.
 */
export async function getAuthUser(req: NextRequest): Promise<any | null> {
  const authHeader = req.headers.get('authorization')
  const cookieToken = req.cookies.get('token')?.value
  const token = authHeader?.replace('Bearer ', '') || cookieToken

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret())
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', (payload as any).userId)
      .single()
    return user ?? null
  } catch {
    return null
  }
}

/**
 * Sign a JWT for a user row. Returns a Promise<string>.
 */
export async function createToken(user: {
  id: string
  github_id: number
  login: string
}): Promise<string> {
  return new SignJWT({ userId: user.id, githubId: user.github_id, login: user.login })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret())
}
