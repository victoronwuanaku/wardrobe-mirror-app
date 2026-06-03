3═══════════════════════════════════════════════════════════════
EVIDENCE SUBMISSION DOCUMENT
AI Skills Assessment Card - Victor Onwuanaku - Extractor v2.0
═══════════════════════════════════════════════════════════════

Project Name:        Wardrobe Mirror
Extraction Date:     2026-05-15
Extracted by:        Claude (evidence extraction agent - file review, not self-report)
Extractor Version:   2.0
Files reviewed:      25 files —
  - README.md
  - ATTRIBUTIONS.md
  - CLAUDE.md
  - AGENTS.md
  - Bug.md
  - package.json
  - .claude/settings.local.json
  - .claude/settings.json
  - utils/supabase/info.tsx
  - utils/supabase/create_table.sql
  - utils/sheets/config.ts
  - Notes/2026-05-14-mirrorgame-refactor-plan.md
  - Notes/final-context.md
  - Notes/claude-workflow-context.md
  - Notes/gemini-handoff.md
  - Notes/prompts-used.md
  - Notes/context-v3-stabilization-core-issues.md
  - Notes/privacy-and-data-context.md
  - Notes/wardrobe-mirror-sharpened-overview.md
  - Notes/wardrobe_responses_rows.csv
  - src/app/components/mirror/MirrorGame.tsx
  - src/app/components/mirror/lib/supabase.ts
  - src/app/components/mirror/lib/scoring.ts
  - src/app/components/mirror/lib/export.ts
  - src/app/components/mirror/constants/questionSteps.ts

───────────────────────────────────────────────────────────────
SECTION 1 - PROJECT SUMMARY
───────────────────────────────────────────────────────────────

Wardrobe Mirror is a Vite + React + TypeScript browser app that runs a three-set wardrobe survey for academic research and writes one row per completed set into a Supabase PostgreSQL table (Frankfurt, EU) protected by Row-Level-Security policies. The deployed runtime does not call any AI API — the AI work in this project sits entirely in the *development process*: a tiered set of instruction documents (CLAUDE.md / AGENTS.md), a 61 KB plan written for an "agentic worker" to execute, a per-project Claude Code permission allowlist, and documented handoffs between Claude, OpenAI Codex, and Google Gemini across project phases. The artefacts therefore evidence AI-as-development-collaborator, not AI-as-runtime-component.

───────────────────────────────────────────────────────────────
SECTION 2 - FILES REVIEWED AND EVIDENTIARY ROLE
───────────────────────────────────────────────────────────────

