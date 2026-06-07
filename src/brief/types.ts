export type BriefStatus = 'ready' | 'attention' | 'blocked';
export type Confidence = 'low' | 'medium' | 'high';
export type FindingKind = 'fact' | 'concern' | 'decision' | 'recommendation' | 'unknown';

export type SourceRef = {
  label: string;
  url: string;
};

export type BriefFinding = {
  kind: FindingKind;
  title: string;
  summary: string;
  confidence: Confidence;
  sources: SourceRef[];
};

export type ProjectBrief = {
  subject: string;
  status: BriefStatus;
  confidence: Confidence;
  executiveSummary: string;
  facts: BriefFinding[];
  decisions: BriefFinding[];
  concerns: BriefFinding[];
  recommendations: BriefFinding[];
  unresolvedQuestions: BriefFinding[];
};
