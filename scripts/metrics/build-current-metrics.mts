import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type SourceLabel = 'CI' | 'local' | 'synthetic' | 'Cloudflare' | 'manual';

interface Metric<T = number | string | null> {
  value: T;
  source: SourceLabel;
  evidence: string;
  note?: string;
}

interface InteractionRollup {
  total?: number;
  success?: number;
  error?: number;
  underThreeSeconds?: number;
  recentLatenciesMs?: number[];
}

const root = process.cwd();
const rawDir = join(root, 'metrics', 'raw');
const historyDir = join(root, 'metrics', 'history');
mkdirSync(historyDir, { recursive: true });

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function pct(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function numeric(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function metric<T extends number | string | null>(
  value: T,
  source: SourceLabel,
  evidence: string,
  note?: string
): Metric<T> {
  return { value, source, evidence, ...(note ? { note } : {}) };
}

function percentile(values: number[], target: number): number | null {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const index = Math.min(sorted.length - 1, Math.ceil((target / 100) * sorted.length) - 1);
  return sorted[index];
}

function rate(part: unknown, total: unknown): number | null {
  if (typeof part !== 'number' || typeof total !== 'number' || total <= 0) return null;
  return Number(((part / total) * 100).toFixed(2));
}

function countMatchingTests(vitest: Record<string, any>, pattern: RegExp): number | null {
  const results = vitest.testResults;
  if (!Array.isArray(results)) return null;
  const matches = results.flatMap((file) => file.assertionResults ?? [])
    .filter((test) => pattern.test(String(test.fullName ?? test.title ?? '')));
  return matches.length;
}

const generatedSource: SourceLabel = process.env.CI ? 'CI' : 'local';
const scopeEvidence = 'metrics/raw/scope.json';
const vitestEvidence = 'metrics/raw/vitest-results.json';
const coverageEvidence = 'metrics/raw/coverage/coverage-summary.json';
const githubActionsEvidence = 'metrics/raw/github-actions-runs.json';
const workerEvidence = 'metrics/raw/worker-metrics.json';
const interactionEvidence = 'metrics/raw/interaction-rollup.json';

const scope = readJson<Record<string, any>>(join(rawDir, 'scope.json'), {});
const vitest = readJson<Record<string, any>>(join(rawDir, 'vitest-results.json'), {});
const coverage = readJson<Record<string, any>>(join(rawDir, 'coverage', 'coverage-summary.json'), {});
const githubActions = readJson<Record<string, any>>(join(rawDir, 'github-actions-runs.json'), {});
const workerMetrics = readJson<Record<string, any> | null>(join(rawDir, 'worker-metrics.json'), null);
const interactionRollup = readJson<InteractionRollup | null>(join(rawDir, 'interaction-rollup.json'), null);

const totalCoverage = coverage.total ?? {};
const testsTotal =
  numeric(vitest.numTotalTests) ??
  numeric(scope.declared_vitest_tests);
const testsPassed = numeric(vitest.numPassedTests);
const testsFailed = numeric(vitest.numFailedTests);
const recentLatencies = interactionRollup?.recentLatenciesMs ?? [];

const reliabilitySource: SourceLabel =
  workerMetrics || interactionRollup ? 'Cloudflare' : 'Cloudflare';
const reliabilityEvidence = workerMetrics ? workerEvidence : interactionEvidence;
const reliabilityNote = workerMetrics || interactionRollup
  ? undefined
  : 'Not recorded until Workers KV telemetry or Cloudflare dashboard metrics are exported.';

const current = {
  project: 'BotMedic',
  generated_at: new Date().toISOString(),
  commit_sha: process.env.GITHUB_SHA ?? process.env.COMMIT_SHA ?? 'local',
  branch: process.env.GITHUB_REF_NAME ?? 'local',
  environment: process.env.CI ? 'ci' : 'local',
  schema: 'botmedic.metrics.v1',
  scope: {
    slash_commands: metric(numeric(scope.slash_commands), generatedSource, scopeEvidence),
    discord_command_definitions: metric(numeric(scope.discord_command_definitions), generatedSource, scopeEvidence),
    rule_cases: metric(numeric(scope.rule_cases), generatedSource, scopeEvidence),
    symptom_fixtures: metric(numeric(scope.symptom_fixtures), generatedSource, scopeEvidence),
    diagnosis_snapshots: metric(numeric(scope.diagnosis_snapshots), generatedSource, scopeEvidence),
    customer_safe_messages: metric(numeric(scope.customer_safe_messages), generatedSource, scopeEvidence),
    dashboard_samples: metric(numeric(scope.dashboard_samples), generatedSource, scopeEvidence),
    generated_runbook_pages: metric(numeric(scope.generated_runbook_pages), generatedSource, scopeEvidence),
    docs_markdown_files: metric(numeric(scope.docs_markdown_files), generatedSource, scopeEvidence),
    screenshot_assets: metric(numeric(scope.screenshot_assets), generatedSource, scopeEvidence)
  },
  quality: {
    test_files: metric(numeric(scope.test_files), generatedSource, scopeEvidence),
    tests_total: metric(testsTotal, generatedSource, vitestEvidence),
    tests_passed: metric(testsPassed, generatedSource, vitestEvidence),
    tests_failed: metric(testsFailed, generatedSource, vitestEvidence),
    test_pass_rate: metric(rate(testsPassed, testsTotal), generatedSource, vitestEvidence),
    statement_coverage: metric(pct(totalCoverage.statements?.pct), generatedSource, coverageEvidence),
    branch_coverage: metric(pct(totalCoverage.branches?.pct), generatedSource, coverageEvidence),
    function_coverage: metric(pct(totalCoverage.functions?.pct), generatedSource, coverageEvidence),
    line_coverage: metric(pct(totalCoverage.lines?.pct), generatedSource, coverageEvidence),
    synthetic_response_budget_tests: metric(
      countMatchingTests(vitest, /synthetic command response budget/i),
      'synthetic',
      vitestEvidence,
      'Checks response builders against Discord initial-response budget in a controlled test run.'
    )
  },
  delivery: {
    ci_status: metric(process.env.CI ? 'generated-in-ci' : 'local-only', generatedSource, githubActionsEvidence),
    workflow_success_rate_30_runs: metric(
      numeric(githubActions.workflow_success_rate_30_runs),
      'CI',
      githubActionsEvidence,
      githubActions.skipped ? 'Skipped locally without GitHub Actions token.' : undefined
    ),
    median_ci_duration_seconds: metric(
      numeric(githubActions.median_ci_duration_seconds),
      'CI',
      githubActionsEvidence,
      githubActions.skipped ? 'Skipped locally without GitHub Actions token.' : undefined
    ),
    deployment_frequency_30_days: metric(
      numeric(githubActions.deployment_frequency_30_days),
      'CI',
      githubActionsEvidence,
      githubActions.skipped ? 'Skipped locally without GitHub Actions token.' : undefined
    ),
    failed_pipeline_recovery_minutes: metric(null, 'manual', githubActionsEvidence, 'Add after enough failed/successful workflow history exists.')
  },
  reliability: {
    requests_total: metric(
      numeric(workerMetrics?.requests_total) ?? numeric(interactionRollup?.total),
      reliabilitySource,
      reliabilityEvidence,
      reliabilityNote
    ),
    success_rate: metric(
      numeric(workerMetrics?.success_rate) ?? rate(interactionRollup?.success, interactionRollup?.total),
      reliabilitySource,
      reliabilityEvidence,
      reliabilityNote
    ),
    error_rate: metric(
      numeric(workerMetrics?.error_rate) ?? rate(interactionRollup?.error, interactionRollup?.total),
      reliabilitySource,
      reliabilityEvidence,
      reliabilityNote
    ),
    p50_latency_ms: metric(
      numeric(workerMetrics?.p50_wall_time_ms) ?? percentile(recentLatencies, 50),
      reliabilitySource,
      reliabilityEvidence,
      reliabilityNote
    ),
    p95_latency_ms: metric(
      numeric(workerMetrics?.p95_wall_time_ms) ?? percentile(recentLatencies, 95),
      reliabilitySource,
      reliabilityEvidence,
      reliabilityNote
    ),
    p99_latency_ms: metric(
      numeric(workerMetrics?.p99_wall_time_ms) ?? percentile(recentLatencies, 99),
      reliabilitySource,
      reliabilityEvidence,
      reliabilityNote
    ),
    discord_initial_response_under_3s_rate: metric(
      rate(interactionRollup?.underThreeSeconds, interactionRollup?.total),
      interactionRollup ? 'Cloudflare' : 'Cloudflare',
      interactionEvidence,
      interactionRollup ? undefined : 'Not recorded until Workers KV telemetry is exported.'
    ),
    worker_cpu_time_p95_ms: metric(numeric(workerMetrics?.p95_cpu_time_ms), 'Cloudflare', workerEvidence, reliabilityNote),
    resource_limit_errors: metric(numeric(workerMetrics?.exceeded_resources), 'Cloudflare', workerEvidence, reliabilityNote)
  },
  security: {
    signature_verification_tests: metric(countMatchingTests(vitest, /signature/i), generatedSource, vitestEvidence),
    invalid_signature_tests: metric(countMatchingTests(vitest, /invalid/i), generatedSource, vitestEvidence),
    dependabot_open_critical_high: metric(null, 'manual', 'GitHub Dependabot alerts', 'Report from GitHub security alerts after enabled.'),
    codeql_open_alerts: metric(null, 'manual', 'GitHub code scanning alerts', 'Report from GitHub code scanning after enabled.'),
    openssf_score: metric(null, 'manual', 'OpenSSF Scorecard workflow', 'Report after Scorecard publishes a result.')
  },
  documentation: {
    generated_docs_pages: metric(numeric(scope.generated_runbook_pages), generatedSource, scopeEvidence),
    architecture_docs: metric(numeric(scope.docs_markdown_files), generatedSource, scopeEvidence),
    screenshots: metric(numeric(scope.screenshot_assets), generatedSource, scopeEvidence),
    demo_links_verified: metric(null, 'manual', 'Manual browser verification', 'Record after checking the published GitHub Pages site.')
  }
};

writeFileSync(join(root, 'metrics', 'current.json'), `${JSON.stringify(current, null, 2)}\n`);

const safeSha = String(current.commit_sha).slice(0, 12).replace(/[^a-zA-Z0-9._-]/g, 'local');
const safeDate = current.generated_at.slice(0, 10);
writeFileSync(
  join(historyDir, `${safeDate}-${safeSha}.json`),
  `${JSON.stringify(current, null, 2)}\n`
);

console.log(JSON.stringify(current, null, 2));
