import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { supabase } from './supabase-server'

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single()
    return user ?? null
  } catch {
    return null
  }
}

/**
 * Sign a JWT for a user row.
 */
export function createToken(user: { id: string; github_id: number; login: string }): string {
  return jwt.sign(
    { userId: user.id, githubId: user.github_id, login: user.login },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )
}
