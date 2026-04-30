import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { commands, DISCORD_COMMANDS } from '../../packages/commands/src/index';
import { RULE_CASES } from '../../packages/rules/src/index';

const root = process.cwd();
const rawDir = join(root, 'metrics', 'raw');
mkdirSync(rawDir, { recursive: true });

function walkFiles(dir: string): string[] {
  try {
    return readdirSync(dir).flatMap((entry) => {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      return stat.isDirectory() ? walkFiles(fullPath) : [fullPath];
    });
  } catch {
    return [];
  }
}

function readJson<T>(relativePath: string): T | null {
  try {
    return JSON.parse(readFileSync(join(root, relativePath), 'utf8')) as T;
  } catch {
    return null;
  }
}

const runbookPages = walkFiles(join(root, 'site', 'runbooks'))
  .filter((file) => file.endsWith('.html') && basename(file).toLowerCase() !== 'index.html');
const docsMarkdown = walkFiles(join(root, 'docs')).filter((file) => file.endsWith('.md'));
const screenshots = walkFiles(join(root, 'site', 'assets', 'screenshots'));
const testFiles = walkFiles(join(root, 'apps', 'bot-worker', 'tests')).filter((file) => file.endsWith('.ts'));
const testSource = testFiles.map((file) => readFileSync(file, 'utf8')).join('\n');

const symptoms = readJson<unknown[]>('fixtures/incidents/symptoms.json') ?? [];
const dashboardSamples = readJson<unknown[]>('fixtures/incidents/dashboard-samples.json') ?? [];
const diagnosisSnapshots = readJson<Record<string, unknown>>('fixtures/incidents/diagnosis-snapshots.json') ?? {};
const customerSafe = readJson<Record<string, unknown>>('fixtures/incidents/customer-safe.json') ?? {};

const scope = {
  generated_at: new Date().toISOString(),
  source: process.env.CI ? 'CI' : 'local',
  slash_commands: commands.length,
  discord_command_definitions: DISCORD_COMMANDS.length,
  rule_cases: RULE_CASES.length,
  symptom_fixtures: symptoms.length,
  diagnosis_snapshots: Object.keys(diagnosisSnapshots).length,
  customer_safe_messages: Object.keys(customerSafe).length,
  dashboard_samples: dashboardSamples.length,
  generated_runbook_pages: runbookPages.length,
  docs_markdown_files: docsMarkdown.length,
  screenshot_assets: screenshots.length,
  test_files: testFiles.length,
  declared_vitest_tests: (testSource.match(/\bit\s*\(/g) ?? []).length
};

writeFileSync(join(rawDir, 'scope.json'), `${JSON.stringify(scope, null, 2)}\n`);
console.log(JSON.stringify(scope, null, 2));
