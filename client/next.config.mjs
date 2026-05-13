// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "ymts.blr1.cdn.digitaloceanspaces.com",
//       },
//       {
//         protocol: "https",
//         hostname: "ymts.blr1.digitaloceanspaces.com",
//       },
//     ],
//   },
//   experimental: {
//     serverComponentsExternalPackages: ["@react-pdf/renderer"],
//   },
//   eslint: {
//     ignoreDuringBuilds: true,
//   },
//   experimental: {
//     serverExternalPackages: ["@alexandernanberg/react-pdf-renderer"],
//     serverActions: {
//       bodySizeLimit: "20mb",
//     },
//   },
//   typescript: {
//     // !! WARN !!
//     // Dangerously allow production builds to successfully complete even if
//     // your project has type errors.
//     // !! WARN !!
//     ignoreBuildErrors: true,
//   },
// };

// export default nextConfig;

import bundleAnalyzer from "@next/bundle-analyzer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5001",
        pathname: "/static/**",
      },
      {
        protocol: "https",
        hostname: "ymts.blr1.cdn.digitaloceanspaces.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ymts.blr1.digitaloceanspaces.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "chicandholland-space.ams3.cdn.digitaloceanspaces.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "chicandholland-space.ams3.digitaloceanspaces.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.chicandholland.com",
        pathname: "/static/**",
      },
      {
        protocol: "https",
        hostname: "bwipjs-api.metafloor.com",
        pathname: "/**",
      },
    ],
  },

  serverExternalPackages: [
    "@react-pdf/renderer",
    "@alexandernanberg/react-pdf-renderer",
  ],

  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },

  turbopack: {
    resolveAlias: {
      canvas: "./lib/pdf/canvas-shim.ts",
    },
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      canvas: path.resolve(__dirname, "lib/pdf/canvas-shim.ts"),
    };
    return config;
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withBundleAnalyzer(nextConfig);
