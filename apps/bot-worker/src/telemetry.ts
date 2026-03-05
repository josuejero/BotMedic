import { EnvBindings } from './types/discord';
import { COMMAND_NAMES, type CommandName } from '@botmedic/commands';
import type { RuleCase } from '@botmedic/rules';

const COMMAND_COUNTER_KEY = 'botmedic:command_counts';
const HEALTH_KEY = 'botmedic:last_health';
const DIAGNOSIS_KEY = 'botmedic:last_diagnosis';

export interface HealthRecord {
  timestamp: string;
  environment?: string;
}

export interface DiagnosisRecord {
  timestamp: string;
  ruleId: RuleCase['id'];
  label: string;
  safeNextStep: string;
}

export interface DashboardData {
  commandCounts: Record<CommandName, number>;
  lastHealth?: HealthRecord;
  lastDiagnosis?: DiagnosisRecord;
}

function buildDefaultCounts(): Record<CommandName, number> {
  return COMMAND_NAMES.reduce((acc, command) => {
    acc[command] = 0;
    return acc;
  }, {} as Record<CommandName, number>);
}

function isTrackedCommand(name: string): name is CommandName {
  return (COMMAND_NAMES as readonly string[]).includes(name);
}

async function readJson<T>(kv: KVNamespace, key: string): Promise<T | null> {
  try {
    return (await kv.get(key, { type: 'json' })) as T | null;
  } catch {
    return null;
  }
}

export async function recordCommandUsage(env: EnvBindings, commandName: string): Promise<void> {
  const kv = env.DASHBOARD_KV;
  if (!kv) return;

  const normalized = commandName.toLowerCase();
  if (!isTrackedCommand(normalized)) {
    return;
  }

  const existing = (await kv.get(COMMAND_COUNTER_KEY, { type: 'json' })) as Record<string, number> | null;
  const next: Record<string, number> = { ...(existing ?? {}) };
  next[normalized] = (Number(next[normalized] ?? 0) + 1) || 1;

  await kv.put(COMMAND_COUNTER_KEY, JSON.stringify(next));
}

export async function recordHealthSuccess(env: EnvBindings): Promise<void> {
  const kv = env.DASHBOARD_KV;
  if (!kv) return;

  const payload: HealthRecord = {
    timestamp: new Date().toISOString(),
    environment: env.BOT_ENV
  };

  await kv.put(HEALTH_KEY, JSON.stringify(payload));
}

export async function recordDiagnosis(env: EnvBindings, rule?: RuleCase): Promise<void> {
  const kv = env.DASHBOARD_KV;
  if (!kv || !rule) return;

  const payload: DiagnosisRecord = {
    timestamp: new Date().toISOString(),
    ruleId: rule.id,
    label: rule.buttonLabel,
    safeNextStep: rule.safeNextStep
  };

  await kv.put(DIAGNOSIS_KEY, JSON.stringify(payload));
}

export async function readDashboardData(env: EnvBindings): Promise<DashboardData> {
  const kv = env.DASHBOARD_KV;
  const defaults = buildDefaultCounts();
  if (!kv) {
    return {
      commandCounts: defaults
    };
  }

  const storedCounts = (await readJson<Record<string, number>>(kv, COMMAND_COUNTER_KEY)) ?? {};
  const commandCounts = COMMAND_NAMES.reduce((acc, command) => {
    const storedValue = storedCounts[command];
    acc[command] = Number(storedValue ?? 0);
    return acc;
  }, {} as Record<CommandName, number>);

  const lastHealth = await readJson<HealthRecord>(kv, HEALTH_KEY);
  const lastDiagnosis = await readJson<DiagnosisRecord>(kv, DIAGNOSIS_KEY);

  return {
    commandCounts,
    lastHealth: lastHealth ?? undefined,
    lastDiagnosis: lastDiagnosis ?? undefined
  };
}

export { COMMAND_NAMES };
export type { CommandName };
