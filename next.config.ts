import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ["@electric-sql/pglite", "pg", "drizzle-orm"],
};

export default nextConfig;
