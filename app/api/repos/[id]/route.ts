import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { supabase } from '@/lib/supabase-server'
import { lazyUpdateRepo } from '@/lib/repo-utils'

// GET /api/repos/:id — get a single repo.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await params
  const { data: repo, error } = await supabase
    .from('repositories')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !repo) return NextResponse.json({ error: 'Repository not found' }, { status: 404 })

  const updated = await lazyUpdateRepo(repo)
  return NextResponse.json({ repo: updated })
}

// DELETE /api/repos/:id — disconnect a repo.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await params

  const { data: repo } = await supabase
    .from('repositories')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!repo) return NextResponse.json({ error: 'Repository not found' }, { status: 404 })

  const { error } = await supabase.from('repositories').delete().eq('id', id)
  if (error) {
    console.error('Delete repo error:', error)
    return NextResponse.json({ error: 'Failed to delete repository' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
