# apps/bot-worker

Cloudflare Worker serving Discord interactions. Phase 1 delivers signature validation, PING replies, and the `/health` command. Future phases add more commands, rules integration, and persistence.

## Phase 1 checklist
1. Fill `wrangler.toml` with your Cloudflare `name`, `account_id`, and update `compatibility_date` to the current date.
2. Store required secrets via `wrangler secret put DISCORD_PUBLIC_KEY`, `BOT_VERSION`, `BOT_ENV`, and any other config.
3. Run `npm --workspace apps/bot-worker run build` and `npm --workspace apps/bot-worker run deploy` (or `wrangler dev` for local testing).
4. After deployment, register `/health` with Discord: set `DISCORD_APP_ID`, `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, configure the Interaction Endpoint URL to your worker, then run `npm --workspace apps/bot-worker run register:commands`.
5. Confirm the Discord application is on a private test server and `/health` returns an ephemeral message including version, environment, and timestamp within 3 seconds.

## Key files
- `src/index.ts`: Worker entry point with request guard and dispatcher.
- `src/commands/health.ts`: Builds ephemeral `/health` response with contextual templates.
- `src/utils/discord.ts`: Signature verification helper and Discord interaction constants.
- `src/types/discord.ts`: Minimal typings for interactions.
- `scripts/register-commands.ts`: CLI that registers `/health` as a guild command using provided secrets.
- `tests/interaction.test.ts`: Vitest suite ensuring signature validation, PING response, and `/health` payloads work without hitting Discord.

## Phase 6 observability dashboard
- Create a Workers KV namespace (suggested name `dashboard-metrics`) with `wrangler kv:namespace create dashboard-metrics --preview` and fill the `id`/`preview_id` for the `DASHBOARD_KV` binding in `wrangler.toml`.
- The worker writes command usage counters, the last successful `/health`, and the latest diagnosed rule into `DASHBOARD_KV` whenever `/health` or `/helpme` interactions occur.
- A lightweight HTML page is available at `GET /dashboard` and surfaces command counts, the most recent health/diagnosis entries, and the curated incident samples from `fixtures/incidents/dashboard-samples.json`.
