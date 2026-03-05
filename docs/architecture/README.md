# Architecture overview

BotMedic v1 architecture:
1. Discord user issues `/health` via the guild bot.
2. Discord sends the interaction to a Cloudflare Worker (public endpoint) with `X-Signature-Ed25519` and `X-Signature-Timestamp` headers.
3. Worker validates the signature, responds to `type: 1` PINGs, and routes `/health` to the command handler.
4. The handler builds an ephemeral response (flags: 64) and writes telemetry to a `DASHBOARD_KV` namespace so command counts, health checks, and diagnoses are persisted.
5. A lightweight `GET /dashboard` page reads that KV data plus curated incident samples and renders counts, timestamps, and recommended next steps for reviewers.
6. Companion site and future Pages functions surface runbooks, playbooks, and incident galleries.

Phase 7 adds an `/incident` command and machine-readable incident library that mirrors the rule cases. Runbooks and the site now reference the `fixtures/incidents/symptoms.json`, `diagnosis-snapshots.json`, and `customer-safe.json` files so the same data powers the demo, snapshots, and regression tests. These fixtures also back the new `docs/test-checklists/commands.md`, which enumerates how to exercise each slash command (including proving the deferred `/incident slow_handler_deferred` path that is required by Discord’s 3-second timeout rule). Future artifacts will continue to extend `packages/rules/`, `packages/playbooks/`, and `fixtures/incidents/` to drive the static site narrative.
