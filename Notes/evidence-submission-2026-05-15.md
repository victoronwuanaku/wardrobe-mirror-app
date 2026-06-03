═══════════════════════════════════════════════════════════════
EVIDENCE SUBMISSION DOCUMENT
AI Skills Assessment Card — Victor Onwuanaku — v2.0
═══════════════════════════════════════════════════════════════

Project Name:        Wardrobe Mirror
Extraction Date:     2026-05-15
Extracted by:        Claude (evidence extraction agent — file review, not self-report)
Files reviewed:      17 files —
  - CLAUDE.md
  - AGENTS.md
  - Bug.md
  - README.md
  - Notes/claude-workflow-context.md
  - Notes/gemini-handoff.md
  - Notes/prompts-used.md
  - Notes/context-v3-stabilization-core-issues.md
  - Notes/final-context.md
  - Notes/privacy-and-data-context.md
  - Notes/wardrobe-mirror-sharpened-overview.md
  - Notes/2026-05-14-mirrorgame-refactor-plan.md
  - src/app/components/mirror/MirrorGame.tsx
  - src/app/components/mirror/lib/supabase.ts
  - src/app/components/mirror/lib/scoring.ts
  - src/app/components/mirror/lib/export.ts
  - .claude/settings.local.json

───────────────────────────────────────────────────────────────
SECTION 1 — PROJECT SUMMARY
───────────────────────────────────────────────────────────────

Wardrobe Mirror is a mobile-first, browser-based academic research instrument built in Vite + React + TypeScript that walks participants through three sequential question sets about specific garments (recent purchase, favourite, item-to-dispose). It computes a behavioural archetype and four-axis value profile, then writes one row per completed set into a Supabase PostgreSQL database hosted in Frankfurt under EU GDPR-aware Row-Level-Security policies. The project originated as a Figma Make prototype and has gone through multiple AI-assisted maturity stages — stabilization, data-pipeline replacement, decomposition refactor, and visual polish — with at least three different AI agents (Claude, OpenAI Codex, Google Gemini) contributing under explicit role boundaries defined in repo-level instruction files. AI is not just used to write code; it is treated as a structured collaborator with documented operating contracts, source-of-truth conventions, and verification gates.

───────────────────────────────────────────────────────────────
SECTION 2 — CONCRETE ARTEFACTS
───────────────────────────────────────────────────────────────

- CLAUDE.md — 13 KB long-form project context: schema, bug history, deferred work, file-sync order for Figma. Acts as durable agent memory between sessions.
- AGENTS.md — 10 KB concise operating contract: source-of-truth files, where edits belong, hard implementation constraints, verification gates, Figma sync order. Pairs with CLAUDE.md as a two-tier instruction system.
- Notes/2026-05-14-mirrorgame-refactor-plan.md — 61 KB phase-by-phase refactor plan written explicitly "for Codex / agentic workers" with atomic tasks, per-task verification commands, target file structure, and checkbox tracking. Designed for autonomous agent execution.
- Notes/privacy-and-data-context.md — 14 KB internal GDPR/Dutch-law analysis of the data pipeline (legal basis selection, Google Sheets ToS incident postmortem, five storage-option comparison).
- Notes/wardrobe-mirror-sharpened-overview.md — sharpened second-pass analysis that critiques the prior privacy document (Art 6(1)(a) vs 6(1)(e) trap, pseudonymous-vs-anonymous distinction, system-resilience gaps).
- Notes/gemini-handoff.md — explicit handoff document for Google Gemini, including a working Google Apps Script payload contract.
- Notes/claude-workflow-context.md, Notes/final-context.md — beginner-audience workflow narratives explicitly written as AI-to-AI handoff material.
- Notes/prompts-used.md — verbatim prompt log preserving the developer's actual prompt-engineering trail.
- Bug.md — plain-language stakeholder bug report (8 bugs, written so a non-technical researcher can audit AI-introduced fixes).
- src/app/components/mirror/lib/supabase.ts — production submission helper with retry, duplicate-key idempotency, and structured SubmissionResult contract.
- src/app/components/mirror/lib/scoring.ts — pure scoring/persona module carrying explicit `TODO (research team decision)` annotations marking deliberately deferred AI-judgment-boundaries.
- .claude/settings.local.json — committed Claude Code permission allowlist enumerating exact MCP Supabase tool calls (`apply_migration`, `get_publishable_keys`, etc.) the agent is allowed to invoke without prompting.

───────────────────────────────────────────────────────────────
SECTION 3 — AI TOOLS & PLATFORMS USED
───────────────────────────────────────────────────────────────

