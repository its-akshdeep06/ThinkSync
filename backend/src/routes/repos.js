import { Router } from 'express';
import supabase from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { getRepoDetails, listUserRepos } from '../lib/github.js';
import { triggerRepoIngest, getMLGraph } from '../lib/ml.js';

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
    const match = github_repo_url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return res.status(400).json({ error: 'Invalid GitHub URL' });
    const [, owner, repoName] = match;
    const cleanName = repoName.replace(/\.git$/, '');
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
    try {
      await getRepoDetails(req.user.access_token, owner, cleanName);
    } catch {
      return res.status(403).json({ error: 'Cannot access this repository. Make sure you have access.' });
    }

    // Create repo record
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

    // Create ingest job and kick off ML analysis in background
    const { data: job } = await supabase
      .from('jobs')
      .insert({
        repo_id: repo.id,
        type: 'ingest-repository',
        status: 'running',
        progress_pct: 0,
      })
      .select()
      .single();

    if (job) {
      triggerRepoIngest(job.id, repo.id, repo.github_repo_url).catch(err => {
        console.error(`[ML] Ingest error for repo ${repo.id}:`, err.message);
      });
    }

    res.json({ repo });
  } catch (err) {
    console.error('Connect repo error:', err);
    res.status(500).json({ error: 'Failed to connect repository' });
  }
});

// POST /api/repos/:id/reindex - re-trigger ML analysis for a repo
router.post('/:id/reindex', authMiddleware, async (req, res) => {
  try {
    const { data: repo } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!repo) return res.status(404).json({ error: 'Repository not found' });

    // Mark repo as pending
    await supabase
      .from('repositories')
      .update({ status: 'pending' })
      .eq('id', repo.id);

    // Create a new ingest job
    const { data: job } = await supabase
      .from('jobs')
      .insert({
        repo_id: repo.id,
        type: 'ingest-repository',
        status: 'running',
        progress_pct: 0,
      })
      .select()
      .single();

    if (job) {
      triggerRepoIngest(job.id, repo.id, repo.github_repo_url).catch(err => {
        console.error(`[ML] Reindex error for repo ${repo.id}:`, err.message);
      });
    }

    res.json({ success: true, job_id: job?.id });
  } catch (err) {
    console.error('Reindex error:', err);
    res.status(500).json({ error: 'Failed to start reindex' });
  }
});

// GET /api/repos/:id/graph - get knowledge graph from ML analysis
router.get('/:id/graph', authMiddleware, async (req, res) => {
  try {
    const { data: repo } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!repo) return res.status(404).json({ error: 'Repository not found' });

    if (repo.status !== 'ready') {
      return res.status(400).json({ error: 'Repository is not yet indexed' });
    }

    // Get ML repo_id from ingest job
    const { data: ingestJob } = await supabase
      .from('jobs')
      .select('outcome')
      .eq('repo_id', repo.id)
      .eq('type', 'ingest-repository')
      .eq('status', 'complete')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const mlRepoId = ingestJob?.outcome?.ml_repo_id;
    if (!mlRepoId) {
      return res.status(400).json({ error: 'Graph data not available' });
    }

    const graphData = await getMLGraph(mlRepoId);
    res.json(graphData);
  } catch (err) {
    console.error('Graph error:', err);
    res.status(500).json({ error: 'Failed to get graph data' });
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

export default router;
