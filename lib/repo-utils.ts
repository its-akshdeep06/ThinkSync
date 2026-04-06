import { supabase } from './supabase-server'

// How long simulated indexing takes (ms)
const INDEXING_MS = 12_000
// How long simulated analysis takes (ms)
const ANALYSIS_MS = 10_000

/**
 * Deterministic "random" number from a string seed so the same
 * repo always gets the same file/node counts regardless of how many
 * times the lazy-update runs.
 */
function seededInt(seed: string, min: number, max: number): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  return min + (Math.abs(h) % (max - min + 1))
}

/**
 * If a repo is still indexing/pending, check elapsed time and
 * update Supabase if it should now be ready. Returns the (possibly updated) repo.
 */
export async function lazyUpdateRepo(repo: any): Promise<any> {
  if (repo.status !== 'pending' && repo.status !== 'indexing') return repo

  const elapsed = Date.now() - new Date(repo.created_at).getTime()

  if (elapsed < 2_000) {
    return { ...repo, status: 'pending' }
  }

  if (elapsed < INDEXING_MS) {
    if (repo.status !== 'indexing') {
      await supabase.from('repositories').update({ status: 'indexing' }).eq('id', repo.id)
    }
    return { ...repo, status: 'indexing' }
  }

  // Time is up — mark ready
  const fileCount = seededInt(repo.id, 20, 99)
  const nodeCount = seededInt(repo.id + '_nodes', fileCount * 3, fileCount * 7)
  const indexedAt = new Date(new Date(repo.created_at).getTime() + INDEXING_MS).toISOString()

  await supabase
    .from('repositories')
    .update({ status: 'ready', file_count: fileCount, node_count: nodeCount, indexed_at: indexedAt })
    .eq('id', repo.id)

  return { ...repo, status: 'ready', file_count: fileCount, node_count: nodeCount, indexed_at: indexedAt }
}

/**
 * If an analysis job is still running, check elapsed time and
 * mark it complete if time is up. Returns the (possibly updated) job.
 */
export async function lazyUpdateJob(job: any): Promise<any> {
  if (job.status !== 'running') return job

  const elapsed = Date.now() - new Date(job.created_at).getTime()

  if (elapsed < ANALYSIS_MS) {
    const progress = Math.floor(15 + (elapsed / ANALYSIS_MS) * 75)
    return { ...job, status: 'running', progress_pct: progress }
  }

  // Fetch repo for demo result generation
  const { data: repo } = await supabase
    .from('repositories')
    .select('id, name, full_name')
    .eq('id', job.repo_id)
    .single()

  const outcome = buildDemoResult(job.intent_text, repo)

  await supabase
    .from('jobs')
    .update({ status: 'complete', progress_pct: 100, outcome })
    .eq('id', job.id)

  return { ...job, status: 'complete', progress_pct: 100, outcome }
}

function buildDemoResult(intentText: string, repo: any) {
  const repoName = repo?.name ?? 'project'
  return {
    structured_intent: {
      action_type: 'modify',
      risk_level: 'medium',
      change_summary: `AI analysis of intent: "${intentText}" — identified affected files and generated safe code modifications with dependency awareness.`,
      impact_report: { direct_changes: 3, first_degree_callers: 8, transitive_deps: 12 },
    },
    change_set: [
      {
        file_path: 'src/core/handler.ts',
        change_type: 'modify',
        function_name: 'processRequest',
        original_code: `export async function processRequest(req: Request) {\n  const data = await parseBody(req);\n  return respond(data);\n}`,
        new_code: `export async function processRequest(req: Request) {\n  const data = await parseBody(req);\n  const validated = await validateInput(data);\n  return respond(validated);\n}`,
        justification: `Added input validation step to match the intent: "${intentText}"`,
      },
      {
        file_path: 'src/utils/validation.ts',
        change_type: 'add',
        original_code: '',
        new_code: `import { z } from 'zod';\n\nexport async function validateInput(data: unknown) {\n  const schema = z.object({\n    id: z.string().uuid(),\n    payload: z.record(z.unknown()),\n  });\n  return schema.parse(data);\n}`,
        justification: 'New validation utility to support the modified handler.',
      },
      {
        file_path: 'src/tests/handler.test.ts',
        change_type: 'modify',
        function_name: 'test suite',
        original_code: `describe('processRequest', () => {\n  it('should process data', async () => {\n    const result = await processRequest(mockReq);\n    expect(result).toBeDefined();\n  });\n});`,
        new_code: `describe('processRequest', () => {\n  it('should process valid data', async () => {\n    const result = await processRequest(mockReq);\n    expect(result).toBeDefined();\n  });\n\n  it('should reject invalid input', async () => {\n    await expect(processRequest(badReq)).rejects.toThrow();\n  });\n});`,
        justification: 'Added test coverage for the new validation logic.',
      },
    ],
    summary: `Applied 3 changes across ${repoName}: added input validation to the request handler, created a validation utility module, and updated tests.`,
  }
}

/** Generate a demo knowledge graph from a ready repo. */
export function buildDemoGraph(repo: any) {
  const fileStructures = [
    'src/index.ts', 'src/app.ts', 'src/config.ts',
    'src/core/handler.ts', 'src/core/router.ts', 'src/core/middleware.ts',
    'src/services/auth.ts', 'src/services/user.ts', 'src/services/repo.ts',
    'src/utils/logger.ts', 'src/utils/validation.ts', 'src/utils/helpers.ts',
    'src/models/user.ts', 'src/models/repo.ts', 'src/models/job.ts',
    'src/tests/handler.test.ts', 'src/tests/auth.test.ts',
    'package.json', 'tsconfig.json', 'README.md',
  ]

  const count = Math.min(repo.file_count || 20, fileStructures.length)
  const files = fileStructures.slice(0, count)
  const nodeTypes = ['function', 'class', 'import', 'file']

  const seed = repo.id
  const nodes = files.map((file, i) => ({
    id: `node-${i}`,
    name: file.split('/').pop()?.replace(/\.[^.]+$/, '') ?? file,
    file,
    type: nodeTypes[seededInt(seed + i, 0, nodeTypes.length - 1)],
    start_line: seededInt(seed + i + 'sl', 1, 50),
    end_line: seededInt(seed + i + 'el', 51, 150),
  }))

  const edges: any[] = []
  for (let i = 1; i < nodes.length; i++) {
    const t = seededInt(seed + i + 'e', 0, i - 1)
    edges.push({ source: nodes[i].id, target: nodes[t].id, type: seededInt(seed + i + 'et', 0, 1) ? 'imports' : 'calls' })
    if (seededInt(seed + i + 'ex', 0, 9) > 5 && i > 2) {
      const t2 = seededInt(seed + i + 'e2', 0, i - 1)
      if (t2 !== t) edges.push({ source: nodes[i].id, target: nodes[t2].id, type: 'calls' })
    }
  }

  return {
    files,
    nodes,
    edges,
    stats: { total_files: files.length, total_nodes: nodes.length, total_edges: edges.length },
  }
}
