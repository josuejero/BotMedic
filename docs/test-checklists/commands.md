# Command Test Checklist

## /health
- Confirm the response is ephemeral (`flags: 64`) and includes the expected version (`BOT_VERSION`) and environment (`BOT_ENV`).
- Ensure `/health` increments the KV counters (`COMMAND_NAMES` includes `health`) so the dashboard reflects the hit.
- Run `/health` after a redeploy to prove the worker can still sign and respond within 3 seconds.

## /envcheck
- Validate that every required binding (`DISCORD_PUBLIC_KEY`, at least) shows as present and well-formed.
- Supply malformed or missing env vars and confirm `/envcheck` lists missing required values plus helpful hints.
- Confirm optional fields (`BOT_VERSION`, `BOT_ENV`) appear in the output when provided.

## /permissions
- Trigger `/permissions` with a bot role lacking the documented bits to ensure the missing-flag list matches reality.
- With a fully-permissioned role, verify the response says the bot has every critical permission.
- Run the command in a channel with overrides to confirm it falls back to `app_permissions` and warns if it cannot read them.

## /latency
- Run `/latency` with a valid `X-Signature-Timestamp` header and confirm the result reports the same round-trip (healthy/warning).  
- Remove or corrupt the timestamp header and ensure the command asks you to retry in a guild channel.

## /helpme
- Run `/helpme` and verify the button grid renders one button per runbook entry.  
- Click each symptom button (via the component emulator) and check that internal and customer sections mention the diagnosis, root cause, and next step.
- Ensure the `customerSafeExplanation` text matches the fixture in `fixtures/incidents/customer-safe.json`.

## /incident
- Run `/incident` without options and confirm the reply lists every scenario ID plus its label (derived from `fixtures/incidents/symptoms.json`).
- Invoke `/incident <scenario>` (e.g., `invalid_token`) and verify the response mirrors the `buildHelpmeSymptomResponse` content and that the diagnosis snapshot matches `fixtures/incidents/diagnosis-snapshots.json`.
- Run `/incident slow_handler_deferred` and assert the worker replies with `type: 5` (`DeferredChannelMessageWithSource`) within the 3-second window before any long-running work begins.
- Check this deferred case catches the `requiresDeferredResponse` flag so the follow-up message can be issued safely after the defer.

## Regression checks
- When adding new scenarios, update `@botmedic/rules` (and `@botmedic/commands` if needed), regenerate `site/js/data.js` with `npm run generate-site-data`, and refresh `fixtures/incidents/*` so the runbooks, dashboard, and tests stay in sync.
- Run `npm --workspace apps/bot-worker test` to cover signature verification, command routing, incident fixtures, and deferred-response behavior.
