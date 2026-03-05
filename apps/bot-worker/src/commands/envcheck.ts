import { InteractionResponse, InteractionResponseType, EnvBindings } from '../types/discord';

const VALID_ENVIRONMENTS = ['development', 'staging', 'production', 'test'] as const;

type EnvRule = {
  key: keyof EnvBindings;
  label: string;
  required: boolean;
  validator?: (value: string) => boolean;
  hint?: string;
};

const ENV_RULES: EnvRule[] = [
  {
    key: 'DISCORD_PUBLIC_KEY',
    label: 'Discord public key',
    required: true,
    validator: (value) => /^([0-9a-fA-F]{64})$/.test(value),
    hint: 'must be a 32-byte hex string provided by the Discord developer portal'
  },
  {
    key: 'BOT_VERSION',
    label: 'Bot version tag',
    required: false,
    validator: (value) => value.length > 0,
    hint: 'used for health responses and release tracking'
  },
  {
    key: 'BOT_ENV',
    label: 'Bot environment',
    required: false,
    validator: (value) => VALID_ENVIRONMENTS.includes(value.toLowerCase() as typeof VALID_ENVIRONMENTS[number]),
    hint: `should match one of: ${VALID_ENVIRONMENTS.join(', ')}`
  }
];

export function buildEnvCheckResponse(env: EnvBindings): InteractionResponse {
  const missingRequired: string[] = [];
  const invalid: string[] = [];
  const optionalMissing: string[] = [];

  for (const rule of ENV_RULES) {
    const rawValue = env[rule.key];
    const normalized = typeof rawValue === 'string' ? rawValue.trim() : '';
    if (!normalized) {
      if (rule.required) {
        missingRequired.push(rule.label);
      } else {
        optionalMissing.push(rule.label);
      }
      continue;
    }

    if (rule.validator && !rule.validator(normalized)) {
      invalid.push(`${rule.label} (${rule.hint ?? 'invalid value'})`);
    }
  }

  const lines: string[] = ['BotMedic environment check:'];

  if (missingRequired.length) {
    lines.push(`• ⚠️ Missing required values: ${missingRequired.join(', ')}`);
  }

  if (invalid.length) {
    lines.push(`• ⚠️ Malformed/mismatched values: ${invalid.join(', ')}`);
  }

  if (!missingRequired.length && !invalid.length) {
    lines.push('• ✅ Required variables look good.');
  }

  if (optionalMissing.length) {
    lines.push(`• ℹ️ Optional but recommended: ${optionalMissing.join(', ')}`);
  }

  if (env.BOT_VERSION) {
    lines.push(`• Bot version: ${env.BOT_VERSION}`);
  }

  if (env.BOT_ENV) {
    lines.push(`• Environment: ${env.BOT_ENV}`);
  }

  if (!env.BOT_ENV) {
    lines.push('• Environment not set; defaulting to development until you provide BOT_ENV.');
  }

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: lines.join('\n'),
      flags: 64
    }
  };
}
