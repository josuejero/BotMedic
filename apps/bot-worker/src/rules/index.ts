export type SymptomId =
  | 'token_config_issue'
  | 'missing_permissions'
  | 'bot_offline_after_deploy'
  | 'bad_environment_variables'
  | 'interaction_endpoint_failure'
  | 'package_runtime_mismatch';

export interface RuleCase {
  id: SymptomId;
  customId: string;
  buttonLabel: string;
  buttonEmoji: string;
  buttonStyle: 1 | 2 | 3 | 4 | 5;
  symptom: string;
  evidence: string[];
  diagnosis: string;
  likelyCause: string;
  confidenceScore: number; // 0-100
  firstChecks: string[];
  safeNextStep: string;
  escalationThreshold: string;
  customerSafeExplanation: string;
}

const buildCustomId = (id: SymptomId) => `helpme_symptom_${id}`;

export const RULE_CASES: RuleCase[] = [
  {
    id: 'token_config_issue',
    customId: buildCustomId('token_config_issue'),
    buttonLabel: 'Token/config issues',
    buttonEmoji: '🔐',
    buttonStyle: 1,
    symptom: 'Interactions fail with signature or verification errors.',
    evidence: [
      'Recent deployment or config change touching environment variables',
      'Discord logs show signature validation failures or 401 responses',
      'Worker logs mention missing DISCORD_PUBLIC_KEY or secrets'
    ],
    diagnosis: 'Invalid request signatures because BotMedic is using the wrong key or hashing flow.',
    likelyCause: 'DISCORD_PUBLIC_KEY or verifier config is empty/mismatched with the Discord application.',
    confidenceScore: 92,
    firstChecks: [
      'Confirm DISCORD_PUBLIC_KEY is set, non-empty, and matches the portal value',
      'Re-deploy or restart after updating secrets so the worker picks up the latest values'
    ],
    safeNextStep: 'Validate the public key copy/paste and rerun a slash command in a test guild.',
    escalationThreshold: 'Escalate if signature failures persist after a clean redeploy and key audit.',
    customerSafeExplanation:
      'BotMedic is reachable, but Discord rejects commands before they reach the worker because interaction verification is misconfigured.'
  },
  {
    id: 'missing_permissions',
    customId: buildCustomId('missing_permissions'),
    buttonLabel: 'Missing permissions',
    buttonEmoji: '🛠️',
    buttonStyle: 3,
    symptom: 'Slash commands return permission errors or no action even though the worker runs.',
    evidence: [
      'The permissions check command flags missing critical bits',
      'Discord requires use/application commands and channel overrides for BotMedic',
      'User sees warnings about sending embeds or reading history'
    ],
    diagnosis: 'Discord intentionally drops or fails commands because the bot role lacks required flags.',
    likelyCause: 'Bot role or channel overrides are missing at least one of the essential permissions.',
    confidenceScore: 78,
    firstChecks: [
      'Run /permissions and note any missing labels in the response',
      'Compare the bot role and channel overrides to the required permission list in the documentation'
    ],
    safeNextStep: 'Update the bot role/overrides so all channel permission bits the docs list are granted.',
    escalationThreshold: 'Escalate if permission edits do not fix the missing-bit response after two attempts.',
    customerSafeExplanation:
      'BotMedic needs more channel permissions before Discord will allow it to post diagnostic replies.'
  },
  {
    id: 'bot_offline_after_deploy',
    customId: buildCustomId('bot_offline_after_deploy'),
    buttonLabel: 'Bot offline after deploy',
    buttonEmoji: '⚙️',
    buttonStyle: 4,
    symptom: 'Recent deployments leave the bot unreachable or commands time out.',
    evidence: [
      'New build was just published to Cloudflare Workers',
      'Health/latency commands now refuse to respond or trigger ECONN reset',
      'No new logs appear even though Discord tries to call the endpoint'
    ],
    diagnosis: 'Deployment succeeded but the new worker or routing is not ready, so Discord cannot reach the bot.',
    likelyCause: 'The worker is either not deployed, disabled, or DNS/route is outdated.',
    confidenceScore: 82,
    firstChecks: [
      'Verify the worker deployment status in the Cloudflare dashboard',
      'Confirm the interaction endpoint URL matches the latest published worker'
    ],
    safeNextStep: 'Re-deploy or roll back the worker, then test /health to ensure replies return within 3 seconds.',
    escalationThreshold: 'Escalate if the bot stays offline after two consecutive deployments and health checks fail.',
    customerSafeExplanation:
      'BotMedic is temporarily offline; we are redeploying the worker to restore diagnostics.'
  },
  {
    id: 'bad_environment_variables',
    customId: buildCustomId('bad_environment_variables'),
    buttonLabel: 'Bad environment variables',
    buttonEmoji: '🧪',
    buttonStyle: 2,
    symptom: 'Env/config validation highlights missing or malformed values.',
    evidence: [
      'The /envcheck command flags missing required values',
      'Worker logs show empty or invalid variables during startup',
      'Behavior changes after toggling BOT_ENV or BOT_VERSION entries'
    ],
    diagnosis: 'One or more critical env vars are absent or malformed, leading to unpredictable runtime behavior.',
    likelyCause: 'Secrets were not set in the deployment environment or were mistyped when redeploying.',
    confidenceScore: 74,
    firstChecks: [
      'Run /envcheck and ensure every required variable is marked as present',
      'Check the deployment secrets in Cloudflare and compare the values to .env.local'
    ],
    safeNextStep: 'Set the missing keys to valid strings and redeploy the worker.',
    escalationThreshold: 'Escalate if the env errors persist across redeploys and block other automations.',
    customerSafeExplanation:
      'BotMedic still needs a few configuration values before it can run reliably; double-check the secrets.'
  },
  {
    id: 'interaction_endpoint_failure',
    customId: buildCustomId('interaction_endpoint_failure'),
    buttonLabel: 'Interaction endpoint failure',
    buttonEmoji: '🌐',
    buttonStyle: 5,
    symptom: '/health or /envcheck hits and returns HTTP 404/503 or empty responses.',
    evidence: [
      'Discord reports endpoint errors or timeouts in its developer dashboard',
      'Signed interactions stop hitting the worker despite the bot remaining deployed',
      'Latency checks rarely complete and logging shows the wrong handler signature'
    ],
    diagnosis: 'Discord cannot reach the correct interaction endpoint due to routing, signature, or DNS mistakes.',
    likelyCause: 'Interaction endpoint URL no longer points to the running worker or path, or there is a CDN misconfiguration.',
    confidenceScore: 65,
    firstChecks: [
      'Confirm the interaction endpoint URL in Discord matches the worker URL plus /',
      'Ensure TLS certificates and Cloudflare DNS entries are healthy'
    ],
    safeNextStep: 'Update the endpoint URL to the current worker/domain and trigger a fresh /health after changes.',
    escalationThreshold: 'Escalate if Discord keeps logging endpoint failures for more than 10 minutes.',
    customerSafeExplanation:
      'Discord cannot reach BotMedic at the address configured for slash commands, so interactions are dropped before they arrive.'
  },
  {
    id: 'package_runtime_mismatch',
    customId: buildCustomId('package_runtime_mismatch'),
    buttonLabel: 'Package/runtime mismatch',
    buttonEmoji: '🧰',
    buttonStyle: 2,
    symptom: 'Commands error with stack traces referencing incompatible modules or Node versions.',
    evidence: [
      'Logs mention unexpected exports, missing dependencies, or runtime version (e.g., unsupported API)',
      'Local `npm run build` works but deployed worker throws when executing /health',
      'Package lock version drifts from the runtime image'
    ],
    diagnosis: 'A dependency or platform API the worker needs is not available in the deployed runtime.',
    likelyCause: 'The lockfile or bundler output targets a Node version/features that Cloudflare Workers does not support.',
    confidenceScore: 58,
    firstChecks: [
      'Review the bundle output for unsupported syntax or modules',
      'Compare package-lock versions on dev vs production environments'
    ],
    safeNextStep: 'Adjust the build/runtime target (polyfills or transpiler) so the worker uses supported APIs, then redeploy.',
    escalationThreshold: 'Escalate if runtime errors persist after verifying the build chain.',
    customerSafeExplanation:
      'BotMedic encountered a runtime mismatch; we are adjusting the build target so it runs in the worker environment.'
  }
];

export function getRuleCase(customId?: string): RuleCase | undefined {
  if (!customId) {
    return undefined;
  }
  return RULE_CASES.find((rule) => rule.customId === customId);
}

export interface SupportResponseSections {
  internal: string[];
  customer: string[];
}

export function buildSupportResponseSections(rule: RuleCase): SupportResponseSections {
  const internal: string[] = [
    'Internal diagnosis:',
    `• Diagnosis: ${rule.diagnosis}`,
    `• Probable root cause: ${rule.likelyCause}`,
    `• Exact checks performed: ${rule.firstChecks.join(' · ')}`,
    `• Confidence level: ${rule.confidenceScore}%`,
    `• Technical next step: ${rule.safeNextStep}`,
    `• When to escalate: ${rule.escalationThreshold}`
  ];

  const customer: string[] = [
    'Customer-facing explanation:',
    `• What happened: ${rule.customerSafeExplanation} We’re keeping a close eye on it so nothing catches you off guard.`,
    `• What to try next: ${rule.safeNextStep}`,
    `• When to contact support again: ${rule.escalationThreshold} Expect us to monitor the follow-up window before escalating.`
  ];

  return { internal, customer };
}
