import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 usa bindings nativos — no debe bundlearse por webpack
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
