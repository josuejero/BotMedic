/**
 * AUTO-GENERATED. Do not edit directly.
 * Run "npm run generate-site-data" after updating rules or commands.
 */

export const commands = [
  {
    "name": "health",
    "icon": "🩺",
    "description": "Confirm the worker is alive, shows version/environment, and logs a timestamped check."
  },
  {
    "name": "envcheck",
    "icon": "🧭",
    "description": "Validate required bindings (Discord key, version, env) and surface malformed values."
  },
  {
    "name": "permissions",
    "icon": "🛠️",
    "description": "Inspect the bot/application permissions that arrived with the slash command."
  },
  {
    "name": "latency",
    "icon": "⚡",
    "description": "Compare Discord timestamp headers to now and report around-trip latency and warnings."
  },
  {
    "name": "helpme",
    "icon": "🤖",
    "description": "Present a symptom grid, then surface internal diagnostics + customer-friendly messaging."
  },
  {
    "name": "incident",
    "icon": "🧪",
    "description": "Replay a seeded failure scenario, including the deferred-response path for slow handlers."
  }
];

export const ruleCases = [
  {
    "id": "invalid_token",
    "customId": "helpme_symptom_invalid_token",
    "buttonLabel": "Invalid/rotated bot token",
    "buttonEmoji": "🔐",
    "buttonStyle": 1,
    "symptom": "Slash commands return 401s or disappear before reaching the worker whenever Discord hits the endpoint.",
    "evidence": [
      "Discord logs list \"401 Unauthorized\" before the HTTP body ever arrives",
      "Worker traces show zero requests even though Discord reports interaction attempts",
      "A fresh deployment or role change coincided with the bot token being rotated"
    ],
    "diagnosis": "Discord rejects the bot token, so interactions never hit the worker despite Cloudflare being available.",
    "likelyCause": "DISCORD_BOT_TOKEN in Cloudflare is empty, expired, or mismatched with the Discord application.",
    "confidenceScore": 90,
    "firstChecks": [
      "Copy the bot token from the Discord developer portal and paste it into Cloudflare secrets verbatim",
      "Trigger a redeploy so the worker picks up the rotated token before testing /health again"
    ],
    "safeNextStep": "Rotate or restore the bot token, redeploy, then run /health in a staging guild.",
    "escalationThreshold": "Escalate if Discord still rejects commands with 401s after two redeploys with the verified token.",
    "customerSafeExplanation": "BotMedic cannot authenticate with Discord until the bot credentials are restored; we are refreshing them now.",
    "safeRecoverySteps": [
      "Validate the bot token listed in the Discord portal and paste it into Cloudflare secrets.",
      "Redeploy the worker so the new token is active, then run diagnostics to confirm interaction replies succeed."
    ],
    "dontDoThisFirst": "Do not change DNS routes or permissions before confirming the token value is correct."
  },
  {
    "id": "missing_bot_permission",
    "customId": "helpme_symptom_missing_bot_permission",
    "buttonLabel": "Missing bot permission",
    "buttonEmoji": "⚠️",
    "buttonStyle": 3,
    "symptom": "Slash commands or responses get dropped/rejected with warnings about missing permissions.",
    "evidence": [
      "The /permissions command reports missing flags such as Send Messages or Use Application Commands",
      "Discord logs mention \"Missing Permissions\" when the bot tries to send an interaction reply",
      "The bot role lacks the same permission bits the docs require"
    ],
    "diagnosis": "Discord refuses to run commands because the bot role does not have the required high-level permissions.",
    "likelyCause": "Core permission bits (view/send/embed/use application commands) are absent on the bot role.",
    "confidenceScore": 82,
    "firstChecks": [
      "Run /permissions and capture the list of missing flags",
      "Compare the bot role's permission bits to the documented checklist and update as needed"
    ],
    "safeNextStep": "Grant the missing permission bits to the bot role (and redeploy overrides) before issuing commands.",
    "escalationThreshold": "Escalate if permission edits still yield missing flags after two rounds of updates.",
    "customerSafeExplanation": "BotMedic is blocked from sending diagnostic replies because it lacks required Discord permissions.",
    "safeRecoverySteps": [
      "Update the bot role so it has View Channels, Send Messages, Embed Links, Read History, and Use Application Commands.",
      "Confirm channel overrides do not revoke these permissions, then re-run /permissions."
    ],
    "dontDoThisFirst": "Do not redeploy the worker or touch DNS before verifying the permission bits."
  },
  {
    "id": "missing_env_var",
    "customId": "helpme_symptom_missing_env_var",
    "buttonLabel": "Missing environment variable",
    "buttonEmoji": "🧪",
    "buttonStyle": 2,
    "symptom": "Envcheck reports missing or malformed bindings and commands behave unpredictably.",
    "evidence": [
      "/envcheck flags required values as absent",
      "Worker logs print warnings about empty BOT_ENV or DISCORD_PUBLIC_KEY",
      "Changes to BOT_VERSION alter command text unexpectedly"
    ],
    "diagnosis": "One or more critical environment variables are not set or malformed, so the worker runs with incomplete configuration.",
    "likelyCause": "Secrets were not inserted into the Cloudflare deployment or were mistyped during the last deploy.",
    "confidenceScore": 78,
    "firstChecks": [
      "Run /envcheck; ensure the required keys are present and formatted correctly",
      "Compare the Cloudflare secret values to an .env.local copy or deployment manifest"
    ],
    "safeNextStep": "Add the missing variables with valid values and redeploy the worker.",
    "escalationThreshold": "Escalate if required bindings remain missing after deployments to both staging and production.",
    "customerSafeExplanation": "BotMedic is missing configuration values, so we need to restore those secrets before it can respond reliably.",
    "safeRecoverySteps": [
      "Set DISCORD_PUBLIC_KEY, BOT_VERSION, and BOT_ENV to valid strings in KV or secrets.",
      "Rerun /envcheck until it reports \"Required variables look good.\""
    ],
    "dontDoThisFirst": "Avoid deleting other secrets before recording their current values so they can be restored if needed."
  },
  {
    "id": "wrong_interaction_url",
    "customId": "helpme_symptom_wrong_interaction_url",
    "buttonLabel": "Wrong interaction URL",
    "buttonEmoji": "🌐",
    "buttonStyle": 4,
    "symptom": "Discord reports 404/503 on interactions even though the worker is deployed.",
    "evidence": [
      "Discord developer dashboard shows endpoint errors or \"Failed to reach your application\"",
      "Latency checks never reach the worker but DNS and certificates look healthy",
      "New deployments include a different route or domain than the one registered"
    ],
    "diagnosis": "Discord is hitting an outdated or missing interaction URL, so requests never arrive at the current worker.",
    "likelyCause": "The registered interaction endpoint points to an old subdomain, path, or disabled worker route.",
    "confidenceScore": 74,
    "firstChecks": [
      "Confirm the interaction URL in Discord matches the latest published Cloudflare worker domain and path",
      "Check Cloudflare Workers routes and DNS records to ensure they are active"
    ],
    "safeNextStep": "Update the interaction URL to the correct worker and run /health to verify responses.",
    "escalationThreshold": "Escalate if the endpoint remains unreachable for more than 10 minutes after updates.",
    "customerSafeExplanation": "Discord cannot find the address for BotMedic, so commands are dropped before they reach us.",
    "safeRecoverySteps": [
      "Copy the current worker URL and paste it into the Discord application's interaction endpoint.",
      "Ensure any CDN or DNS changes have fully propagated before retesting."
    ],
    "dontDoThisFirst": "Do not rotate keys or secrets before verifying that the endpoint itself is correct."
  },
  {
    "id": "wrong_public_key",
    "customId": "helpme_symptom_wrong_public_key",
    "buttonLabel": "Wrong public key",
    "buttonEmoji": "🧵",
    "buttonStyle": 1,
    "symptom": "Signature verification fails even though the request reaches the worker.",
    "evidence": [
      "Worker logs show \"Missing Discord public key\" or signature validation errors",
      "Requests drop into the invalid-signature branch before returning any command output",
      "The registered public key differs from the portal value after a recent key rotation"
    ],
    "diagnosis": "Discord signs requests with the most recent public key, but the worker still uses the old or missing value.",
    "likelyCause": "DISCORD_PUBLIC_KEY in the worker configuration is stale, empty, or miscopied.",
    "confidenceScore": 86,
    "firstChecks": [
      "Copy the public key from the Discord developer portal and verify the 64-character hex string matches Cloudflare",
      "Restart or redeploy the worker so the new key is picked up before rerunning commands"
    ],
    "safeNextStep": "Paste the correct public key into secrets and re-run /health to confirm verification succeeds.",
    "escalationThreshold": "Escalate if signature failures persist across builds after updating the public key.",
    "customerSafeExplanation": "BotMedic is reachable, but Discord rejects the signed payloads because the public key is misconfigured.",
    "safeRecoverySteps": [
      "Update DISCORD_PUBLIC_KEY with the portal value and rerun /envcheck to confirm it passes validation.",
      "Redeploy the worker and then invoke /health to ensure the verification step no longer fails."
    ],
    "dontDoThisFirst": "Do not rotate the bot token before confirming the public key matches the portal."
  },
  {
    "id": "dependency_runtime_mismatch",
    "customId": "helpme_symptom_dependency_runtime_mismatch",
    "buttonLabel": "Dependency/runtime mismatch",
    "buttonEmoji": "🧰",
    "buttonStyle": 2,
    "symptom": "The worker deploys but commands throw stack traces about unsupported modules or syntax.",
    "evidence": [
      "Cloudflare worker logs mention unexpected exports or missing dependencies",
      "Local builds succeed, but deployed /health errors out with runtime issues",
      "Package lock or bundler targets a Node API that Workers does not support"
    ],
    "diagnosis": "A dependency or platform API the worker relies on is unavailable in the deployed Cloudflare runtime.",
    "likelyCause": "The build output targets a higher Node version or includes modules that the Workers environment forbids.",
    "confidenceScore": 66,
    "firstChecks": [
      "Inspect the bundle or stack trace for Web API/polyfill stderr",
      "Compare dependency versions between local builds and the deployed lockfile"
    ],
    "safeNextStep": "Adjust the transpiler or dependency versions so they produce supported runtime constructs, then redeploy.",
    "escalationThreshold": "Escalate if runtime mismatches continue after locking the build target.",
    "customerSafeExplanation": "BotMedic encountered a runtime incompatibility; we are adjusting the build so it can run in Cloudflare Workers.",
    "safeRecoverySteps": [
      "Transpile the worker to ES2020 and remove unsupported Node-specific APIs.",
      "Lock dependency versions (including @noble/ed25519) and rebuild before redeploying."
    ],
    "dontDoThisFirst": "Do not immediately rollback; first confirm the bundle is targeting the supported worker runtime."
  },
  {
    "id": "stale_deployment",
    "customId": "helpme_symptom_stale_deployment",
    "buttonLabel": "Stale deployment",
    "buttonEmoji": "⚙️",
    "buttonStyle": 4,
    "symptom": "Recent deployments leave the worker tied to an older commit or disabled route, so commands time out.",
    "evidence": [
      "Cloudflare dashboard shows the latest publish as failed or disabled",
      "Discord reports timeouts even though the worker shows no new logs",
      "Deployments land on an old version, and /health returns outdated content"
    ],
    "diagnosis": "Discord is hitting an inactive or stale worker deployment, so commands never hit the current logic.",
    "likelyCause": "The worker route is disabled or the DNS still points to an older release after a deploy.",
    "confidenceScore": 75,
    "firstChecks": [
      "Check Cloudflare Worker deployments, ensuring the active version has the latest code",
      "Confirm DNS or custom domain routes are enabled and point to the right worker"
    ],
    "safeNextStep": "Re-deploy or re-enable the worker route, then test /health within the same guild.",
    "escalationThreshold": "Escalate if multiple deployments keep routing to stale builds and commands stay unresponsive.",
    "customerSafeExplanation": "BotMedic is temporarily offline because the current deployment isn't wired up; we are promoting the latest build.",
    "safeRecoverySteps": [
      "Re-deploy the worker and verify the route is enabled for the Discord domain.",
      "Confirm the published timestamp aligns with the latest release notes before testing."
    ],
    "dontDoThisFirst": "Do not delete dashboards or KV entries before ensuring the worker release is live."
  },
  {
    "id": "webhook_endpoint_error",
    "customId": "helpme_symptom_webhook_endpoint_error",
    "buttonLabel": "Webhook endpoint error",
    "buttonEmoji": "🚨",
    "buttonStyle": 5,
    "symptom": "Discord hits the interaction endpoint but returns webhook-style HTTP 500/502 errors (before the worker responds).",
    "evidence": [
      "Discord reports a webhook failure with a generic HTTP 500/502/503 payload",
      "Cloudflare shows HTTP gateway or worker error before the application logic executes",
      "New dependencies or cron jobs introduced errors when loading the worker bundle"
    ],
    "diagnosis": "The worker code crashes at startup or during request parsing, so Discord sees a webhook failure before flow reaches commands.",
    "likelyCause": "Unhandled runtime errors—extra dependencies, misconfigured bindings, or bundler output—cause the worker to crash.",
    "confidenceScore": 71,
    "firstChecks": [
      "Review Cloudflare worker logs for unhandled exceptions or module resolution errors",
      "Confirm every dependency referenced by the worker is included in package-lock and is published"
    ],
    "safeNextStep": "Fix the startup exception (missing dependency or config) and redeploy; then test /health.",
    "escalationThreshold": "Escalate if webhook failures persist after fixing the reported crash points.",
    "customerSafeExplanation": "BotMedic cannot process interactions right now because the worker code is crashing; we are addressing the issue.",
    "safeRecoverySteps": [
      "Align go live dependencies and re-run builds to ensure Cloudflare Workers can instantiate the module.",
      "Deploy the patched build and monitor logs for clean startup before triggering /health."
    ],
    "dontDoThisFirst": "Do not rotate keys or adjust DNS before you've resolved the runtime crash."
  },
  {
    "id": "role_channel_permission_denial",
    "customId": "helpme_symptom_role_channel_permission_denial",
    "buttonLabel": "Role/channel permission denial",
    "buttonEmoji": "🚫",
    "buttonStyle": 3,
    "symptom": "Commands fail in specific channels even though the bot role claims to have permissions.",
    "evidence": [
      "The /permissions command lists the required flags, but channel overrides still block messages",
      "Guild logs mention \"Missing Permissions\" only in channels with overrides",
      "General permissions look good, yet interactions time out when scoped to one channel"
    ],
    "diagnosis": "Channel overrides or role hierarchies deny permissions, preventing BotMedic from responding even when global flags are set.",
    "likelyCause": "A channel override or higher-priority role removes View/Send permissions after the interaction starts.",
    "confidenceScore": 68,
    "firstChecks": [
      "Inspect channel overrides where diagnostics fail and ensure the bot role can still send messages",
      "Check if any higher-priority roles revoke embeds or application command usage"
    ],
    "safeNextStep": "Adjust channel overrides or role hierarchies so BotMedic can reply in the affected channels.",
    "escalationThreshold": "Escalate if overrides continue to deny permissions after manual fixes.",
    "customerSafeExplanation": "BotMedic needs an extra permission tweak because channel-level restrictions are preventing replies.",
    "safeRecoverySteps": [
      "Grant the bot role View/Send/Embed permissions again in the channel overrides.",
      "Re-run /permissions in that channel to confirm the overrides no longer block the bot."
    ],
    "dontDoThisFirst": "Do not delete the bot role or its parent roles before adjusting overrides."
  },
  {
    "id": "slow_handler_deferred",
    "customId": "helpme_symptom_slow_handler_deferred",
    "buttonLabel": "Slow handler requiring defer",
    "buttonEmoji": "🐢",
    "buttonStyle": 2,
    "symptom": "A deferred diagnostic path is required because response logic takes longer than 3 seconds.",
    "evidence": [
      "Worker traces show interactions that take >3 seconds to complete",
      "Discord logs mention \"Interaction failed\" because the initial response wasn't sent",
      "The team is trying to simulate long-running dependency checks for reproducing customer behavior"
    ],
    "diagnosis": "The interaction handler takes longer than 3 seconds, so Discord invalidates the single-use token unless a deferred ack is sent.",
    "likelyCause": "Long-running checks (e.g., telemetry queries or dependency tests) are wrapped in the slash command path.",
    "confidenceScore": 59,
    "firstChecks": [
      "Identify the slow-running dependencies and isolate them outside of the immediate interaction handler",
      "Ensure every long-running path sends a deferred response with type 5 before executing heavy work"
    ],
    "safeNextStep": "Run `/incident slow_handler_deferred` to prove the deferred-response path works, then send a follow-up message.",
    "escalationThreshold": "Escalate if Discord rejects tokens even after acknowledging the interaction within 3 seconds.",
    "customerSafeExplanation": "We have a slow diagnostic path, so we are deferring the response until the work completes to keep Discord happy.",
    "safeRecoverySteps": [
      "Acknowledge the interaction within 3 seconds by returning a deferred response.",
      "Run the slow checks after the defer and send the final message via a follow-up webhook."
    ],
    "dontDoThisFirst": "Do not wait longer than 3 seconds before returning a deferred response.",
    "requiresDeferredResponse": true
  }
];