- README.md — Role: Documentation. Six-line stub; no AI relevance.
- ATTRIBUTIONS.md — Role: Documentation. shadcn/Unsplash credits; no AI relevance.
- CLAUDE.md — Role: Instruction. Long-form domain context written for AI consumption ("Project Context for Claude").
- AGENTS.md — Role: Instruction. Concise operating contract for any AI agent in the repo.
- Bug.md — Role: Output. Plain-language stakeholder write-up of eight bugs fixed.
- package.json — Role: Executable. Dependency manifest; confirms no AI runtime SDK is installed.
- .claude/settings.local.json — Role: Executable/Governance. Per-project Claude Code permission allowlist; defines exact MCP tool calls authorized.
- .claude/settings.json — Role: Executable. Shared Claude Code settings (read but content not material).
- utils/supabase/info.tsx — Role: Executable. Supabase URL + publishable key.
- utils/supabase/create_table.sql — Role: Executable/Governance. Schema + RLS insert-only policy.
- utils/sheets/config.ts — Role: Executable. Remnant Apps Script URL — superseded but still in tree.
- Notes/2026-05-14-mirrorgame-refactor-plan.md — Role: Instruction. 61 KB phase plan addressed to "Codex / agentic workers" with per-task verification commands.
- Notes/final-context.md — Role: Documentation. Narrative retrospective of the AI workflow.
- Notes/claude-workflow-context.md — Role: Documentation. Earlier-phase Claude handoff narrative.
- Notes/gemini-handoff.md — Role: Instruction. Briefing document for Gemini with Apps Script JSON payload contract.
- Notes/prompts-used.md — Role: Instruction/Output. Verbatim prompt log from the stabilization phase.
- Notes/context-v3-stabilization-core-issues.md — Role: Documentation. Stabilization-phase issue inventory.
- Notes/privacy-and-data-context.md — Role: Governance/Documentation. Internal GDPR/UAVG analysis of the data pipeline.
- Notes/wardrobe-mirror-sharpened-overview.md — Role: Governance/Documentation. Second-pass critique of the privacy document.
- Notes/wardrobe_responses_rows.csv — Role: Output. Exported survey rows; demonstrates the data pipeline produced real records.
- src/app/components/mirror/MirrorGame.tsx — Role: Executable. Orchestrator (485 lines after decomposition).
- src/app/components/mirror/lib/supabase.ts — Role: Executable. Submission with retry, duplicate-key idempotency, structured result type.
- src/app/components/mirror/lib/scoring.ts — Role: Executable. Pure scoring/persona module; carries explicit deferred-decision TODO.
- src/app/components/mirror/lib/export.ts — Role: Executable. RFC-4180-quoted CSV export + shared row builder.
- src/app/components/mirror/constants/questionSteps.ts — Role: Executable. Declarative per-set step graph with `shouldShow` predicates — direct evidence the brittle-index-navigation fix landed.

───────────────────────────────────────────────────────────────
SECTION 3 - CONCRETE ARTEFACTS
───────────────────────────────────────────────────────────────

- AGENTS.md — concise per-repo operating contract for any agent (source-of-truth, verification gates, file-sync order).
- CLAUDE.md — long-form domain context (schema, bug history, deferred work, rationale).
- Notes/2026-05-14-mirrorgame-refactor-plan.md — phase-decomposed atomic-task plan with per-task `pnpm typecheck` verification, target file structure, and starting-line-count baseline; written explicitly for autonomous execution.
- .claude/settings.local.json — per-project agent permission allowlist enumerating MCP Supabase tool calls (`apply_migration`, `get_publishable_keys`, `list_edge_functions`, `apply_migration`, etc.).
- Notes/gemini-handoff.md — discrete briefing document for a Google Gemini phase with a JSON payload contract for the Apps Script receiver.
- Notes/prompts-used.md — verbatim prompt log preserving the stabilization-phase conversation trail.
- Notes/privacy-and-data-context.md + Notes/wardrobe-mirror-sharpened-overview.md — paired two-pass GDPR/UAVG analysis with explicit self-critique.
- Bug.md — eight-bug plain-language stakeholder report.
- utils/supabase/create_table.sql — schema migration with `anon_insert_only` RLS policy.
- src/app/components/mirror/lib/supabase.ts — production submission helper with retry, `23505` duplicate-key idempotency, structured `SubmissionResult`.
- src/app/components/mirror/constants/questionSteps.ts — declarative step graph that replaced brittle index navigation.

───────────────────────────────────────────────────────────────
SECTION 4 - EVIDENCE RELIABILITY LEDGER
───────────────────────────────────────────────────────────────

