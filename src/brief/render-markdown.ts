import type { BriefFinding, ProjectBrief } from './types.js';

export function renderBriefMarkdown(brief: ProjectBrief) {
  return [
    `# Atlas Brief — ${brief.subject}`,
    '',
    `Status: **${brief.status}**`,
    `Confidence: **${brief.confidence}**`,
    '',
    '## Executive summary',
    '',
    brief.executiveSummary,
    '',
    renderSection('Facts', brief.facts),
    renderSection('Decisions', brief.decisions),
    renderSection('Concerns', brief.concerns),
    renderSection('Recommendations', brief.recommendations),
    renderSection('Unresolved questions', brief.unresolvedQuestions),
  ]
    .filter(Boolean)
    .join('\n');
}

function renderSection(title: string, findings: BriefFinding[]) {
  if (findings.length === 0) {
    return '';
  }

  return [
    `## ${title}`,
    '',
    ...findings.flatMap((finding) => [
      `### ${finding.title}`,
      '',
      `Kind: ${finding.kind}`,
      `Confidence: ${finding.confidence}`,
      '',
      finding.summary,
      '',
      ...renderSources(finding),
      '',
    ]),
  ].join('\n');
}

function renderSources(finding: BriefFinding[]) {
  return finding;
}

function renderSources(finding: BriefFinding) {
  if (finding.sources.length === 0) {
    return [];
  }

  return ['Sources:', ...finding.sources.map((source) => `- [${source.label}](${source.url})`)];
}
