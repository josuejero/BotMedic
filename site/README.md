# BotMedic companion site

This folder now hosts the portfolio-ready Phase 5 companion experience:

- `index.html`: public landing page with hero, command gallery, architecture diagram, failure gallery, walkthrough placeholders, and quick-reference teasers. It renders content by pulling from `js/data.js` so the UI reflects the same commands and runbooks that power the worker.
- `runbooks/index.html`: library overview that lists every runbook derived from `apps/bot-worker/src/rules/index.ts` as well as notes about `packages/playbooks/` and `fixtures/incidents/` for future stories.
- `runbooks/<case>.html`: six dedicated runbook detail pages (one per `RuleCase`) that highlight symptoms, evidence, diagnosis, safe steps, customer messaging, and curated “don’t do this first” warnings while mirroring the internal logic layer.
- `diagnosis.html`: explains how symptom intake flows through the rule system, what data is collected, and how we report both internal vs. customer-facing responses.
- `quick-reference.html`: triage table that lists immediate first checks, safe next steps, and links back to each runbook.
- The landing hero now links to `/dashboard`, which is rendered by the worker and surfaces the persisted telemetry plus curated incident samples.

Shared assets:
- `css/site.css`: visual system (dark theme, cards, tables, animations) used across every page.
- `js/data.js`: exports the commands array plus the normalized rule cases (including evidence, checks, safe steps, warnings) so the static site stays in sync with `apps/bot-worker/src/rules/index.ts`.
- `js/site.js`: renderer script that inspects `body[data-page]` and populates the command gallery, failure cards, runbook templates, quick reference, and diagnosis sections with consistent markup.
- `assets/hero-illustration.svg`: simple illustration for the landing hero.

No build tooling is required: the files are plain HTML/CSS/JS so GitHub Pages or Cloudflare Pages can serve them directly.