- **Observed** — AGENTS.md + CLAUDE.md form a tiered instruction architecture. Both files exist; both explicitly cross-reference each other (AGENTS.md:3 *"For deeper project context… read CLAUDE.md"*; CLAUDE.md:3 *"For concise agent operating rules… read AGENTS.md"*).
- **Observed** — `.claude/settings.local.json` codifies an MCP Supabase allowlist scoped to this project (lines 14–22 enumerate `list_organizations`, `apply_migration`, `get_publishable_keys`, `list_edge_functions`, etc.).
- **Observed** — A machine-consumable execution plan exists. Notes/2026-05-14-mirrorgame-refactor-plan.md opens (line 1) *"For Codex / agentic workers: Execute tasks in order. Each task is atomic. Run the verification command at the end of every task."*
- **Observed** — The brittle-index-navigation fix landed in code. src/app/components/mirror/constants/questionSteps.ts uses `shouldShow` predicates and `getVisibleQuestionSteps` filters them — matches the stated stabilization fix.
- **Observed** — A working data pipeline exists end-to-end: lib/supabase.ts inserts rows; create_table.sql defines the schema with insert-only RLS; wardrobe_responses_rows.csv contains real exported rows.
- **Observed** — Two-pass privacy analysis with self-critique: privacy-and-data-context.md (May 7) followed by wardrobe-mirror-sharpened-overview.md (May 7) that explicitly critiques the first ("The Consent Trap (Article 6 vs. Public Task)… The Blind Spot…").
- **Corroborated** — The Google Sheets → Supabase migration occurred. utils/sheets/config.ts still holds a live Apps Script URL (now-superseded), CLAUDE.md and final-context.md narrate the switch, and lib/supabase.ts is the current submission path. Three artefact types align.
- **Inferred** — The refactor plan was actually executed by an agent rather than the user. MirrorGame.tsx is 485 lines now (down from the 3,150-line baseline named in the plan), and the file tree matches the plan's target structure. Plausible but not directly visible — there is no execution log.
- **Documented only** — OpenAI Codex was a distinct contributor with a separate working style. The claim appears in final-context.md, claude-workflow-context.md, and prompts-used.md, but no Codex-authored output is independently identifiable in the repo.
- **Documented only** — Google Gemini was used for a discrete phase. gemini-handoff.md exists as a *briefing document for Gemini*, but no Gemini-produced artefact is in the repo (the Apps Script pipeline it briefed was later removed).
- **Documented only** — Claude operated against the live Supabase schema via MCP. The settings.local.json allows the tool calls; no MCP-call transcript or migration log proves they were exercised. The schema in create_table.sql could have been authored manually.
- **Documented only** — *"Eight bugs were identified and fixed"* (Bug.md). The code state reflects fixes (e.g., questionSteps.ts shape, scoring.ts useChanged labels match `yes`/`no`), but the *attribution to AI* of those fixes is narrative only.
- **Unsupported** — Any claim that the privacy analysis has been reviewed by a privacy officer or institutional ethics board. privacy-and-data-context.md is explicitly marked *"Status: Working document — not for participant distribution in current form."*
- **Unsupported** — Any claim that AI output was systematically validated against rubrics or acceptance criteria. No eval rubric, scoring prompt, or verification harness exists in the repo. Verification gates are `pnpm typecheck` and `pnpm build` (software correctness, not AI-output quality).

───────────────────────────────────────────────────────────────
SECTION 5 - AI TOOLS, MODELS, AND PLATFORMS USED
───────────────────────────────────────────────────────────────

- **Claude (Anthropic)** — Evidence: Operationally instructed (Strong) + Documented only (Strong). CLAUDE.md explicitly addresses Claude. .claude/settings.local.json configures Claude Code's permission scope for this repo. No Claude API call appears in the runtime code — the model's role is in development.
- **OpenAI Codex** — Evidence: Operationally instructed (Medium) + Documented only (Strong). Notes/2026-05-14-mirrorgame-refactor-plan.md:1 *"For Codex / agentic workers"*, plus final-context.md describing Codex's lane. No Codex configuration file, no Codex-tagged output.
- **Google Gemini** — Evidence: Operationally instructed (Medium) + Documented only (Medium). Notes/gemini-handoff.md is a real briefing artefact with a payload contract, but the work it briefed (the Apps Script pipeline) was later removed; no Gemini-produced artefact remains.
- **Figma Make** — Evidence: Documented only. Named as the origin prototyping platform in CLAUDE.md/AGENTS.md. No Figma-Make-specific build artefact distinguishable from a standard Vite scaffold.
- **Supabase MCP server (Anthropic Claude Code plugin)** — Evidence: Operationally instructed (Strong) + Inferred use. settings.local.json:14–22 allows `apply_migration`, `get_publishable_keys`, `list_organizations`, `list_edge_functions`, `list_projects`. No MCP call log to confirm exercise.
- **Serena MCP server** — Evidence: Operationally instructed (Weak). settings.local.json:32–35 allows reads of `~/.claude/plugins/.../serena/.mcp.json`. The permission exists but is consistent with one-time setup inspection; no operational use is visible.
- **Supabase JS SDK** (`@supabase/supabase-js` 2.49.4) — Evidence: Directly integrated. package.json:12; called in lib/supabase.ts:1 `import { createClient } from '@supabase/supabase-js'`. **Note: this is a database SDK, not an AI SDK.** The deployed app contains no AI inference.

