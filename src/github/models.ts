export type PrInfo = {
  number: number;
  title: string;
  state: string;
  draft: boolean;
  merged: boolean;
  mergeable: boolean | null;
  url: string;
  base: string;
  head: string;
  headSha: string;
  body: string | null;
  changedFiles: number;
  additions: number;
  deletions: number;
};

export type ChangedFile = {
  path: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
};

export type PrSnapshot = {
  repository: string;
  pr: PrInfo;
  files: ChangedFile[];
};
