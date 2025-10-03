/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@thefaucet/ui", "@thefaucet/core", "@thefaucet/contract-artifacts", "@thefaucet/db"],
  experimental: {
    optimizePackageImports: ["@thefaucet/ui"],
  },
  webpack: (config, { isServer }) => {
    // Handle Node.js built-in modules
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          crypto: false,
          fs: false,
          path: false,
          os: false,
        },
      };
    }
    
    // Fix for node: scheme imports
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        'node:crypto': 'crypto',
        'node:fs': 'fs',
        'node:path': 'path',
      });
    }

    return config;
  },
};

export default nextConfig;
