import type { NextConfig } from 'next';

// No turbopack.root pin: Next infers the workspace root from the single pnpm-lock.yaml
// at the repo root, which keeps future packages/* imports compilable.
const nextConfig: NextConfig = {
  // Next 16.4 writes an AGENTS.md into apps/web on every `next dev`; the repo keeps one at the root.
  agentRules: false,
};

export default nextConfig;