───────────────────────────────────────────────────────────────
SECTION 6 - SOPHISTICATION ANALYSIS
───────────────────────────────────────────────────────────────

**Context engineering and instruction architecture — directly observed and strong.** The most substantive AI-use evidence in the repo is the AGENTS.md / CLAUDE.md split. The two files are explicitly cross-referenced and have differentiated load contracts: AGENTS.md states *"This file is the concise operating contract… For deeper project context, schema history, Supabase details, bug history, and rationale, read CLAUDE.md"*. This is token-aware context loading. Reinforcing it: Notes/2026-05-14-mirrorgame-refactor-plan.md is structured as agent input — atomic tasks, per-task `pnpm typecheck` verification, a starting-line-count baseline (3,150) and a target structure that matches the current src tree. The plan is machine-consumable, not narrative.

**Cross-platform multi-agent claims — partially supported, mostly Documented-only.** Three AI agents (Claude, Codex, Gemini) are named with distinct lanes in final-context.md and claude-workflow-context.md, and gemini-handoff.md is a real instruction artefact for a third-party agent. However, only Claude's operational configuration is observable in the repo (.claude/settings.local.json). No Codex or Gemini configuration, output log, or distinguishable artefact corroborates their independent contributions. The cross-platform framing is operationally *instructed*, not operationally *demonstrated*.

**Agentic behavior — not directly evidenced.** The plan addresses *"agentic workers"* and the MCP allowlist permits autonomous database operations, but no agent-execution log, no autonomous-loop config, no scheduled task, and no agent-produced artefact (e.g., commit trail, decision record) is present. "Agentic" remains a documented framing rather than an observable pattern.

**Evaluation and verification — weak.** Verification in this repo means `pnpm typecheck` and `pnpm build` (AGENTS.md:184). There are no AI-output rubrics, no acceptance criteria, no hallucination checks, no source-verification prompts, and no evaluation harness. Bug.md is a *post-hoc bug-fix narrative*, not systematic AI-output validation. The two-pass privacy analysis (privacy-and-data-context.md followed by wardrobe-mirror-sharpened-overview.md) is the closest thing to verification of AI output: the second document explicitly critiques the first ("The Consent Trap (Article 6 vs. Public Task)… The Blind Spot…"). But this is a one-instance critique, not a reusable evaluation system.

**Prototyping and integration — directly observed and credible.** The Supabase integration in lib/supabase.ts is non-trivial: retry-once-on-failure, Postgres-23505 duplicate-key idempotency, structured `SubmissionResult` discriminated union. create_table.sql provisions the schema with an `anon_insert_only` RLS policy + explicit deny policies on SELECT/UPDATE/DELETE. wardrobe_responses_rows.csv shows the pipeline produced real records. The Google Sheets → Supabase migration (with the failed-path remnant utils/sheets/config.ts left in the tree) is a real architectural decision under pressure.

**Governance and risk — present but oriented to data privacy, not AI risk specifically.** privacy-and-data-context.md is a 14 KB GDPR/UAVG analysis with jurisdiction-specific detail (AP, Article 6 vs 89, consumer-vs-Workspace Google account risk). wardrobe-mirror-sharpened-overview.md adds the consent-trap and Recital-26 anonymity points. create_table.sql implements deny-by-default RLS. CLAUDE.md flags the deferred consent screen. **However:** there is no analysis of AI-specific risks — model hallucination, prompt injection, model-output bias, AI auditability, AI usage policy. Governance evidence here is *data governance*, not *AI governance*.

