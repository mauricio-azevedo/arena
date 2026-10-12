import type { NextConfig } from 'next';

// No turbopack.root pin: Next infers the workspace root from the single pnpm-lock.yaml
// at the repo root, which keeps future packages/* imports compilable.
const nextConfig: NextConfig = {};

export default nextConfig;
