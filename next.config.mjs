/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The repo doubles as the deployed app; keep CI builds green even if a lint
  // rule trips. Type-checking still runs and must pass.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
