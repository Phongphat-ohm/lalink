import type { NextConfig } from "next";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.line-scdn.net https://d.line-scdn.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://*.line-scdn.net https://profile.line-scdn.net https://obs.line-scdn.net https://*.amazonaws.com https://*.r2.cloudflarestorage.com;
  font-src 'self' data:;
  connect-src 'self' https://api.line.me https://access.line.me https://*.amazonaws.com;
  frame-src 'self' https://access.line.me https://line.me;
  frame-ancestors 'self' https://*.line.me https://line.me;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  allowedDevOrigins: ["selfdev.ppkxb.space"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
