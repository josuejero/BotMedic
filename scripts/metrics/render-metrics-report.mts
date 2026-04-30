import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface Metric {
  value: number | string | null;
  source: string;
  evidence: string;
  note?: string;
}

const root = process.cwd();
const reportsDir = join(root, 'metrics', 'reports');
mkdirSync(reportsDir, { recursive: true });

const metrics = JSON.parse(readFileSync(join(root, 'metrics', 'current.json'), 'utf8'));

function value(metric: Metric, suffix = ''): string {
  if (metric.value === null || metric.value === undefined || metric.value === '') return 'Not recorded yet';
  return `${metric.value}${suffix}`;
}

function md(input: unknown): string {
  return String(input ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function html(input: unknown): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const rows: Array<[string, string, Metric, string?]> = [
  ['Scope', 'Slash commands', metrics.scope.slash_commands],
  ['Scope', 'Rule cases', metrics.scope.rule_cases],
  ['Scope', 'Generated runbook pages', metrics.scope.generated_runbook_pages],
  ['Scope', 'Screenshot assets', metrics.scope.screenshot_assets],
  ['QA', 'Test files', metrics.quality.test_files],
  ['QA', 'Automated tests', metrics.quality.tests_total],
  ['QA', 'Test pass rate', metrics.quality.test_pass_rate, '%'],
  ['QA', 'Statement coverage', metrics.quality.statement_coverage, '%'],
  ['QA', 'Branch coverage', metrics.quality.branch_coverage, '%'],
  ['QA', 'Function coverage', metrics.quality.function_coverage, '%'],
  ['QA', 'Line coverage', metrics.quality.line_coverage, '%'],
  ['QA', 'Synthetic response budget checks', metrics.quality.synthetic_response_budget_tests],
  ['Delivery', 'Workflow success rate, last 30 runs', metrics.delivery.workflow_success_rate_30_runs, '%'],
  ['Delivery', 'Median CI duration', metrics.delivery.median_ci_duration_seconds, ' sec'],
  ['Delivery', 'Deployment frequency, last 30 days', metrics.delivery.deployment_frequency_30_days],
  ['Reliability', 'Total handled interactions', metrics.reliability.requests_total],
  ['Reliability', 'Success rate', metrics.reliability.success_rate, '%'],
  ['Reliability', 'Error rate', metrics.reliability.error_rate, '%'],
  ['Reliability', 'p95 command latency', metrics.reliability.p95_latency_ms, ' ms'],
  ['Reliability', 'Discord responses under 3 seconds', metrics.reliability.discord_initial_response_under_3s_rate, '%'],
  ['Security', 'Signature verification tests', metrics.security.signature_verification_tests],
  ['Security', 'Invalid-signature tests', metrics.security.invalid_signature_tests],
  ['Security', 'Open critical/high dependency alerts', metrics.security.dependabot_open_critical_high],
  ['Security', 'CodeQL open alerts', metrics.security.codeql_open_alerts],
  ['Security', 'OpenSSF Scorecard', metrics.security.openssf_score, '/10']
];

const table = rows
  .map(([area, metricName, metric, suffix]) => {
    const evidence = metric.note ? `${metric.evidence} (${metric.note})` : metric.evidence;
    return `| ${md(area)} | ${md(metricName)} | ${md(value(metric, suffix))} | ${md(metric.source)} | ${md(evidence)} |`;
  })
  .join('\n');

const markdown = `# BotMedic project metrics

Last updated: ${metrics.generated_at}  
Commit: ${metrics.commit_sha}  
Environment: ${metrics.environment}

## Summary

BotMedic is a TypeScript Discord incident-triage platform with a Cloudflare Worker backend, shared command/rule packages, Workers KV telemetry, a companion documentation site, GitHub Pages deployment, and Vitest regression coverage.

## Current metrics

| Area | Metric | Value | Source | Evidence |
|---|---|---:|---|---|
${table}

## Notes

- Null values mean the metric has not been automated or recorded yet.
- Local and synthetic metrics should not be described as production metrics.
- Cloudflare Worker platform metrics should be added only after they are collected from Cloudflare or a real telemetry export.
`;

writeFileSync(join(reportsDir, 'METRICS.md'), markdown);

const htmlRows = rows
  .map(([area, metricName, metric, suffix]) => {
    const note = metric.note ? `<br><small>${html(metric.note)}</small>` : '';
    return `<tr><td>${html(area)}</td><td>${html(metricName)}</td><td>${html(value(metric, suffix))}</td><td>${html(metric.source)}</td><td><code>${html(metric.evidence)}</code>${note}</td></tr>`;
  })
  .join('\n');

const outputHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>BotMedic metrics</title>
    <link rel="stylesheet" href="css/site.css" />
  </head>
  <body data-page="metrics">
    <nav class="page-nav">
      <a href="index.html">Home</a>
      <a href="runbooks/index.html">Runbooks</a>
      <a href="diagnosis.html">Diagnosis</a>
      <a href="quick-reference.html">Quick reference</a>
    </nav>
    <main>
      <header>
        <p>Project evidence</p>
        <h1>BotMedic metrics</h1>
        <p>Generated from repo scope, Vitest output, coverage reports, CI evidence, and telemetry exports.</p>
        <p><strong>Last updated:</strong> ${html(metrics.generated_at)}</p>
        <p><strong>Commit:</strong> ${html(metrics.commit_sha)}</p>
      </header>
      <section>
        <h2>Current metrics</h2>
        <table class="quick-reference-table">
          <thead>
            <tr><th>Area</th><th>Metric</th><th>Value</th><th>Source</th><th>Evidence</th></tr>
          </thead>
          <tbody>
            ${htmlRows}
          </tbody>
        </table>
      </section>
    </main>
    <footer class="site-footer">
      Metrics with local or synthetic sources should not be described as production metrics.
    </footer>
  </body>
</html>`;

writeFileSync(join(root, 'site', 'metrics.html'), outputHtml);
console.log('Wrote metrics/reports/METRICS.md and site/metrics.html');
