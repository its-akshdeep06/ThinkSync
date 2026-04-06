import { Router } from 'express';
import supabase from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/analyze/submit - submit intent for analysis
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { repo_id, intent } = req.body;
    if (!repo_id || !intent) return res.status(400).json({ error: 'Missing repo_id or intent' });

    const { data: repo, error: repoErr } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repo_id)
      .eq('user_id', req.user.id)
      .single();

    if (repoErr || !repo) return res.status(404).json({ error: 'Repository not found' });
    if (repo.status !== 'ready') {
      return res.status(400).json({ error: 'Repository is not yet indexed. Please wait for indexing to complete.' });
    }

    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .insert({
        repo_id,
        type: 'analyze-intent',
        status: 'running',
        intent_text: intent,
        progress_pct: 0,
        outcome: null,
      })
      .select()
      .single();

    if (jobErr) {
      console.error('Create job error:', jobErr);
      return res.status(500).json({ error: 'Failed to create analysis job' });
    }

    simulateAnalysis(job.id, repo, intent);
    res.json({ job_id: job.id });
  } catch (err) {
    console.error('Submit analysis error:', err);
    res.status(500).json({ error: 'Failed to submit analysis' });
  }
});

// GET /api/analyze/result/:jobId - get analysis result
router.get('/result/:jobId', authMiddleware, async (req, res) => {
  try {
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', req.params.jobId)
      .single();

    if (error || !job) return res.status(404).json({ error: 'Job not found' });

    const { data: repo, error: repoErr } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', job.repo_id)
      .single();

    if (repoErr || !repo || repo.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (job.status !== 'complete') {
      return res.status(202).json({ status: job.status, progress: job.progress_pct });
    }

    res.json({ result: job.outcome });
  } catch (err) {
    console.error('Get analysis result error:', err);
    res.status(500).json({ error: 'Failed to get analysis result' });
  }
});

async function simulateAnalysis(jobId, repo, intentText) {
  const stages = [
    { pct: 15, delay: 2000 },
    { pct: 35, delay: 3000 },
    { pct: 55, delay: 4000 },
    { pct: 75, delay: 5500 },
    { pct: 90, delay: 7000 },
  ];

  for (const stage of stages) {
    await sleep(stage.delay - (stages[stages.indexOf(stage) - 1]?.delay || 0));
    await supabase
      .from('jobs')
      .update({ progress_pct: stage.pct })
      .eq('id', jobId);
  }

  const outcome = generateDemoResult(intentText, repo);

  await sleep(1500);
  await supabase
    .from('jobs')
    .update({
      status: 'complete',
      progress_pct: 100,
      outcome,
    })
    .eq('id', jobId);
}

function generateDemoResult(intentText, repo) {
  const repoName = repo?.name || 'project';

  return {
    structured_intent: {
      action_type: 'modify',
      risk_level: 'medium',
      change_summary: `AI analysis of intent: "${intentText}" — identified affected files and generated safe code modifications with dependency awareness.`,
      impact_report: {
        direct_changes: 3,
        first_degree_callers: 8,
        transitive_deps: 12,
      },
    },
    change_set: [
      {
        file_path: `src/core/handler.ts`,
        change_type: 'modify',
        function_name: 'processRequest',
        original_code: `export async function processRequest(req: Request) {\n  const data = await parseBody(req);\n  return respond(data);\n}`,
        new_code: `export async function processRequest(req: Request) {\n  const data = await parseBody(req);\n  const validated = await validateInput(data);\n  return respond(validated);\n}`,
        justification: `Added input validation step to match the intent: "${intentText}"`,
      },
      {
        file_path: `src/utils/validation.ts`,
        change_type: 'add',
        original_code: '',
        new_code: `import { z } from 'zod';\n\nexport async function validateInput(data: unknown) {\n  const schema = z.object({\n    id: z.string().uuid(),\n    payload: z.record(z.unknown()),\n  });\n  return schema.parse(data);\n}`,
        justification: 'New validation utility to support the modified handler.',
      },
      {
        file_path: `src/tests/handler.test.ts`,
        change_type: 'modify',
        function_name: 'test suite',
        original_code: `describe('processRequest', () => {\n  it('should process data', async () => {\n    const result = await processRequest(mockReq);\n    expect(result).toBeDefined();\n  });\n});`,
        new_code: `describe('processRequest', () => {\n  it('should process valid data', async () => {\n    const result = await processRequest(mockReq);\n    expect(result).toBeDefined();\n  });\n\n  it('should reject invalid input', async () => {\n    await expect(processRequest(badReq)).rejects.toThrow();\n  });\n});`,
        justification: 'Added test coverage for the new validation logic.',
      },
    ],
    summary: `Applied 3 changes across ${repoName}: added input validation to the request handler, created a validation utility module, and updated tests.`,
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default router;