───────────────────────────────────────────────────────────────
SECTION 7 - RARITY SIGNALS AND ANTI-SIGNALS
───────────────────────────────────────────────────────────────

★ **Tiered instruction architecture (AGENTS.md + CLAUDE.md)** — Confidence: High. Two files with explicit cross-references and differentiated context-load contracts. Above typical power-user behaviour, which usually stops at a single CLAUDE.md. File reference: AGENTS.md:3, CLAUDE.md:3.

★ **Plan-as-executable for an agent** — Confidence: High. Notes/2026-05-14-mirrorgame-refactor-plan.md is 61 KB structured as agent input ("Execute tasks in order. Each task is atomic. Run the verification command…") with target file tree, per-task verification, and a measurable starting baseline. Most power users write plans for themselves, not for an agent.

★ **Per-project MCP tool allowlist** — Confidence: High. .claude/settings.local.json names specific MCP Supabase tool calls (`apply_migration`, `get_publishable_keys`). Most users either avoid MCP or accept all prompts ad-hoc; codifying per-tool permissions at project scope is uncommon.

★ **Self-critiquing iterative analysis** — Confidence: Medium. Notes/wardrobe-mirror-sharpened-overview.md explicitly critiques Notes/privacy-and-data-context.md ("The Consent Trap… The Blind Spot"). Demonstrates AI-as-research-collaborator with version-controlled disagreement, but it is a single instance, not a reusable pattern.

★ **Documented multi-agent workflow with discrete handoff artefacts** — Confidence: Medium. Notes/gemini-handoff.md exists as a separate briefing document with a JSON contract; the Notes folder distinguishes Claude/Codex/Gemini lanes. Above typical practice — but the "multi-agent" claim is Documented-only beyond Claude.

**Anti-signals:**

- **No AI integration in the runtime code.** The deployed app contains zero AI API calls. The AI work is entirely developmental. This does not invalidate the evidence but limits any claim of "AI-integrated product."
- **Verification gates are software gates, not AI gates.** `pnpm typecheck` / `pnpm build` verify TypeScript correctness, not AI output quality. No rubric, no eval prompt, no acceptance criteria for AI-generated work.
- **Multi-agent orchestration is mostly Documented-only.** Beyond Claude, no Codex/Gemini operational configuration or output is independently observable. The handoff documents exist, but they evidence *instructed* multi-tool use, not *demonstrated* orchestration.
- **No commit history.** AGENTS.md:196 *"This repo may not be a git repo."* No commit log to corroborate any narrative claim about who did what when.
- **AI authorship of Notes documents is consistent across files** (uniform register, structural patterns, beginner-friendly framing). The user's level of editing/curating is not signalled. This matters because much of the credit for "rarity" depends on whether the user *designed* the system or *prompted Claude to design and write up the system.*
- **No automated tests.** Behavioural fidelity through the refactor relied on manual smoke testing.
- **README.md is a six-line stub.** The substantive narrative lives in Notes/. A reviewer arriving via README would miss the entire evidence base.

───────────────────────────────────────────────────────────────
SECTION 8 - COMPETENCY MAPPING (CURRENT + PROPOSED TAXONOMY)
───────────────────────────────────────────────────────────────

────────────────────────────────────────
1. AI Workflow & Systems Design
   (Current label = Proposed label — no rename proposed)

   Evidence found: Yes
   Fit (current label): Strong
   Fit (proposed label): Strong
   Better-fitting label: N/A — labels match
   Gate 1 (Artefact): Pass — AGENTS.md, CLAUDE.md, Notes/2026-05-14-mirrorgame-refactor-plan.md, .claude/settings.local.json together constitute a durable workflow system.
   Gate 2 (Rarity): Pass — High confidence. Tiered instruction architecture + per-project MCP allowlist + plan-as-agent-input each individually exceed typical power-user behaviour; combined they are clearly rare.
   Gate 3 (Independent source): This project = 1 source. Cannot satisfy Gate 3 alone.
   Ranking implication: Supports current ranking. Top 5%/10% conclusions still require ≥1 independent project.
   Notes: This is the strongest competency here. The system survives across phases, agents, and the visual refactor.

