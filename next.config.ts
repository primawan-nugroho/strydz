import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    // Native View Transitions on route navigation (cross-fade); browsers without
    // support just skip the animation.
    viewTransition: true,
  },
};

export default nextConfig;
