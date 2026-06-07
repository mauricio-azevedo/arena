import type { ChangedFile, PrInfo, PrSnapshot } from './models.js';

const GITHUB_API_BASE_URL = 'https://api.github.com';

type GitHubPullResponse = {
  number: number;
  title: string;
  state: string;
  draft: boolean;
  merged: boolean;
  mergeable: boolean | null;
  html_url: string;
  base: { ref: string };
  head: { ref: string; sha: string };
  body: string | null;
  changed_files: number;
  additions: number;
  deletions: number;
};

type GitHubFileResponse = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
};

export async function fetchPrSnapshot(repository: string, prNumber: number): Promise<PrSnapshot> {
  const pr = await fetchJson<GitHubPullResponse>(`/repos/${repository}/pulls/${prNumber}`);
  const files = await fetchAllPages<GitHubFileResponse>(`/repos/${repository}/pulls/${prNumber}/files`);

  return {
    repository,
    pr: mapPr(pr),
    files: files.map(mapFile),
  };
}

async function fetchAllPages<T>(path: string): Promise<T[]> {
  const results: T[] = [];
  let page = 1;

  while (true) {
    const pageResults = await fetchJson<T[]>(`${path}?per_page=100&page=${page}`);
    results.push(...pageResults);

    if (pageResults.length < 100) {
      return results;
    }

    page += 1;
  }
}

async function fetchJson<T>(path: string): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  const response = await fetch(`${GITHUB_API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

function mapPr(pr: GitHubPullResponse): PrInfo {
  return {
    number: pr.number,
    title: pr.title,
    state: pr.state,
    draft: pr.draft,
    merged: pr.merged,
    mergeable: pr.mergeable,
    url: pr.html_url,
    base: pr.base.ref,
    head: pr.head.ref,
    headSha: pr.head.sha,
    body: pr.body,
    changedFiles: pr.changed_files,
    additions: pr.additions,
    deletions: pr.deletions,
  };
}

function mapFile(file: GitHubFileResponse): ChangedFile {
  return {
    path: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
  };
}