────────────────────────────────────────
2. Cross-Platform AI Orchestration  →  Agentic / Cross-Platform AI Orchestration

   Evidence found: Partial
   Fit (current label "Cross-Platform AI Orchestration"): Moderate
   Fit (proposed label "Agentic / Cross-Platform AI Orchestration"): Weak
   Better-fitting label: Current — the evidence shows *human-directed multi-tool instruction*, not autonomous agent behavior. The "Agentic" framing over-claims relative to what is observable.
   Gate 1 (Artefact): Partial — Notes/gemini-handoff.md and .claude/settings.local.json are real artefacts, but Codex and Gemini operational evidence is Documented-only.
   Gate 2 (Rarity): Partial — Medium confidence. Documented multi-tool workflow is above norm; the absence of independently observable Codex/Gemini output prevents High confidence.
   Gate 3 (Independent source): This project = 1 source.
   Ranking implication: Supports current label but **does not support the proposed rename to "Agentic"**. Caveat needed.
   Notes: To clear the "Agentic" framing, look for autonomous-execution evidence (agent-produced commits/logs, scheduled loops, self-directed task selection). None is present in this repo.

────────────────────────────────────────
3. Strategic Prompt Engineering  →  Context Engineering & Instruction Architecture

   Evidence found: Yes
   Fit (current label "Strategic Prompt Engineering"): Moderate
   Fit (proposed label "Context Engineering & Instruction Architecture"): Strong
   Better-fitting label: Proposed — the evidence sits in *durable instruction systems* (AGENTS.md, CLAUDE.md, refactor plan), not in one-off prompts. Notes/prompts-used.md is competent but unremarkable; the tiered context system is the rarity.
   Gate 1 (Artefact): Pass — AGENTS.md + CLAUDE.md + refactor plan + settings.local.json.
   Gate 2 (Rarity): Pass — High confidence.
   Gate 3 (Independent source): This project = 1 source.
   Ranking implication: **Supports the rename.** The proposed label tightens the fit considerably; the current label underclaims what's actually here.
   Notes: This is the cleanest case in the analysis for adopting a proposed-taxonomy rename.

────────────────────────────────────────
4. AI-Driven Research & Analysis  →  AI Evaluation, Verification & Research Analysis

   Evidence found: Partial
   Fit (current label "AI-Driven Research & Analysis"): Moderate
   Fit (proposed label "AI Evaluation, Verification & Research Analysis"): Weak
   Better-fitting label: Current — the privacy two-pass exists, but there is no rubric, no acceptance criteria, no hallucination check, no AI-output quality system. The proposed label adds a dimension this project does not evidence.
   Gate 1 (Artefact): Pass — privacy-and-data-context.md + wardrobe-mirror-sharpened-overview.md.
   Gate 2 (Rarity): Partial — Medium confidence. Two-pass analysis with self-critique is above norm; absence of any AI-evaluation harness limits it.
   Gate 3 (Independent source): This project = 1 source.
   Ranking implication: Supports current label. **Adopting the proposed rename would require additional evaluation/verification evidence not present in this repo.**
   Notes: Bug.md is a software bug audit, not AI-output verification. The verification gates (`pnpm typecheck`, `pnpm build`) verify code, not AI claims.

