# BotMedic project metrics

Last updated: 2026-05-01T00:14:16.507Z
Commit: local
Environment: local

## Summary

BotMedic is a TypeScript Discord incident-triage platform with a Cloudflare Worker backend, shared command/rule packages, Workers KV telemetry, a companion documentation site, GitHub Pages deployment, and Vitest regression coverage.

## Current metrics

| Area | Metric | Value | Source | Evidence |
|---|---|---:|---|---|
| Scope | Slash commands | 6 | local | metrics/raw/scope.json |
| Scope | Rule cases | 10 | local | metrics/raw/scope.json |
| Scope | Generated runbook pages | 10 | local | metrics/raw/scope.json |
| Scope | Screenshot assets | 6 | local | metrics/raw/scope.json |
| QA | Test files | 7 | local | metrics/raw/scope.json |
| QA | Automated tests | 28 | local | metrics/raw/vitest-results.json |
| QA | Test pass rate | 100% | local | metrics/raw/vitest-results.json |
| QA | Statement coverage | 76.67% | local | metrics/raw/coverage/coverage-summary.json |
| QA | Branch coverage | 64.82% | local | metrics/raw/coverage/coverage-summary.json |
| QA | Function coverage | 85.71% | local | metrics/raw/coverage/coverage-summary.json |
| QA | Line coverage | 76.68% | local | metrics/raw/coverage/coverage-summary.json |
| QA | Synthetic response budget checks | 1 | synthetic | metrics/raw/vitest-results.json (Checks response builders against Discord initial-response budget in a controlled test run.) |
| Delivery | Workflow success rate, last 30 runs | Not recorded yet | CI | metrics/raw/github-actions-runs.json (Skipped locally without GitHub Actions token.) |
| Delivery | Median CI duration | Not recorded yet | CI | metrics/raw/github-actions-runs.json (Skipped locally without GitHub Actions token.) |
| Delivery | Deployment frequency, last 30 days | Not recorded yet | CI | metrics/raw/github-actions-runs.json (Skipped locally without GitHub Actions token.) |
| Reliability | Total handled interactions | Not recorded yet | Cloudflare | metrics/raw/interaction-rollup.json (Not recorded until Workers KV telemetry or Cloudflare dashboard metrics are exported.) |
| Reliability | Success rate | Not recorded yet | Cloudflare | metrics/raw/interaction-rollup.json (Not recorded until Workers KV telemetry or Cloudflare dashboard metrics are exported.) |
| Reliability | Error rate | Not recorded yet | Cloudflare | metrics/raw/interaction-rollup.json (Not recorded until Workers KV telemetry or Cloudflare dashboard metrics are exported.) |
| Reliability | p95 command latency | Not recorded yet | Cloudflare | metrics/raw/interaction-rollup.json (Not recorded until Workers KV telemetry or Cloudflare dashboard metrics are exported.) |
| Reliability | Discord responses under 3 seconds | Not recorded yet | Cloudflare | metrics/raw/interaction-rollup.json (Not recorded until Workers KV telemetry is exported.) |
| Security | Signature verification tests | 1 | local | metrics/raw/vitest-results.json |
| Security | Invalid-signature tests | 1 | local | metrics/raw/vitest-results.json |
| Security | Open critical/high dependency alerts | Not recorded yet | manual | GitHub Dependabot alerts (Report from GitHub security alerts after enabled.) |
| Security | CodeQL open alerts | Not recorded yet | manual | GitHub code scanning alerts (Report from GitHub code scanning after enabled.) |
| Security | OpenSSF Scorecard | Not recorded yet | manual | OpenSSF Scorecard workflow (Report after Scorecard publishes a result.) |

## Notes

- Null values mean the metric has not been automated or recorded yet.
- Local and synthetic metrics should not be described as production metrics.
- Cloudflare Worker platform metrics should be added only after they are collected from Cloudflare or a real telemetry export.
