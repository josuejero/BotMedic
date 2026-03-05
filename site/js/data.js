/**
 * Shared data rooted in the worker.
 * Update this file whenever the worker's rule cases or command set change.
 * Source files:
 *   - apps/bot-worker/src/rules/index.ts
 *   - apps/bot-worker/scripts/register-commands.ts
 */

export const commands = [
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
  }
];

export const ruleCases = [
  {
    id: 'token_config_issue',
    label: 'Token/config issues',
    symptom: 'Interactions fail with signature or verification errors.',
    evidence: [
      'Recent deployment or config change touching environment variables',
      'Discord logs cite signature validation failures or 401 responses',
      'Worker logs mention missing DISCORD_PUBLIC_KEY or verifier secrets'
    ],
    diagnosis: 'Invalid request signatures because BotMedic is using the wrong key or hashing flow.',
    likelyCause: 'DISCORD_PUBLIC_KEY or verifier config is empty, mismatched, or not refreshed after redeploy.',
    confidence: 92,
    firstChecks: [
      'Confirm DISCORD_PUBLIC_KEY is set, non-empty, and matches the portal value',
      'Re-deploy or restart after updating secrets so the worker picks up the latest values'
    ],
    safeRecoverySteps: [
      'Copy the public key from the Discord portal and paste it into Cloudflare secrets verbatim.',
      'Trigger a fresh /health in a test guild once the new key is in place to confirm signatures succeed.'
    ],
    safeNextStep: 'Validate the public key copy/paste and rerun a slash command in a test guild.',
    escalationThreshold: 'Escalate if signature failures persist after a clean redeploy and key audit.',
    customerSafeExplanation:
      'BotMedic is reachable, but Discord rejects commands before they reach the worker because interaction verification is misconfigured.',
    dontDoThisFirst: 'Don’t rotate tokens or secrets before confirming the key currently stored in Cloudflare matches the portal.'
  },
  {
    id: 'missing_permissions',
    label: 'Missing permissions',
    symptom: 'Slash commands return permission errors or no action even though the worker runs.',
    evidence: [
      'The permissions check command flags missing critical bits',
      'Discord requires use/application commands and channel overrides for BotMedic',
      'Users see warnings about sending embeds or reading history'
    ],
    diagnosis: 'Discord intentionally drops or fails commands because the bot role lacks required flags.',
    likelyCause: 'Bot role or channel overrides are missing at least one essential permission bit.',
    confidence: 78,
    firstChecks: [
      'Run /permissions and note any missing labels in the response',
      'Compare the bot role and channel overrides to the required permission list in the documentation'
    ],
    safeRecoverySteps: [
      'Grant the listed permissions to the bot role, then re-run /permissions to confirm success.',
      'Update any channel overrides that block those flags, since overrides can silently block commands.'
    ],
    safeNextStep: 'Update the bot role/overrides so all channel permission bits the docs list are granted.',
    escalationThreshold: 'Escalate if permission edits do not fix the missing-bit response after two attempts.',
    customerSafeExplanation:
      'BotMedic needs more channel permissions before Discord will allow it to post diagnostic replies.',
    dontDoThisFirst: 'Don’t redeploy the worker or fiddle with DNS before confirming the bot role truly has the required bits.'
  },
  {
    id: 'bot_offline_after_deploy',
    label: 'Bot offline after deploy',
    symptom: 'Recent deployments leave the bot unreachable or commands time out.',
    evidence: [
      'New build was just published to Cloudflare Workers',
      'Health/latency commands now refuse to respond or trigger ECONN reset',
      'No new logs appear even though Discord tries to call the endpoint'
    ],
    diagnosis: 'Deployment succeeded but the new worker or routing is not ready, so Discord cannot reach the bot.',
    likelyCause: 'The worker is either not deployed, disabled, or routing (DNS/route) still points to an old version.',
    confidence: 82,
    firstChecks: [
      'Verify the worker deployment status in the Cloudflare dashboard',
      'Confirm the interaction endpoint URL matches the latest published worker'
    ],
    safeRecoverySteps: [
      'Re-deploy or roll back the worker, then test /health to ensure replies return within 3 seconds.',
      'Monitor Cloudflare logs for deployment errors before escalating to networking teams.'
    ],
    safeNextStep: 'Re-deploy or roll back the worker, then test /health to ensure replies return within 3 seconds.',
    escalationThreshold: 'Escalate if the bot stays offline after two consecutive deployments and health checks fail.',
    customerSafeExplanation:
      'BotMedic is temporarily offline; we are redeploying the worker to restore diagnostics.',
    dontDoThisFirst: 'Don’t toggle DNS or delete deployments before checking the latest publish status; you might break routing further.'
  },
  {
    id: 'bad_environment_variables',
    label: 'Bad environment variables',
    symptom: 'Env/config validation highlights missing or malformed values.',
    evidence: [
      'The /envcheck command flags missing required values',
      'Worker logs show empty or invalid variables during startup',
      'Behavior changes after toggling BOT_ENV or BOT_VERSION entries'
    ],
    diagnosis: 'One or more critical env vars are absent or malformed, leading to unpredictable runtime behavior.',
    likelyCause: 'Secrets were not set in the deployment environment or were mistyped when redeploying.',
    confidence: 74,
    firstChecks: [
      'Run /envcheck and ensure every required variable is marked as present',
      'Check the deployment secrets in Cloudflare and compare the values to .env.local'
    ],
    safeRecoverySteps: [
      'Set the missing keys to valid strings and re-run /envcheck until everything reports green.',
      'Add a secret-check gate in the deployment pipeline to catch typos before shipping.'
    ],
    safeNextStep: 'Set the missing keys to valid strings and redeploy the worker.',
    escalationThreshold: 'Escalate if the env errors persist across redeploys and block other automations.',
    customerSafeExplanation:
      'BotMedic still needs a few configuration values before it can run reliably; double-check the secrets.',
    dontDoThisFirst: 'Don’t delete configuration keys while troubleshooting; verify the current values first so you can restore them.'
  },
  {
    id: 'interaction_endpoint_failure',
    label: 'Interaction endpoint failure',
    symptom: '/health or /envcheck hits and returns HTTP 404/503 or empty responses.',
    evidence: [
      'Discord reports endpoint errors or timeouts in its developer dashboard',
      'Signed interactions stop hitting the worker despite the bot remaining deployed',
      'Latency checks rarely complete and logging shows the wrong handler signature'
    ],
    diagnosis: 'Discord cannot reach the correct interaction endpoint due to routing, signature, or DNS mistakes.',
    likelyCause: 'Interaction endpoint URL no longer points to the running worker or path, or there is a CDN misconfiguration.',
    confidence: 65,
    firstChecks: [
      'Confirm the interaction endpoint URL in Discord matches the worker URL plus /',
      'Ensure TLS certificates and Cloudflare DNS entries are healthy'
    ],
    safeRecoverySteps: [
      'Update the endpoint URL to the current worker/domain and trigger a fresh /health after changes.',
      'Validate the TLS chain and Cloudflare DNS records before telling Discord about the new URL.'
    ],
    safeNextStep: 'Update the endpoint URL to the current worker/domain and trigger a fresh /health after changes.',
    escalationThreshold: 'Escalate if Discord keeps logging endpoint failures for more than 10 minutes.',
    customerSafeExplanation:
      'Discord cannot reach BotMedic at the address configured for slash commands, so interactions are dropped before they arrive.',
    dontDoThisFirst: 'Don’t regenerate the public key or tokens before confirming that the URL itself is the issue.'
  },
  {
    id: 'package_runtime_mismatch',
    label: 'Package/runtime mismatch',
    symptom: 'Commands error with stack traces referencing incompatible modules or Node versions.',
    evidence: [
      'Logs mention unexpected exports, missing dependencies, or runtime version (e.g., unsupported API)',
      'Local `npm run build` works but deployed worker throws when executing /health',
      'Package lock version drifts from the runtime image'
    ],
    diagnosis: 'A dependency or platform API the worker needs is not available in the deployed runtime.',
    likelyCause: 'The lockfile or bundler output targets a Node version/features that Cloudflare Workers does not support.',
    confidence: 58,
    firstChecks: [
      'Review the bundle output for unsupported syntax or modules',
      'Compare package-lock versions on dev vs production environments'
    ],
    safeRecoverySteps: [
      'Adjust the build/runtime target (polyfills or transpiler) so the worker uses supported APIs, then redeploy.',
      'Pin dependencies so the bundle keeps matching the Cloudflare runtime capabilities.'
    ],
    safeNextStep: 'Adjust the build/runtime target (polyfills or transpiler) so the worker uses supported APIs, then redeploy.',
    escalationThreshold: 'Escalate if runtime errors persist after verifying the build chain.',
    customerSafeExplanation:
      'BotMedic encountered a runtime mismatch; we are adjusting the build target so it runs in the worker environment.',
    dontDoThisFirst: 'Don’t swap in new dependencies without locking the bundler output and re-running the worker locally.'
  }
];
