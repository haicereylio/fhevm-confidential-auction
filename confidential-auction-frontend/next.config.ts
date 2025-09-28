import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export
  output: 'export',
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  
  // Configure trailing slash for static hosting
  trailingSlash: true,
  
  // Disable server-side features for static export
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false, // Enable TypeScript checking for production
  },
  
  // Disable server-side rendering features
  experimental: {
    forceSwcTransforms: true,
  },
  
  // Configure static export directory
  distDir: '.next',
};