────────────────────────────────────────
5. AI Prototyping & Automation  →  AI Prototyping, Automation & Integration

   Evidence found: Yes
   Fit (current label "AI Prototyping & Automation"): Strong
   Fit (proposed label "AI Prototyping, Automation & Integration"): Moderate
   Better-fitting label: Current — the Supabase pipeline is real integration work (retry, idempotency, RLS), but the integration is *with a database, not with an AI system*. The proposed rename implies AI-system integration, which this project doesn't have.
   Gate 1 (Artefact): Pass — lib/supabase.ts + create_table.sql + wardrobe_responses_rows.csv (the deployed pipeline produced real rows).
   Gate 2 (Rarity): Partial — Medium confidence. Prototype-to-deployed-research-instrument trajectory with documented constraints is above casual prototyping; nothing here is technically novel.
   Gate 3 (Independent source): This project = 1 source.
   Ranking implication: Supports current label. **The proposed rename to "Integration" would over-claim on this project alone**, since no AI-system integration is present.
   Notes: The honest signal here is "promoted a prototype to a research-grade tool," not "integrated AI into a product."

────────────────────────────────────────
6. AI Governance, Risk & Responsible Deployment
   (Proposed-only category — no current equivalent)

   Evidence found: Partial — but the evidence is *data governance*, not *AI governance*.
   Fit (proposed label): Weak (for AI governance specifically). Moderate (if the category is read more loosely as "data privacy in an AI-assisted project").
   Gate 1 (Artefact): Pass — privacy-and-data-context.md + wardrobe-mirror-sharpened-overview.md + create_table.sql (RLS) + CLAUDE.md (deferred consent flag).
   Gate 2 (Rarity): Partial — Medium confidence for data privacy work; **None** for AI-specific governance.
   Gate 3 (Independent source): This project = 1 source.
   Card implication: **Evidence pending.** The category has real privacy and data-handling artefacts, but no AI-specific governance content (model risk, hallucination handling, prompt-injection considerations, AI usage policy, bias/safety evaluation). On the card, this category should be marked **evidence pending** or scoped narrowly to "GDPR/data privacy for an AI-assisted research tool." Do not rank this category as broad AI governance based on this project.
   Notes: This is the most important honesty test in the document. The temptation is to credit the privacy work as AI governance — it isn't. AI risk artefacts (red-team notes, prompt-injection considerations, model-limitations document, AI-output-quality controls) are absent.

───────────────────────────────────────────────────────────────
SECTION 9 - GAPS & CAVEATS
───────────────────────────────────────────────────────────────

- **No runtime AI integration.** The deployed app contains no AI API call. AI use is entirely developmental.
- **No AI-output evaluation system.** No rubrics, no acceptance criteria, no eval prompts, no hallucination checks.
- **No AI-specific governance artefacts.** Privacy work is real but addresses GDPR for participant data, not AI risk for the assisted-development process.
- **Multi-agent claims are largely Documented-only beyond Claude.** No independently observable Codex or Gemini operational evidence.
- **No commit history** to corroborate the documented timeline.
- **No automated tests.** The visual refactor and decomposition relied on manual smoke testing.
- **AI authorship of Notes/ documents not externally signalled.** Reviewer cannot distinguish user-authored from AI-authored content without external attestation.
- **Some past work has been removed.** utils/sheets/config.ts still holds an Apps Script URL but the pipeline using it has been removed; gemini-handoff.md briefed work that no longer exists. The reviewer should not credit current code for that earlier work.
- **2026 taxonomy gap: AI deployment readiness, monitoring, observability of AI behaviour** — absent (no AI is deployed in this product, so this is consistent rather than a deficiency, but it must be acknowledged for taxonomy mapping).
- **2026 taxonomy gap: business impact / metrics tied to AI use** — absent (the project measures bug-fix counts and CSV column completeness, not AI-leveraged business outcomes).

───────────────────────────────────────────────────────────────
SECTION 10 - CARD UPDATE RECOMMENDATION
───────────────────────────────────────────────────────────────

Recommendation: **Rename support** for competency 3, **Caveat needed** for competencies 2 and 4, **Evidence support only** for competencies 1 and 5, **Evidence pending** for competency 6.

Concretely:

