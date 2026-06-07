import type { PrSnapshot } from '../github/models.js';
import type { BriefFinding, ProjectBrief } from './types.js';
import { summarizeChangedAreas } from './areas.js';

export function buildPrBrief(snapshot: PrSnapshot): ProjectBrief {
  const { pr, files, repository } = snapshot;
  const isLargeChange = pr.changedFiles >= 12 || pr.additions + pr.deletions >= 300;
  const status = pr.merged ? 'ready' : pr.draft || isLargeChange ? 'attention' : 'ready';

  const facts: BriefFinding[] = [
    {
      kind: 'fact',
      title: 'Pull request metadata',
      summary: `PR #${pr.number} is ${pr.state}${pr.draft ? ' and still marked as draft' : ''}. It changes ${pr.changedFiles} files with ${pr.additions} additions and ${pr.deletions} deletions.`,
      confidence: 'high',
      sources: [{ label: `PR #${pr.number}`, url: pr.url }],
    },
    {
      kind: 'fact',
      title: 'Changed areas',
      summary: summarizeChangedAreas(files.map((file) => file.path)),
      confidence: 'high',
      sources: [{ label: `PR #${pr.number} files`, url: `${pr.url}/files` }],
    },
  ];

  const concerns: BriefFinding[] = [];

  if (isLargeChange) {
    concerns.push({
      kind: 'concern',
      title: 'Large review surface',
      summary: 'The PR touches enough files or lines to justify manual review by product flow rather than only by file diff.',
      confidence: 'medium',
      sources: [{ label: `PR #${pr.number}`, url: pr.url }],
    });
  }

  if (pr.draft) {
    concerns.push({
      kind: 'concern',
      title: 'Draft status',
      summary: 'The PR is still marked as draft, so it should not be treated as ready to merge without an explicit readiness decision.',
      confidence: 'high',
      sources: [{ label: `PR #${pr.number}`, url: pr.url }],
    });
  }

  return {
    subject: `${repository} PR #${pr.number}: ${pr.title}`,
    status,
    confidence: 'medium',
    executiveSummary: `${repository} PR #${pr.number}, "${pr.title}", changes ${pr.changedFiles} files with ${pr.additions} additions and ${pr.deletions} deletions.`,
    facts,
    decisions: [],
    concerns,
    recommendations: [
      {
        kind: 'recommendation',
        title: 'Review by user flow',
        summary: 'Review the affected product flows end-to-end, especially navigation, primary actions, empty states, loading states, and mobile layout.',
        confidence: 'medium',
        sources: [{ label: `PR #${pr.number} files`, url: `${pr.url}/files` }],
      },
    ],
    unresolvedQuestions: [
      {
        kind: 'unknown',
        title: 'Validation status',
        summary: 'Atlas could not determine build, lint, test, or visual validation results from the PR metadata alone.',
        confidence: 'high',
        sources: [{ label: `PR #${pr.number}`, url: pr.url }],
      },
    ],
  };
}
