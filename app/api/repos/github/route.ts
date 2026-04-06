import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { supabase } from '@/lib/supabase-server'

// GET /api/repos/github — list the user's GitHub repos for the connect picker.
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Fetch repos from GitHub (paginated, up to 120)
  const allRepos: any[] = []
  for (let page = 1; page <= 4; page++) {
    const res = await fetch(
      `https://api.github.com/user/repos?sort=updated&per_page=30&page=${page}&affiliation=owner,collaborator,organization_member`,
      { headers: { Authorization: `Bearer ${user.access_token}`, Accept: 'application/json' } }
    )
    if (!res.ok) break
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) break
    allRepos.push(...data)
    if (data.length < 30) break
  }

  // Get already-connected full_names
  const { data: connected } = await supabase
    .from('repositories')
    .select('full_name')
    .eq('user_id', user.id)
  const connectedNames = new Set((connected ?? []).map((r: any) => r.full_name))

  const repos = allRepos.map(r => ({
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    html_url: r.html_url,
    description: r.description,
    language: r.language,
    stargazers_count: r.stargazers_count,
    updated_at: r.updated_at,
    private: r.private,
    connected: connectedNames.has(r.full_name),
  }))

  return NextResponse.json({ repos })
}
