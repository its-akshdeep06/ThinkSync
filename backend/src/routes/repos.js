import { Router } from 'express';
import supabase from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { getRepoDetails, listUserRepos } from '../lib/github.js';

const router = Router();

// GET /api/repos - list user's connected repos
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data: repos, error } = await supabase
      .from('repositories')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ repos: repos || [] });
  } catch (err) {
    console.error('List repos error:', err);
    res.status(500).json({ error: 'Failed to list repositories' });
  }
});

// GET /api/repos/github - list user's GitHub repos (for connect picker)
router.get('/github', authMiddleware, async (req, res) => {
  try {
    const ghRepos = await listUserRepos(req.user.access_token);

    // Get already-connected repo full_names
    const { data: connected } = await supabase
      .from('repositories')
      .select('full_name')
      .eq('user_id', req.user.id);

    const connectedNames = new Set((connected || []).map(r => r.full_name));

    // Mark which repos are already connected
    const repos = ghRepos.map(r => ({
      ...r,
      connected: connectedNames.has(r.full_name),
    }));

    res.json({ repos });
  } catch (err) {
    console.error('List GitHub repos error:', err);
    res.status(500).json({ error: 'Failed to list GitHub repositories' });
  }
});

// POST /api/repos/connect - connect a new repository
router.post('/connect', authMiddleware, async (req, res) => {
  try {
    const { github_repo_url } = req.body;
    if (!github_repo_url) return res.status(400).json({ error: 'Missing github_repo_url' });

    // Parse owner/repo from URL
    let owner;
    let cleanName;
    try {
      const parsed = new URL(github_repo_url);
      if (!/^(www\.)?github\.com$/i.test(parsed.hostname)) {
        return res.status(400).json({ error: 'Invalid GitHub URL' });
      }
      const parts = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/');
      if (parts.length < 2) {
        return res.status(400).json({ error: 'Invalid GitHub URL' });
      }
      owner = parts[0];
      cleanName = parts[1].replace(/\.git$/i, '');
    } catch {
      return res.status(400).json({ error: 'Invalid GitHub URL' });
    }
    const fullName = `${owner}/${cleanName}`;

    // Check if already connected
    const { data: existing } = await supabase
      .from('repositories')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('full_name', fullName)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Repository already connected', repo_id: existing.id });
    }

    // Verify access via GitHub API
    let repoDetails;
    try {
      repoDetails = await getRepoDetails(req.user.access_token, owner, cleanName);
    } catch {
      return res.status(403).json({ error: 'Cannot access this repository. Make sure you have access.' });
    }

    // Create repo record — using valid status enum 'pending' (not 'connected')
    const { data: repo, error } = await supabase
      .from('repositories')
      .insert({
        user_id: req.user.id,
        github_repo_url: `https://github.com/${fullName}`,
        name: cleanName,
        full_name: fullName,
        status: 'pending',
        file_count: 0,
        node_count: 0,
      })
      .select()
      .single();

    if (error) throw error;

    // Simulate indexing after connecting
    simulateIndexing(repo.id, repoDetails);

    res.json({ repo });
  } catch (err) {
    console.error('Connect repo error:', err);
    res.status(500).json({ error: 'Failed to connect repository' });
  }
});

// GET /api/repos/:id - get single repo details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: repo, error } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !repo) return res.status(404).json({ error: 'Repository not found' });
    res.json({ repo });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get repository' });
  }
});

// POST /api/repos/:id/reindex - Re-trigger indexing for a repository
router.post('/:id/reindex', authMiddleware, async (req, res) => {
  try {
    // Verify ownership
    const { data: repo } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!repo) return res.status(404).json({ error: 'Repository not found' });

    // Set status back to indexing
    await supabase
      .from('repositories')
      .update({ status: 'indexing', indexed_at: null })
      .eq('id', req.params.id);

    // Create a new ingest job
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .insert({
        repo_id: req.params.id,
        type: 'ingest-repository',
        status: 'running',
        progress_pct: 0,
      })
      .select()
      .single();

    if (jobErr) {
      console.error('Create reindex job error:', jobErr);
    }

    // Simulate reindexing
    simulateIndexing(req.params.id, repo);

    res.json({ success: true, job_id: job?.id });
  } catch (err) {
    console.error('Reindex error:', err);
    res.status(500).json({ error: 'Failed to reindex repository' });
  }
});

