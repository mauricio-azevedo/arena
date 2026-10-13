# Contributing

## Branches

- A branch is created from an issue with the GitHub CLI `gh issue develop <issue-number> --checkout`. The issue will be
  automatically closed without the need for closing keywords (like "Closes #123").

## Commits

- One logical change per commit.

## Pull requests

- Contains one self-contained change.
- Titles follow Conventional Commits.
- Adds or updates related tests and docs.

## Repository Settings and Rulesets

#### Settings

- Squash messages default to PR titles only.
- Merged branches are deleted automatically.
- Automatic closure of linked issues is enabled.

#### Rulesets

- PR's are squash-merged.
- PR titles pass the Conventional Commits CI check.

## CI

- Validates PR titles follow Conventional Commits.

## ADRs

- An ADR is written, in the same PR, whenever a technical decision is costly or difficult to change.
- Templates and format: [`docs/decisions/README.md`](docs/decisions/README.md).
