import { EnvBindings } from './types/discord';
import { COMMAND_NAMES, type CommandName } from '@botmedic/commands';
import type { RuleCase } from '@botmedic/rules';

const COMMAND_COUNTER_KEY = 'botmedic:command_counts';
const HEALTH_KEY = 'botmedic:last_health';
const DIAGNOSIS_KEY = 'botmedic:last_diagnosis';
const INTERACTION_ROLLUP_KEY = 'botmedic:interaction_rollup';
const MAX_RECENT_LATENCIES = 100;

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
  interactionRollup?: InteractionRollup;
}

export interface InteractionMetric {
  commandName?: string;
  status: number;
  latencyMs: number;
  interactionType?: number;
  responseType?: number;
  timestamp: string;
}

export interface InteractionRollup {
  total: number;
  success: number;
  error: number;
  underThreeSeconds: number;
  latencyBuckets: Record<'lt100' | 'lt250' | 'lt500' | 'lt1000' | 'lt3000' | 'gte3000', number>;
  recentLatenciesMs: number[];
  byCommand: Record<string, number>;
  lastEvent?: InteractionMetric;
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

function defaultRollup(): InteractionRollup {
  return {
    total: 0,
    success: 0,
    error: 0,
    underThreeSeconds: 0,
    latencyBuckets: {
      lt100: 0,
      lt250: 0,
      lt500: 0,
      lt1000: 0,
      lt3000: 0,
      gte3000: 0
    },
    recentLatenciesMs: [],
    byCommand: {}
  };
}

function normalizeRollup(input?: InteractionRollup | null): InteractionRollup {
  const defaults = defaultRollup();
  return {
    ...defaults,
    ...(input ?? {}),
    latencyBuckets: {
      ...defaults.latencyBuckets,
      ...(input?.latencyBuckets ?? {})
    },
    recentLatenciesMs: Array.isArray(input?.recentLatenciesMs) ? input.recentLatenciesMs : [],
    byCommand: input?.byCommand ?? {}
  };
}

function latencyBucket(latencyMs: number): keyof InteractionRollup['latencyBuckets'] {
  if (latencyMs < 100) return 'lt100';
  if (latencyMs < 250) return 'lt250';
  if (latencyMs < 500) return 'lt500';
  if (latencyMs < 1000) return 'lt1000';
  if (latencyMs < 3000) return 'lt3000';
  return 'gte3000';
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

export async function recordInteractionMetric(env: EnvBindings, metric: InteractionMetric): Promise<void> {
  const kv = env.DASHBOARD_KV;
  if (!kv) return;

  const existing = normalizeRollup(await readJson<InteractionRollup>(kv, INTERACTION_ROLLUP_KEY));
  const latencyMs = Number.isFinite(metric.latencyMs) ? Math.max(0, Math.round(metric.latencyMs)) : 0;
  const safeMetric: InteractionMetric = {
    ...metric,
    latencyMs
  };
  const bucket = latencyBucket(latencyMs);
  const recentLatenciesMs = [...existing.recentLatenciesMs, latencyMs].slice(-MAX_RECENT_LATENCIES);
  const commandName = metric.commandName ?? 'unknown';
  const isSuccess = metric.status >= 200 && metric.status < 400;
  const isError = metric.status >= 400;

  const next: InteractionRollup = {
    ...existing,
    total: existing.total + 1,
    success: existing.success + (isSuccess ? 1 : 0),
    error: existing.error + (isError ? 1 : 0),
    underThreeSeconds: existing.underThreeSeconds + (latencyMs < 3000 ? 1 : 0),
    latencyBuckets: {
      ...existing.latencyBuckets,
      [bucket]: existing.latencyBuckets[bucket] + 1
    },
    recentLatenciesMs,
    byCommand: {
      ...existing.byCommand,
      [commandName]: (existing.byCommand[commandName] ?? 0) + 1
    },
    lastEvent: safeMetric
  };

  await kv.put(INTERACTION_ROLLUP_KEY, JSON.stringify(next));
}

export async function readInteractionRollup(env: EnvBindings): Promise<InteractionRollup | undefined> {
  const kv = env.DASHBOARD_KV;
  if (!kv) return undefined;
  const rollup = await readJson<InteractionRollup>(kv, INTERACTION_ROLLUP_KEY);
  return rollup ? normalizeRollup(rollup) : undefined;
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
  const interactionRollup = await readInteractionRollup(env);

  return {
    commandCounts,
    lastHealth: lastHealth ?? undefined,
    lastDiagnosis: lastDiagnosis ?? undefined,
    interactionRollup
  };
}

export { COMMAND_NAMES };
export type { CommandName };
