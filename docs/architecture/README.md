# Architecture overview

BotMedic v1 architecture:
1. Discord user issues `/health` via the guild bot.
2. Discord sends the interaction to a Cloudflare Worker (public endpoint) with `X-Signature-Ed25519` and `X-Signature-Timestamp` headers.
3. Worker validates the signature, responds to `type: 1` PINGs, and routes `/health` to the command handler.
4. The handler builds an ephemeral response (flags: 64) and may later write to Workers KV for dashboards.
5. Companion site and future Pages functions surface runbooks, playbooks, and incident galleries.

Future artifacts will populate `packages/rules/`, `packages/playbooks/`, and `fixtures/incidents/` to drive the static site narrative.