- Claude (Anthropic) — Primary agent for stabilization, diagnosis, refactor planning, Supabase wiring, and stakeholder documentation. CLAUDE.md: *"Claude's role in this project was primarily stabilization, diagnosis, and backend/data workflow work."*
- OpenAI Codex — Implementation agent for root-app visual integration, motion library work, and AGENTS.md-bound execution. prompts-used.md and final-context.md both name Codex as a distinct contributor: *"Codex's working style was implementation-focused: preserve the working app, apply the requested interface changes, verify, and document operational context."*
- Google Gemini — Used for a discrete handoff phase around the Google Sheets data pipeline. Notes/gemini-handoff.md exists as a dedicated briefing document with a JSON payload contract for that agent.
- Figma Make — Original prototyping platform (Figma's React/Vite generator). Repo retains a documented manual file-sync order back to Figma Make for design loop.
- Supabase MCP server — Authorized in `.claude/settings.local.json` for direct database operations: *"mcp__plugin_supabase_supabase__apply_migration"*, *"get_publishable_keys"*, *"list_edge_functions"* — Claude operated against the live Postgres schema without dashboard clicks.
- Serena MCP server — Referenced in the allowed permissions (`~/.claude/plugins/.../serena/.mcp.json` reads authorized) for semantic code navigation.
- Apps Script / Resend / Vercel — Each appears in the historical pipeline iterations but were removed; their removal is documented as deliberate architectural decisions, not abandoned experiments.

───────────────────────────────────────────────────────────────
SECTION 4 — HOW AI WAS USED (SOPHISTICATION ANALYSIS)
───────────────────────────────────────────────────────────────

The most distinctive AI-use pattern in this repo is the **two-tier agent instruction architecture**. `AGENTS.md` is the *short* operating contract (source-of-truth, where edits belong, verification gates) while `CLAUDE.md` is the *long* domain context (schema, bug history, rationale). Each file explicitly references the other and tells the agent when to read which: *"For concise agent operating rules… read AGENTS.md. This file is the long-form project context."* This split is not just convenience — it manages the agent's context-window economy by keeping the per-turn payload small while keeping deep context retrievable on demand. That is design thinking, not prompting.

The second distinctive pattern is **plan-as-deliverable for autonomous execution**. `Notes/2026-05-14-mirrorgame-refactor-plan.md` is a 61 KB phase-decomposed refactor plan that opens with: *"For Codex / agentic workers: Execute tasks in order. Each task is atomic. Run the verification command at the end of every task before moving on."* It enumerates target file structure, pre-flight typecheck/build gates, line-count baselines for comparison, and per-task verification commands. The plan is *not* a description of work that happened; it is the executable artefact the agent runs against. The fact that the resulting `MirrorGame.tsx` shrank from 3,150 to 485 lines while preserving Supabase payload shape, scoring logic, and CSV column order is evidence the plan worked.

The third pattern is **role-separation across AI tools**. The developer did not treat Claude, Codex, and Gemini as interchangeable. `final-context.md` explicitly documents *"Claude's role… stabilization, diagnosis, and backend/data workflow work"* against *"Codex's working style… implementation-focused: preserve the working app, apply the requested interface changes, verify, and document"*. `gemini-handoff.md` exists as a deliberate handover document with a concrete JSON contract for the Apps Script phase. This is multi-agent orchestration with named lanes, not tool-shopping.

The fourth pattern is **AI-driven applied policy research**. `Notes/privacy-and-data-context.md` is a 14 KB GDPR/UAVG analysis of the data pipeline written for a Dutch-jurisdiction academic context, explicitly distinguishing Article 6(1)(a) vs 6(1)(e) bases, Article 9 special categories, Article 89 research exemption, AP (Autoriteit Persoonsgegevens) supervisory role, and the consumer-Google-account ToS-incident postmortem. The follow-up `wardrobe-mirror-sharpened-overview.md` then critiques the first document's blind spots (the consent trap, pseudonymous-vs-anonymous Recital 26 question). This is AI used as an iterative research partner with version-controlled disagreement, not single-shot Q&A.

───────────────────────────────────────────────────────────────
SECTION 5 — RARITY SIGNALS
───────────────────────────────────────────────────────────────

★ **Two-tier agent instruction architecture (AGENTS.md + CLAUDE.md)** — Most power users have a single CLAUDE.md. Splitting into a *concise operating contract* and a *long-form domain context* with explicit cross-references is unusual. File reference: AGENTS.md:3 *"For deeper project context, schema history, Supabase details, bug history, and rationale, read CLAUDE.md."*

★ **Plan-as-executable-artefact for agentic workers** — Notes/2026-05-14-mirrorgame-refactor-plan.md is structured as agent input, not human documentation. File reference: line 1 *"For Codex / agentic workers: Execute tasks in order. Each task is atomic. Run the verification command at the end of every task before moving on."* The fact that this is *not* describing past work but is the *script* the agent runs is the rarity signal.

★ **Multi-agent orchestration with named lanes** — Three distinct AI agents (Claude, Codex, Gemini) used for non-overlapping responsibilities, each with its own handoff document. File reference: Notes/gemini-handoff.md exists as a discrete artefact and final-context.md:154 explicitly contrasts each agent's working style.

★ **AI-driven iterative policy/legal research with self-critique** — Two-pass GDPR analysis where document #2 (wardrobe-mirror-sharpened-overview.md) critiques document #1 (privacy-and-data-context.md). File reference: wardrobe-mirror-sharpened-overview.md:6 *"The Consent Trap (Article 6 vs. Public Task)… The Blind Spot: In academic research, relying on Consent means participants retain the absolute Right to Erasure."*

★ **MCP-authorized direct database operations** — .claude/settings.local.json:19 explicitly allows `mcp__plugin_supabase_supabase__apply_migration` without prompting. Most users either skip MCP or use it ad-hoc; this user has codified per-tool allowlists at project scope. This is operationalized agent infrastructure.

───────────────────────────────────────────────────────────────
SECTION 6 — COMPETENCY GATE ANALYSIS
───────────────────────────────────────────────────────────────

1. **AI Workflow & Systems Design**
   Evidence found: Yes
   Gate 1 (Artefact): Pass — AGENTS.md, CLAUDE.md, .claude/settings.local.json, Notes/2026-05-14-mirrorgame-refactor-plan.md constitute a real durable agent-workflow system, not ad-hoc prompting.
   Gate 2 (Rarity): Pass — two-tier instruction architecture, MCP-tool allowlisting, and plan-as-executable artefact each individually exceed typical power-user behaviour; combined they are clearly rare.
   Gate 3 (Independent source): Cannot satisfy alone. This project = 1 source.
   Notes: This is the strongest competency in the evidence. The system survives across sessions, agents, and refactor phases — that's the test.

2. **Cross-Platform AI Orchestration**
   Evidence found: Yes
   Gate 1 (Artefact): Pass — Notes/gemini-handoff.md, Notes/claude-workflow-context.md, Notes/final-context.md document the Claude→Codex→Gemini multi-agent workflow with explicit role boundaries.
   Gate 2 (Rarity): Pass — documented role-separation between three distinct AI vendors with per-agent handoff contracts is above power-user norm. Most users blur tools; this user codified the lanes.
   Gate 3 (Independent source): Cannot satisfy alone. This project = 1 source.
   Notes: The handoff documents would need to be matched by either evidence of similar orchestration in another project or third-party validation to clear Gate 3.

3. **Strategic Prompt Engineering**
   Evidence found: Partial
   Gate 1 (Artefact): Pass — Notes/prompts-used.md preserves the actual prompt trail, and the prompts themselves are reasonable (scoped, context-aware, ask-before-implement). The refactor plan and AGENTS.md are also high-quality prompt artefacts in the broader sense.
   Gate 2 (Rarity): Partial — preserving a prompt log is itself uncommon. The prompts are competent but not extraordinary in isolation. The rarity sits in the *system around* the prompts (AGENTS.md, plans) more than the prompts themselves.
   Gate 3 (Independent source): Cannot satisfy alone. This project = 1 source.
   Notes: Stronger evidence here would be prompts that demonstrably elicited better-than-default agent behaviour with named techniques (few-shot exemplars, role priming, chain-of-thought scaffolds). The prompts in this repo are good but read as well-scoped requests, not technique demonstrations.

4. **AI-Driven Research & Analysis**
   Evidence found: Yes
   Gate 1 (Artefact): Pass — Notes/privacy-and-data-context.md (GDPR/UAVG analysis) and Notes/wardrobe-mirror-sharpened-overview.md (self-critique of the first analysis) are concrete deliverables.
   Gate 2 (Rarity): Pass — using AI for two-pass policy research where pass-2 critiques pass-1's blind spots (consent trap, anonymous-vs-pseudonymous Recital 26 distinction) is above casual research use. The legal specificity (AP, UAVG, Article 89) suggests the AI was directed to be jurisdiction-aware, not generic.
   Gate 3 (Independent source): Cannot satisfy alone. This project = 1 source.
   Notes: Worth noting these documents are *internal working references* — they have not been validated by a privacy officer. Their value as competency evidence is the *method* (iterative AI-driven critique), not the legal conclusions.

5. **AI Prototyping & Automation**
   Evidence found: Yes
   Gate 1 (Artefact): Pass — the entire repo is the prototype. From Figma Make → Vite/React → Supabase pipeline → decomposed module tree, AI was the production engine throughout.
   Gate 2 (Rarity): Partial — many people prototype with AI; the unusual thing here is that the prototype was *promoted to a research-grade tool with documented constraints*, not the prototyping itself. Bug.md (stakeholder bug report) and the RLS-policy-aware Supabase setup are signs of production hardening, not raw vibe-coding.
   Gate 3 (Independent source): Cannot satisfy alone. This project = 1 source.
   Notes: Look for the *transition from prototype to deployed research instrument* as the strongest sub-signal here, not the existence of working code.

───────────────────────────────────────────────────────────────
SECTION 7 — GAPS & CAVEATS
───────────────────────────────────────────────────────────────

- **No automated tests.** AGENTS.md:184 names `pnpm typecheck` and `pnpm build` as the verification gates. There is no Jest/Vitest suite. Verification depends on manual smoke testing.
- **Repo is not a git repository.** AGENTS.md:196 *"This repo may not be a git repo. Do not assume commit, branch, or PR steps exist."* — so there is no commit-level audit trail to corroborate the documented timeline. Documentation is the only history.
- **The privacy documents are internal, unreviewed.** Notes/privacy-and-data-context.md:6 *"Status: Working document — not for participant distribution in current form"*. The GDPR analysis demonstrates *method*, not *validated legal output*.
- **Consent screen is documented as deferred.** CLAUDE.md *"Consent screen — consent_given and consent_timestamp columns exist in the DB schema but are always null. GDPR open exposure remains."* — the privacy analysis identified the gap but the gap is still open in the code.
- **AI authorship of Notes documents not externally verifiable.** The Notes folder reads as AI-authored (consistent register, structural patterns). The user's level of editing/review is not signalled in the files themselves. This matters for the assessor's calibration of authorship.
- **Some claimed prior work isn't in current code.** Notes/gemini-handoff.md describes a Google Apps Script pipeline that was removed; only its post-mortem remains. The Resend/email path is similarly described-then-removed. None of this is misrepresented — CLAUDE.md is explicit that those paths were removed — but a reviewer should not credit the *current code* for that earlier work.

───────────────────────────────────────────────────────────────
SECTION 8 — ASSESSOR OBSERVATIONS
───────────────────────────────────────────────────────────────

What stood out most on independent reading: the developer treats AI tooling as **infrastructure to be designed**, not as a chat companion. The split between AGENTS.md and CLAUDE.md is a context-window economy decision. The plan in Notes/2026-05-14-mirrorgame-refactor-plan.md is structured for autonomous execution with verification commands at each task. The .claude/settings.local.json file is a per-project agent-permission allowlist that names specific MCP tool calls. These are *system design* artefacts.

The second observation: there is real evidence of the developer doing the thinking the agent cannot do. The scoring.ts module carries a `TODO (research team decision)` comment marking three fields the agent was told *not* to score without human research-methodology input. The privacy documents end with a list of *recommended immediate actions* tied to institutional process (privacy officer, ethics board, DPA paperwork) — items explicitly off-limits to the AI. The developer's role boundaries are visible in the code and notes.

The third observation: the repo shows controlled iteration. The Google Sheets → Supabase migration is documented as a *decision under pressure* (Google ToS flag) with a five-option comparison and a documented selection rationale. The Resend/email path was tried and removed. The fact that *removed* approaches are documented (not just current ones) is unusual; it implies the developer treats the AI workflow as a research artefact in its own right.

One thing the user may not have flagged: Bug.md is a deliberately plain-language stakeholder-facing document — *"This document describes each in plain language: what was wrong, why it mattered for the research, and what was corrected."* That is communication design, not engineering. Most AI-assisted codebases do not produce that translation layer. It signals the user understands the AI work needs to be auditable by a non-technical research stakeholder, which is a maturity signal worth noting separately.

A balanced read: this project demonstrates strong **AI Workflow & Systems Design** and credible **Cross-Platform AI Orchestration**. **AI-Driven Research & Analysis** and **AI Prototyping & Automation** are present and substantive. **Strategic Prompt Engineering** is competent but is the weakest of the five — the rarity lives in the *scaffolding around* the prompts, not the prompts themselves. None of the five competencies can be elevated past Gate 2 on this project alone (per the 3-Gate protocol's independence requirement). To clear Gate 3, the assessor will need at least one additional independent project demonstrating the same patterns, or external attestation.

───────────────────────────────────────────────────────────────
HOW TO SUBMIT THIS DOCUMENT
───────────────────────────────────────────────────────────────

1. Copy this entire Evidence Submission Document
2. Open a new Claude Cowork session
3. Upload or paste:
   - This Evidence Submission Document
   - The AI Skills Assessment Card HTML file (ai-skills-assessment.html)
   - The handoff document (ai-skills-card-handoff-may2026.md) for full context
4. Say: "Evaluate this evidence against the 3-Gate Validation Protocol and tell me
   whether any competency rankings on my skills card should be updated."

═══════════════════════════════════════════════════════════════
END OF EVIDENCE SUBMISSION DOCUMENT
═══════════════════════════════════════════════════════════════
