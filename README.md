# Atlas

Atlas turns GitHub pull requests into concise project briefs.

The first wedge is deliberately small:

> Given a repository and pull request number, explain what changed, what was validated, what remains uncertain, and what should happen next.

## Initial product

Atlas v0 is a PR-to-brief generator.

It is not a dashboard, chat app, workspace, or autonomous agent yet.

## Planned CLI

```bash
npm run brief -- mauricio-azevedo/beachrank 88
```

## Output

A Markdown brief with:

- executive summary;
- changed files summary;
- validation status;
- risks;
- decisions;
- recommendations;
- open questions;
- source links.

## Development

```bash
npm install
npm run typecheck
npm run brief -- owner/repo 123
```