// GET /api/repos/:id/graph - Get knowledge graph data for a repository
router.get('/:id/graph', authMiddleware, async (req, res) => {
  try {
    // Verify ownership
    const { data: repo, error } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !repo) return res.status(404).json({ error: 'Repository not found' });

    if (repo.status !== 'ready') {
      return res.json({
        files: [],
        nodes: [],
        edges: [],
        stats: { total_files: 0, total_nodes: 0 },
      });
    }

    // Generate demo graph data based on repo metadata
    const graphData = generateDemoGraph(repo);
    res.json(graphData);
  } catch (err) {
    console.error('Get graph error:', err);
    res.status(500).json({ error: 'Failed to get graph data' });
  }
});

// DELETE /api/repos/:id - disconnect a repository
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Verify ownership
    const { data: repo } = await supabase
      .from('repositories')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!repo) return res.status(404).json({ error: 'Repository not found' });

    // Delete repo (cascades to jobs)
    const { error } = await supabase
      .from('repositories')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Delete repo error:', err);
    res.status(500).json({ error: 'Failed to delete repository' });
  }
});

/**
 * Simulate repository indexing.
 * In production, this would clone the repo and build a real AST/knowledge graph.
 */
async function simulateIndexing(repoId, repoDetails) {
  const stages = [
    { status: 'indexing', delay: 1000 },
    { pct: 25, delay: 3000 },
    { pct: 50, delay: 5000 },
    { pct: 75, delay: 7000 },
  ];

  // Set to indexing immediately
  await supabase
    .from('repositories')
    .update({ status: 'indexing' })
    .eq('id', repoId);

  for (const stage of stages) {
    await sleep(stage.delay - (stages[stages.indexOf(stage) - 1]?.delay || 0));
  }

  // Complete indexing with simulated file/node counts
  const fileCount = Math.floor(Math.random() * 80) + 20;
  const nodeCount = Math.floor(fileCount * (3 + Math.random() * 4));

  await sleep(2000);
  await supabase
    .from('repositories')
    .update({
      status: 'ready',
      file_count: fileCount,
      node_count: nodeCount,
      indexed_at: new Date().toISOString(),
    })
    .eq('id', repoId);
}

/**
 * Generate demo knowledge graph data for visualization.
 */
function generateDemoGraph(repo) {
  const fileStructures = [
    'src/index.ts',
    'src/app.ts',
    'src/config.ts',
    'src/core/handler.ts',
    'src/core/router.ts',
    'src/core/middleware.ts',
    'src/services/auth.ts',
    'src/services/user.ts',
    'src/services/repo.ts',
    'src/utils/logger.ts',
    'src/utils/validation.ts',
    'src/utils/helpers.ts',
    'src/models/user.ts',
    'src/models/repo.ts',
    'src/models/job.ts',
    'src/tests/handler.test.ts',
    'src/tests/auth.test.ts',
    'package.json',
    'tsconfig.json',
    'README.md',
  ];

  const files = fileStructures.slice(0, Math.min(repo.file_count || 20, fileStructures.length));

  const nodeTypes = ['function', 'class', 'import', 'file'];
  const nodes = files.map((file, i) => ({
    id: `node-${i}`,
    name: file.split('/').pop()?.replace(/\.[^.]+$/, '') || file,
    file,
    type: nodeTypes[Math.floor(Math.random() * nodeTypes.length)],
    start_line: Math.floor(Math.random() * 50) + 1,
    end_line: Math.floor(Math.random() * 100) + 50,
  }));

  // Create edges between related nodes
  const edges = [];
  for (let i = 1; i < nodes.length; i++) {
    // Connect to a random earlier node
    const target = Math.floor(Math.random() * i);
    edges.push({
      source: nodes[i].id,
      target: nodes[target].id,
      type: Math.random() > 0.5 ? 'imports' : 'calls',
    });
    // Some nodes have multiple connections
    if (Math.random() > 0.6 && i > 2) {
      const target2 = Math.floor(Math.random() * i);
      if (target2 !== target) {
        edges.push({
          source: nodes[i].id,
          target: nodes[target2].id,
          type: 'calls',
        });
      }
    }
  }

  return {
    files,
    nodes,
    edges,
    stats: {
      total_files: files.length,
      total_nodes: nodes.length,
      total_edges: edges.length,
    },
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default router;
