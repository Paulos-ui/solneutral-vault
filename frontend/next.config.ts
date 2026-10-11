import type { NextConfig } from "next";

/**
 * Drift's browser SDK has transitive Anchor/Serum utilities that still contain
 * optional NodeWallet filesystem imports. They are never used by our
 * browser-injected Phantom/Solflare signer. Next 16 Turbopack nevertheless
 * resolves every require('fs') in the graph and fails the production build.
 *
 * Alias fs ONLY in the browser, not in server routes. Do not expose a server
 * keypair or try to polyfill NodeWallet in the browser.
 * Docs: https://nextjs.org/docs/app/guides/upgrading/version-16#resolve-alias-fallback
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      fs: { browser: "./lib/browser-fs-empty.ts" },
    },
  },
};

export default nextConfig;
