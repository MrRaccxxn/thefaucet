/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@thefaucet/ui", "@thefaucet/core", "@thefaucet/contracts", "@thefaucet/db"],
  experimental: {
    optimizePackageImports: ["@thefaucet/ui"],
  },
};

export default nextConfig;