- **Keep** "AI Workflow & Systems Design" as labelled. This project contributes one strong source toward whatever ranking the card already holds; an upgrade requires ≥1 independent project.
- **Caveat** "Cross-Platform AI Orchestration." Do **not** adopt the proposed "Agentic / Cross-Platform AI Orchestration" rename based on this project — no autonomous-agent behaviour is observable. The honest framing is "human-directed multi-tool workflow with structured handoffs."
- **Rename** "Strategic Prompt Engineering" → "Context Engineering & Instruction Architecture." This project's evidence fits the proposed label substantially better than the current one. This is the strongest taxonomy-update signal in the extraction.
- **Caveat** "AI-Driven Research & Analysis." Do **not** adopt the proposed "AI Evaluation, Verification & Research Analysis" rename based on this project — the evaluation/verification half is unevidenced. The current label still fits.
- **Keep** "AI Prototyping & Automation" as labelled. Do **not** adopt the "Integration" extension based on this project — no AI-system integration is present (the integration is database-side).
- **Mark "AI Governance, Risk & Responsible Deployment" as evidence pending** on the card. The privacy work in this repo is real but it is data governance, not AI governance. Including it under the proposed label would over-claim.

No percentile upgrades supported by this project alone. Top 5%/Top 10% claims still require independent corroborating sources.

───────────────────────────────────────────────────────────────
SECTION 11 - ASSESSOR OBSERVATIONS
───────────────────────────────────────────────────────────────

**Recency check:** today is 2026-05-15; the most recent operational artefact (Notes/2026-05-14-mirrorgame-refactor-plan.md, CLAUDE.md, AGENTS.md, .claude/settings.local.json) is from 2026-05-14. No aging-evidence flag.

**The most important honesty point in this extraction** is that the project's strongest signals sit in *how the user collaborates with AI to build software*, not in *what AI does inside the product*. The deployed app has zero AI inference. A reviewer comparing this against, say, a candidate who deployed an AI-integrated retrieval system would see a categorical difference even though both can claim "AI-assisted work." Calibrate accordingly.

**Second observation:** the v1.0 extraction of this same project (Notes/evidence-submission-2026-05-15.md) was too generous on three points and the v2.0 protocol catches them:
1. v1.0 graded "Cross-Platform AI Orchestration" Gate 2 as Pass; v2.0 grades it Partial because the Codex/Gemini lanes are Documented-only.
2. v1.0 graded "AI-Driven Research & Analysis" Gate 2 as Pass; v2.0 grades it Partial because no AI-output verification is present — the privacy two-pass is one instance, not a system.
3. v1.0 treated the privacy documents as governance evidence without distinguishing data governance from AI governance.

**Third observation:** there is real evidence the user does the work AI cannot. scoring.ts:56-58 carries `TODO (research team decision)` marking three fields the agent was told *not* to score without human research-methodology input. privacy-and-data-context.md ends with institutional process steps (privacy officer, ethics board, DPA) explicitly outside AI scope. This is a meaningful maturity signal — the user knows where the AI's authority stops.

**Ambiguity flag:** authorship of the Notes/ documents cannot be externally verified. The register is consistent across files and reads as AI-produced narrative. If the user wrote those documents themselves, the rarity signals are stronger; if Claude produced them and the user accepted them, the rarity signals are weaker. The files do not signal which. This affects competency 3 (instruction architecture) most — the question is whether the user *designed* the tiered system or *asked Claude to design and document one*. I have treated it as the former on balance because the system is operationally coherent and the .claude/settings.local.json is the kind of artefact that cannot be retro-generated by narrative documentation, but a reviewer should hold this open.

**Fourth observation:** Bug.md is genuinely unusual — a plain-language stakeholder-facing translation of technical bug fixes. Most AI-assisted codebases do not produce that translation layer. It signals the user understands the AI work needs to be auditable by a non-technical research stakeholder. Worth surfacing on the card under whatever competency captures communication design — but it is a single artefact, not a system.

═══════════════════════════════════════════════════════════════
END OF EVIDENCE SUBMISSION DOCUMENT
═══════════════════════════════════════════════════════════════
