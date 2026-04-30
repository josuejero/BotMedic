import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const workflow = process.env.GITHUB_WORKFLOW_FILE ?? 'pages.yml';
const root = process.cwd();
const rawDir = join(root, 'metrics', 'raw');
mkdirSync(rawDir, { recursive: true });

if (!repo || !token) {
  console.log('GITHUB_REPOSITORY or GITHUB_TOKEN missing; skipping GitHub Actions metrics.');
  writeFileSync(
    join(rawDir, 'github-actions-runs.json'),
    `${JSON.stringify({ generated_at: new Date().toISOString(), skipped: true }, null, 2)}\n`
  );
  process.exit(0);
}

const response = await fetch(
  `https://api.github.com/repos/${repo}/actions/workflows/${workflow}/runs?per_page=30`,
  {
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28'
    }
  }
);

if (!response.ok) {
  throw new Error(`GitHub API failed: ${response.status} ${await response.text()}`);
}

const data = await response.json() as { workflow_runs?: Array<Record<string, any>> };
const runs = data.workflow_runs ?? [];

function secondsBetween(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  return values[Math.floor(values.length / 2)];
}

const durations = runs
  .filter((run) => run.created_at && run.updated_at)
  .map((run) => secondsBetween(run.created_at, run.updated_at))
  .sort((a, b) => a - b);

const successful = runs.filter((run) => run.conclusion === 'success');
const failed = runs.filter((run) => ['failure', 'timed_out', 'cancelled'].includes(String(run.conclusion)));
const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
const successfulDeploysLast30Days = successful.filter((run) => {
  return run.head_branch === 'main' && new Date(String(run.created_at)).getTime() >= thirtyDaysAgo;
});

const summary = {
  generated_at: new Date().toISOString(),
  source: 'CI',
  total_runs: runs.length,
  successful_runs: successful.length,
  failed_runs: failed.length,
  workflow_success_rate_30_runs:
    runs.length > 0 ? Number(((successful.length / runs.length) * 100).toFixed(2)) : null,
  median_ci_duration_seconds: median(durations),
  deployment_frequency_30_days: successfulDeploysLast30Days.length,
  raw_runs: runs.map((run) => ({
    id: run.id,
    name: run.name,
    event: run.event,
    status: run.status,
    conclusion: run.conclusion,
    head_branch: run.head_branch,
    head_sha: run.head_sha,
    created_at: run.created_at,
    updated_at: run.updated_at,
    html_url: run.html_url
  }))
};

writeFileSync(join(rawDir, 'github-actions-runs.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
