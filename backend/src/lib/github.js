import { Octokit } from '@octokit/rest';

export function createOctokit(accessToken) {
  return new Octokit({ auth: accessToken });
}

export async function getGitHubUser(accessToken) {
  const octokit = createOctokit(accessToken);
  const { data } = await octokit.rest.users.getAuthenticated();
  return data;
}

export async function getRepoDetails(accessToken, owner, repo) {
  const octokit = createOctokit(accessToken);
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return data;
}

export async function listUserRepos(accessToken) {
  const octokit = createOctokit(accessToken);
  const repos = [];
  let page = 1;

  // Fetch up to 100 repos (paginated)
  while (page <= 4) {
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 30,
      page,
      affiliation: 'owner,collaborator,organization_member',
    });
    repos.push(...data);
    if (data.length < 30) break;
    page++;
  }

  return repos.map(r => ({
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    html_url: r.html_url,
    clone_url: r.clone_url,
    description: r.description,
    language: r.language,
    stargazers_count: r.stargazers_count,
    forks_count: r.forks_count,
    updated_at: r.updated_at,
    private: r.private,
    default_branch: r.default_branch,
    size: r.size,
    open_issues_count: r.open_issues_count,
  }));
}

export async function getRepoLanguages(accessToken, owner, repo) {
  try {
    const octokit = createOctokit(accessToken);
    const { data } = await octokit.rest.repos.listLanguages({ owner, repo });
    return data;
  } catch {
    return {};
  }
}
