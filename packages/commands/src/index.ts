import { RULE_CASES } from '@botmedic/rules';

export interface CommandDefinition {
  name: string;
  icon: string;
  description: string;
}

export const commands: CommandDefinition[] = [
  {
    name: 'health',
    icon: '🩺',
    description: 'Confirm the worker is alive, shows version/environment, and logs a timestamped check.'
  },
  {
    name: 'envcheck',
    icon: '🧭',
    description: 'Validate required bindings (Discord key, version, env) and surface malformed values.'
  },
  {
    name: 'permissions',
    icon: '🛠️',
    description: 'Inspect the bot/application permissions that arrived with the slash command.'
  },
  {
    name: 'latency',
    icon: '⚡',
    description: 'Compare Discord timestamp headers to now and report around-trip latency and warnings.'
  },
  {
    name: 'helpme',
    icon: '🤖',
    description: 'Present a symptom grid, then surface internal diagnostics + customer-friendly messaging.'
  },
  {
    name: 'incident',
    icon: '🧪',
    description: 'Replay a seeded failure scenario, including the deferred-response path for slow handlers.'
  }
];

export const COMMAND_NAMES = commands.map((command) => command.name) as const;
export type CommandName = (typeof COMMAND_NAMES)[number];

const incidentScenarioChoices = RULE_CASES.map((rule) => ({
  name: rule.buttonLabel,
  value: rule.id
}));

export const DISCORD_COMMANDS = [
  {
    name: 'health',
    type: 1,
    description: 'Confirm BotMedic is responsive',
    dm_permission: false,
    default_member_permissions: null
  },
  {
    name: 'envcheck',
    type: 1,
    description: 'Verify required BotMedic environment variables',
    dm_permission: false,
    default_member_permissions: null
  },
  {
    name: 'permissions',
    type: 1,
    description: 'Check the bot role/channel permissions locally',
    dm_permission: false,
    default_member_permissions: null
  },
  {
    name: 'latency',
    type: 1,
    description: 'Measure the round-trip latency for this interaction',
    dm_permission: false,
    default_member_permissions: null
  },
  {
    name: 'helpme',
    type: 1,
    description: 'Give me troubleshooting hints with BotMedic',
    dm_permission: false,
    default_member_permissions: null
  },
  {
    name: 'incident',
    type: 1,
    description: 'Replay a seeded incident scenario',
    dm_permission: false,
    default_member_permissions: null,
    options: [
      {
        name: 'scenario',
        description: 'Choose which incident to replay',
        type: 3,
        required: false,
        choices: incidentScenarioChoices
      }
    ]
  }
];
