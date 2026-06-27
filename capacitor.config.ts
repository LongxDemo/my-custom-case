import type { CapacitorConfig } from "@capacitor/cli";

// Native shell for CaseCraft.
//
// This app is server-rendered with server functions served by the Cloudflare
// Worker, so the native WebView loads the deployed site directly (server.url)
// rather than bundling static files. That keeps auth, the D1 database and SSR
// all working, and means content updates ship by deploying the Worker — no app
// rebuild needed for web changes.
//
// `webDir` is still required by Capacitor; it points at the built static output
// and acts only as a fallback. Run `npm run build` before `npx cap sync`.
const config: CapacitorConfig = {
  appId: "com.longxdemo.casecraft",
  appName: "CaseCraft",
  webDir: ".output/public",
  server: {
    url: "https://longxdemo-my-custom-case.longxdemo.workers.dev",
    cleartext: false,
  },
  ios: {
    // Let the web app's own safe-area handling manage insets (matches the
    // env(safe-area-inset-*) usage already in the UI).
    contentInset: "never",
  },
};

export default config;
