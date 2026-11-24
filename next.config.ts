import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {
    "/receipts/*/pdf": [
      "./node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff",
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};
export default config;
