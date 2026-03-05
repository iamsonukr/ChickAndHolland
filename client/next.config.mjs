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
  
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
    serverExternalPackages: ["@alexandernanberg/react-pdf-renderer"],
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
