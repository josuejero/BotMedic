# BotMedic

A Phase 1 implementation of the BotMedic Discord support bot. The architecture is staged for security-first interactions on Cloudflare Workers with a companion documentation site and reusable rule/playbook packages.

## Workspace layout
- `apps/bot-worker/`: Cloudflare Worker handling Discord interactions and the `/health` command.
- `site/`: Companion static explorer for runbooks, failures, and architecture summaries.
- `packages/rules/` & `packages/playbooks/`: Placeholder packages for triage logic and runbooks.
- `fixtures/incidents/`: Sample incidents/diagnoses for regression and demos.
- `docs/architecture/`: Architecture narrative (Discord → Worker → command handler → rules).
- `tests/`: Higher-level checks (Vitest lives inside `apps/bot-worker/tests/`).

## Getting started
1. Install dependencies at the workspace root: `npm install`.
2. Configure Cloudflare via `apps/bot-worker/wrangler.toml` and set secrets with `wrangler secret put` (see `apps/bot-worker/README.md`).
3. Deploy the worker with `npm --workspace apps/bot-worker run deploy` and register `/health` with `npm --workspace apps/bot-worker run register:commands`.

## Phase 1 focus
Deliverables for this phase are:
- Secure Cloudflare Worker handling Discord signature validation and PING responses.
- `/health` slash command returning ephemeral diagnostics.
- Documentation covering worker setup, command registration, and the companion site intent.
