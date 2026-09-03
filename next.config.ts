import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["exceljs"],
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  // Allow both localhost and 127.0.0.1 (and IPv4 bind) to load /_next assets in `next dev`.
  allowedDevOrigins: ["127.0.0.1", "localhost", "0.0.0.0"],
};

export default nextConfig;
