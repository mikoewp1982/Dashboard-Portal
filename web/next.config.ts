import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Prevent firebase-admin / jwks-rsa / jose from being bundled into the
  // App Hosting adapter build in a way that triggers ERR_REQUIRE_ESM.
  serverExternalPackages: ["firebase-admin", "jwks-rsa", "jose"],
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
