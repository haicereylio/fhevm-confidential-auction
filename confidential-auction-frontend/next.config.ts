import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during builds (for development)
    ignoreBuildErrors: true,
  },
  experimental: {
    // Disable strict mode for development
    forceSwcTransforms: true,
  },
};
