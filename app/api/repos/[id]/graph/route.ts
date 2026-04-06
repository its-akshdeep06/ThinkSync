import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { supabase } from '@/lib/supabase-server'
import { lazyUpdateRepo, buildDemoGraph } from '@/lib/repo-utils'

// GET /api/repos/:id/graph — get the knowledge graph for a repo.
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

  if (updated.status !== 'ready') {
    return NextResponse.json({ files: [], nodes: [], edges: [], stats: { total_files: 0, total_nodes: 0 } })
  }

  return NextResponse.json(buildDemoGraph(updated))
}
