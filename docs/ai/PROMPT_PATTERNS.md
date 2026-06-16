# Prompt Patterns

Reusable prompt templates for working with AI on Arena.

These are templates, not magic prompts. Adapt them to the task and keep the workflow explicit.

## 1. Product exploration

Use when the idea is still fuzzy.

```text
I want to explore [idea/problem].

Before suggesting implementation:
1. Research relevant external references.
2. Read/search the current product/code if needed.
3. Explain what category of problem this is.
4. Map 2-4 solution directions.
5. Compare trade-offs.
6. Recommend one direction.
7. List what we should not do yet.
8. Do not edit code.
```

## 2. Technical decision

Use before architecture-sensitive code.

```text
I need to implement [feature/problem].

Do not write code yet.

First:
1. Read the relevant code.
2. Explain the current architecture.
3. Identify where this change belongs.
4. Map solution options.
5. Compare trade-offs: correctness, complexity, performance, deploy risk, and testability.
6. Recommend one.
7. Propose small implementation steps.
8. Wait for approval before editing.
```

## 3. Incremental implementation

Use after approving a plan.

```text
Implement only step [N].

Rules:
- Touch the fewest files possible.
- Do not refactor outside the task.
- Preserve existing patterns.
- Explain each changed file.
- Run or list the relevant validation commands.
- Stop after this step and wait.
```

## 4. Debug or build failure

Use when something broke.

```text
This error happened:

[error]

Please:
1. Identify the root cause.
2. Read the current relevant files.
3. Compare actual code with the expected contract.
4. Avoid superficial workarounds.
5. Propose the smallest safe fix.
6. Apply only that fix.
7. State exactly how to validate it.
```

## 5. Code review

Use after a diff exists.

```text
Review this diff like a staff engineer.

Focus on:
1. Scope control.
2. Architecture fit.
3. Product behavior.
4. Data correctness.
5. Security and permissions.
6. Tests and validation.
7. Deploy risk.
8. What I need to understand to own this code.
```

## 6. UI architecture audit

Use before broad UI work.

```text
Audit this UI area.

Do not implement yet.

Please:
1. Inventory existing components.
2. Identify reusable vs one-off pieces.
3. Identify Tailwind/shadcn inconsistencies.
4. Propose a design-system direction.
5. Recommend a staged refactor plan.
6. Explain what should not be abstracted yet.
```

## 7. Research request

Use when external references should guide the decision.

```text
Research [topic] for [decision].

Use:
- official docs first;
- high-quality engineering/product references second;
- examples from comparable products if relevant.

Return:
1. Key findings.
2. What applies to Arena.
3. What does not apply.
4. Recommended decision.
5. Open questions.
```

## 8. Deployment or migration review

Use before deploy-sensitive work.

```text
Review this deploy/migration change.

Please check:
1. Build-time vs runtime requirements.
2. Migration ordering.
3. Whether old code can run against new schema.
4. Whether new code can run before migration.
5. Required generated files.
6. Rollback plan.
7. Exact commands for local and production validation.
```

## 9. Documentation update

Use after a decision stabilizes.

```text
Update the relevant docs for this decision.

Rules:
- Keep the doc practical and short.
- Explain the decision, not the whole implementation.
- Include why this matters for future work.
- Do not duplicate code comments.
- Add commands/checklists only if they will actually be reused.
```

## Prompt quality checklist

A good prompt should usually include:

- the problem;
- relevant context;
- constraints;
- what has already been considered;
- desired output format;
- whether the assistant may edit code;
- validation criteria;
- what not to do.

Avoid prompts that:

- ask for broad implementation immediately;
- hide uncertainty;
- omit validation criteria;
- combine multiple unrelated tasks;
- ask for architecture and implementation in one step;
- rely on style words like "clean", "modern", or "premium" without product criteria.
