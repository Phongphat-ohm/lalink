import type { NextConfig } from "next";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.line-scdn.net https://static.line-scdn.net https://d.line-scdn.net https://static.cloudflareinsights.com https://*.line.me https://line.me;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https://*.line-scdn.net https://profile.line-scdn.net https://obs.line-scdn.net https://*.line.me https://*.amazonaws.com https://*.r2.cloudflarestorage.com;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' https://*.line-scdn.net https://liffsdk.line-scdn.net https://api.line.me https://access.line.me https://*.line.me https://*.line-apps.com https://*.cloudflareinsights.com https://cloudflareinsights.com https://*.amazonaws.com https://*.r2.cloudflarestorage.com;
  media-src 'self' blob: mediastream: data: https://*.line-scdn.net;
  frame-src 'self' https://*.line.me https://line.me https://access.line.me https://liff-subwindow.line.me;
  frame-ancestors 'self' https://*.line.me https://line.me;
  worker-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://*.line.me https://line.me https://access.line.me https://liff-subwindow.line.me;
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
            value: "camera=*, microphone=(), geolocation=()",
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
