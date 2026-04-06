import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { supabase } from '@/lib/supabase-server'

// POST /api/repos/connect — connect a GitHub repository.
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const { github_repo_url } = await req.json()
    if (!github_repo_url) return NextResponse.json({ error: 'Missing github_repo_url' }, { status: 400 })

    // Parse owner/repo from URL
    let owner: string, cleanName: string
    try {
      const parsed = new URL(github_repo_url)
      if (!/^(www\.)?github\.com$/i.test(parsed.hostname)) {
        return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 })
      }
      const parts = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/')
      if (parts.length < 2) return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 })
      owner = parts[0]
      cleanName = parts[1].replace(/\.git$/i, '')
    } catch {
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 })
    }

    const fullName = `${owner}/${cleanName}`

    // Check if already connected
    const { data: existing } = await supabase
      .from('repositories')
      .select('id')
      .eq('user_id', user.id)
      .eq('full_name', fullName)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Repository already connected', repo_id: existing.id },
        { status: 409 }
      )
    }

    // Verify GitHub access
    const ghRes = await fetch(`https://api.github.com/repos/${owner}/${cleanName}`, {
      headers: { Authorization: `Bearer ${user.access_token}`, Accept: 'application/json' },
    })
    if (!ghRes.ok) {
      return NextResponse.json(
        { error: 'Cannot access this repository. Make sure you have access.' },
        { status: 403 }
      )
    }

    // Insert repo record (status 'pending' — lazy simulation advances it to 'ready')
    const { data: repo, error } = await supabase
      .from('repositories')
      .insert({
        user_id: user.id,
        github_repo_url: `https://github.com/${fullName}`,
        name: cleanName,
        full_name: fullName,
        status: 'pending',
        file_count: 0,
        node_count: 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ repo })
  } catch (err) {
    console.error('Connect repo error:', err)
    return NextResponse.json({ error: 'Failed to connect repository' }, { status: 500 })
  }
}
