/**
 * ML Service client - communicates with the Python FastAPI analysis engine.
 */
import supabase from '../db.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Trigger repo ingestion: calls Python ML analyze-repo, polls until done,
 * then updates Supabase job + repo status.
 */
export async function triggerRepoIngest(jobId, repoId, githubRepoUrl) {
  try {
    const analyzeRes = await fetch(`${ML_SERVICE_URL}/api/analyze-repo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo_url: githubRepoUrl }),
    });

    if (!analyzeRes.ok) {
      const err = await analyzeRes.json().catch(() => ({}));
      throw new Error(err.detail || `ML service returned ${analyzeRes.status}`);
    }

    const { repo_id: mlRepoId } = await analyzeRes.json();

    await supabase
      .from('jobs')
      .update({ outcome: { ml_repo_id: mlRepoId }, progress_pct: 10 })
      .eq('id', jobId);

    await supabase
      .from('repositories')
      .update({ status: 'indexing' })
      .eq('id', repoId);

    await pollMLAnalysis(jobId, repoId, mlRepoId);
  } catch (err) {
    console.error(`[ML] Ingest failed for job ${jobId}:`, err.message);
    await supabase
      .from('jobs')
      .update({ status: 'failed', error_msg: err.message })
      .eq('id', jobId);
    await supabase
      .from('repositories')
      .update({ status: 'error' })
      .eq('id', repoId);
  }
}

async function pollMLAnalysis(jobId, repoId, mlRepoId) {
  const maxAttempts = 72; // ~6 minutes at 5s intervals

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(5000);

    let status;
    try {
      const statusRes = await fetch(`${ML_SERVICE_URL}/api/status/${mlRepoId}`);
      if (!statusRes.ok) continue;
      ({ status } = await statusRes.json());
    } catch {
      continue;
    }

    const progress = Math.min(10 + Math.floor((attempt / maxAttempts) * 85), 90);

    if (status === 'completed') {
      let fileCount = 0;
      let nodeCount = 0;

      try {
        const analysisRes = await fetch(`${ML_SERVICE_URL}/api/analysis/${mlRepoId}`);
        if (analysisRes.ok) {
          const analysis = await analysisRes.json();
          fileCount = analysis.key_files?.length || 0;
          nodeCount = analysis.components?.length || 0;
        }
      } catch {}

      await supabase
        .from('jobs')
        .update({ status: 'complete', progress_pct: 100, outcome: { ml_repo_id: mlRepoId } })
        .eq('id', jobId);

      await supabase
        .from('repositories')
        .update({
          status: 'ready',
          indexed_at: new Date().toISOString(),
          file_count: fileCount,
          node_count: nodeCount,
        })
        .eq('id', repoId);

      console.log(`[ML] Ingest complete for repo ${repoId}`);
      return;
    }

    if (status === 'failed') {
      await supabase
        .from('jobs')
        .update({ status: 'failed', error_msg: 'ML analysis failed' })
        .eq('id', jobId);
      await supabase
        .from('repositories')
        .update({ status: 'error' })
        .eq('id', repoId);
      return;
    }

    // Still running — update progress
    await supabase
      .from('jobs')
      .update({ progress_pct: progress })
      .eq('id', jobId);
  }

  // Timed out
  await supabase
    .from('jobs')
    .update({ status: 'failed', error_msg: 'Analysis timed out after 6 minutes' })
    .eq('id', jobId);
  await supabase
    .from('repositories')
    .update({ status: 'error' })
    .eq('id', repoId);
}

/**
 * Ask the ML service a question about an already-analyzed repo.
 * Returns the answer string.
 */
export async function askML(mlRepoId, question) {
  const res = await fetch(`${ML_SERVICE_URL}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo_id: mlRepoId, question }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `ML service returned ${res.status}`);
  }

  const data = await res.json();
  return data.answer;
}

/**
 * Fetch the full analysis from the ML service and transform it into a
 * graph-compatible structure for the frontend knowledge graph view.
 */
export async function getMLGraph(mlRepoId) {
  const res = await fetch(`${ML_SERVICE_URL}/api/analysis/${mlRepoId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `ML service returned ${res.status}`);
  }

  const analysis = await res.json();
  return buildGraphData(analysis);
}

function buildGraphData(analysis) {
  const nodes = [];
  const edges = [];

  // Build file-level nodes from key_files
  const fileNodes = (analysis.key_files || []).map((f, i) => ({
    id: `file-${i}`,
    name: f.path.split('/').pop(),
    file: f.path,
    type: 'file',
    role: f.role,
    purpose: f.purpose,
    start_line: 1,
  }));

  // Build component nodes
  const componentNodes = (analysis.components || []).map((c, i) => ({
    id: `comp-${i}`,
    name: c.name,
    type: 'class',
    purpose: c.purpose,
    files: c.files || [],
  }));

  nodes.push(...fileNodes, ...componentNodes);

  // Edges: components reference files
  componentNodes.forEach(comp => {
    comp.files.forEach(filePath => {
      const fileNode = fileNodes.find(f => f.file === filePath);
      if (fileNode) {
        edges.push({ source: comp.id, target: fileNode.id, type: 'contains' });
      }
    });
  });

  // Files list for the file tree
  const files = (analysis.key_files || []).map(f => f.path);

  return {
    nodes,
    edges,
    files,
    tech_stack: analysis.tech_stack || [],
    architecture_pattern: analysis.architecture_pattern,
    summary: analysis.summary,
    diagram: analysis.architecture_diagram,
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
