# Research Sources

Use this file to choose better online research sources before making product, UI, architecture, code, deploy, security, or AI-workflow decisions.

## Rule

Pick sources based on the decision type, not based on popularity.

- Visual inspiration is not UX evidence.
- UX heuristics are not product strategy.
- Product benchmarks are not implementation guidance.
- Engineering principles are not framework documentation.
- Framework documentation is not architecture by itself.
- Design patterns are vocabulary and decision aids, not implementation mandates.
- Security references should be treated separately from general engineering advice.

The assistant should research the relevant category, compare findings with Arena's context, and then recommend a decision.

## 1. Visual inspiration and UI galleries

Purpose: use for visual language, layout, density, hierarchy, cards, onboarding, empty states, interaction ideas, and screenshots of comparable product surfaces.

Sources:

- Mobbin
- Pageflows
- Dribbble
- Behance
- Screenlane
- UI Sources
- Awwwards
- The FWA
- Godly
- Landingfolio
- Lapa Ninja
- SaaSFrame
- Nicelydone

Caution:

- Prefer real product screenshots and flows over concept art.
- Do not copy pretty shots blindly.
- Do not use visual galleries as evidence for architecture, data modeling, accessibility, or product strategy.

## 2. UX, interaction, accessibility, and design-system references

Purpose: use for usability, accessibility, interaction behavior, component conventions, design-system decisions, forms, navigation, modals, tabs, loading states, empty states, and error states.

Sources:

- Nielsen Norman Group
- Nielsen's 10 usability heuristics
- Refactoring UI
- WCAG 2.2
- WAI-ARIA Authoring Practices
- Apple Human Interface Guidelines
- Material Design 3
- Microsoft Fluent Design
- Figma design-system docs
- Laws of UX
- Baymard Institute
- Web.dev
- Smashing Magazine

Caution:

- Treat platform guidelines as guidance, not as a mandate to make Arena feel like Apple, Google, or Microsoft.
- Accessibility guidance is not optional when it affects real user access.
- Refactoring UI is useful for visual hierarchy and product polish, but it does not replace product strategy.

## 3. Product and domain benchmarks

Purpose: use for product strategy, sports-domain behavior, competitive mechanics, group activity, user motivation, ranking confidence, and recurring engagement.

Sources:

- Strava: social competition, activity, leaderboard integrity.
- GameChanger: amateur sports, recaps, team/player stats, match context.
- TeamSnap: group organization, roster, schedule, communication.
- Chess.com: rating as competitive identity.
- UTR: sport rating, rating confidence, match volume.
- Duolingo: lightweight progression, habit, leagues, streaks.
- Playtomic: sport matching, levels, booking, amateur sports network.
- Apple Sports: relevance, favorites, live status, "what is happening now".
- Garmin Connect: personal sports history, trends, performance context.
- WHOOP: health/performance synthesis and score narratives.
- Peloton: social fitness, challenges, leaderboards, community motivation.
- Zwift: competition, progression, virtual sport community.
- Discord: persistent communities, channels, roles, activity signals.
- Reddit: community activity, ranking of visible content, participation signals.
- Meetup: groups, members, events, active community signals.
- Heja: lightweight team/group coordination.
- Spond: team/group organization and events.
- SportEasy: amateur team organization and communication.

Use for Arena questions such as:

- Is this group alive?
- Where am I competing?
- What changed since last time?
- What is my next action?
- Does this ranking feel trustworthy?

Caution:

- Do not copy gamification aggressively.
- Do not turn Arena into a heavy team-management app too early.
- Do not add advanced stats before there is enough match volume.
- Prefer social + competitive + lightweight.

## 4. Engineering practice, architecture, and code review

Purpose: use for design review, code review, change size, boundaries, maintainability, testing expectations, and architecture trade-offs.

Sources:

- Google Engineering Practices
- Google Code Review Guide
- Google Small CLs
- Google TypeScript Style Guide
- Martin Fowler
- Architecture Decision Records
- Thoughtworks Technology Radar
- Stripe Engineering
- GitHub Engineering
- Shopify Engineering
- Vercel Engineering
- Linear Engineering

Use for questions such as:

- Does this change belong here?
- Is the design consistent with the existing system?
- Is the PR small enough to review?
- Does the code introduce unnecessary complexity?
- Are tests and documentation proportional to the risk?

Caution:

- Do not apply big-tech patterns blindly.
- Use these sources to improve judgment, not to justify overengineering.

## 5. Design patterns, architecture patterns, and pattern languages

Purpose: use for recognizing recurring solution shapes, naming trade-offs, and comparing implementation approaches before adding abstractions.

Sources:

- Design Patterns: Elements of Reusable Object-Oriented Software / GoF
- Patterns.dev
- Martin Fowler — Patterns of Enterprise Application Architecture
- Enterprise Integration Patterns
- Microsoft Cloud Design Patterns
- Microservices.io patterns
- Refactoring Guru
- SourceMaking

Use for questions such as:

- Is this a Strategy, Adapter, Facade, Projection, Gateway, State Machine, or simple function?
- Is there a known pattern for this async, job, integration, storage, or read-model problem?
- Does this pattern reduce complexity or add unnecessary indirection?
- Is this a frontend composition pattern, backend boundary pattern, or distributed-systems pattern?
- Is a simple implementation insufficient, and why?

Useful Arena examples:

