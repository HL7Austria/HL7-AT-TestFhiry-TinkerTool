import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Deaktiviert TypeScript-Fehler während des Build-Prozesses
    ignoreBuildErrors: true,
  },
  /* config options here */
};

export default nextConfig;
