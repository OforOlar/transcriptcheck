import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip TypeScript type checking during production build
  typescript: {
    ignoreBuildErrors: true,
  },
  // standalone output bundles only what is needed to run the app
  // making the Docker image smaller and faster to start
  output: 'standalone',
};

export default nextConfig;