- Strategy: when multiple rating algorithms need to coexist.
- Adapter/Gateway: when integrating storage, auth providers, image services, payments, or external APIs.
- Facade/BFF: when a screen needs a stable product-shaped API over several backend details.
- Projection/Materialized View: when read models are derived from match history or processing jobs.
- CQRS: when reads and writes have clearly different shapes and constraints.
- Idempotent Receiver: when jobs or events can run more than once.
- Outbox: when external events must be consistent with database writes.
- State Machine: when match, invite, or processing-job lifecycle states become complex.
- Compound Component: when React components need coordinated composition without leaking state management.

Caution:

- Patterns are vocabulary and decision aids, not implementation mandates.
- Do not introduce a pattern unless the problem exists.
- Do not rename simple code to match a pattern.
- Do not apply textbook OO patterns blindly to TypeScript, React, NestJS, or Prisma.
- Prefer Arena's existing conventions over pattern purity.
- If the pattern adds more concepts than it removes, do not use it.

## 6. Reliability, operations, and deploy

Purpose: use for production safety, deploy, rollback, observability, migrations, jobs, idempotency, runtime behavior, and incident response.

Sources:

- Google SRE Book
- Google SRE Workbook
- Twelve-Factor App
- Render docs
- Prisma migration docs
- PostgreSQL docs
- incident and postmortem references
- observability and structured logging references

Use for questions such as:

- How do we know this is working?
- How do we debug it when it fails?
- What happens if the job runs twice?
- What happens if code deploys before migration?
- What is the rollback?
- Which checks belong in build, release, and runtime?

Caution:

- Keep operational design simple.
- Add observability where it helps debug real failures.
- Do not create production process complexity without a concrete risk.

## 7. Security and privacy

Purpose: use for auth, permissions, uploads, tokens, private data, public APIs, rate limiting, admin actions, destructive actions, and abuse cases.

Sources:

- OWASP ASVS
- OWASP Top 10
- OWASP API Security Top 10
- OWASP Cheat Sheet Series
- Auth provider documentation
- Cloud provider security documentation
- Storage provider security documentation

Use for questions such as:

- Can a user access another group's data?
- Are admin/member permissions preserved?
- Are tokens, secrets, or private data exposed?
- Is upload validation sufficient?
- Is the destructive action guarded?
- Are abuse cases handled?

Caution:

- Security-sensitive changes require a more conservative workflow.
- Prompt engineering or AI review is not a substitute for explicit permission checks and security validation.

## 8. Stack-specific documentation

Purpose: use for current behavior of frameworks, libraries, build tools, deployment providers, and generated code.

Sources:

- Next.js docs
- React docs
- TypeScript docs
- Tailwind CSS docs
- shadcn/ui docs
- Radix UI docs
- NestJS docs
- Prisma docs
- PostgreSQL docs
- Render docs
- Testing Library docs
- Jest/Vitest docs, depending on the area being changed

Use for questions such as:

- What does this framework currently support?
- Has behavior changed since the assistant's training data?
- How should this be built, generated, migrated, or deployed?
- What are the current API, cache, server/client component, or migration rules?

Caution:

- Prefer official docs for tool behavior.
- Do not rely on memory for framework, Prisma, Render, auth, or deploy details when accuracy matters.

## 9. Code quality and refactoring heuristics

Purpose: use for implementation-level clarity, simplicity, refactoring, dependency direction, and avoiding accidental complexity.

Sources and concepts:

- SRP
- KISS
- DRY
- YAGNI
- AHA / avoid hasty abstractions
- cohesion and coupling
- information hiding
- dependency direction
- Refactoring by Martin Fowler
- A Philosophy of Software Design by John Ousterhout
- Working Effectively with Legacy Code by Michael Feathers
- Tidy First? by Kent Beck
- Code That Fits in Your Head by Mark Seemann
- Google TypeScript Style Guide

Caution:

- Treat these as heuristics, not laws.
- DRY is good when it removes duplicated knowledge; it is harmful when it creates premature abstractions.
- SRP is useful when it clarifies responsibility; it is harmful when it fragments simple code.
- KISS should reduce complexity, not ignore real edge cases.
- YAGNI should avoid speculative work, not prevent necessary design.

## 10. AI workflow and agentic coding

Purpose: use for improving how AI assistants research, plan, implement, validate, review, and maintain context.

Sources:

- OpenAI Codex best practices
- OpenAI AGENTS.md guidance
- Anthropic Claude Code best practices
- GitHub Copilot prompt engineering
- empirical studies on AI coding assistants
- empirical studies on prompt management
- empirical studies on agent instruction files

Use for questions such as:

- When should the AI implement vs only research?
- When should approval be required?
- How should tasks be split?
- How should prompts and instructions be maintained?
- How should tests, build, lint, and review close the loop?
- How do we avoid losing codebase ownership?

Caution:

- Prompt quality matters, but workflow quality matters more.
- Context quality matters more than a clever one-off prompt.
- Generated code still needs review.

## How to use this file

Before research:

1. Identify the category of decision.
2. Pick sources from that category.
3. Prefer official docs for tool behavior.
4. Prefer real product flows over concept art for UX/product decisions.
5. Prefer repo context over generic advice for implementation decisions.

After research:

1. Summarize the key findings.
2. Say what applies to Arena.
3. Say what does not apply.
4. Recommend a decision.
5. Identify open questions.
6. When considering a pattern, first describe the concrete problem, the forces/trade-offs, and why a simple implementation is insufficient.
7. Do not implement until the decision and scope are approved, unless the task is explicitly implementation-only and low risk.
