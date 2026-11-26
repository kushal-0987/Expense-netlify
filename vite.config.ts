// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { loadEnv } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Ensure server-side secrets from .env and .env.local (e.g. SUPABASE_SERVICE_ROLE_KEY, MEMBER_PIN_SECRET)
// are available in process.env during local dev without overriding real host/Vercel environment variables.
const env = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
for (const [key, val] of Object.entries(env)) {
  if (process.env[key] === undefined && val !== undefined) {
    process.env[key] = val;
  }
}

export default defineConfig({
  ...(process.env.VERCEL ? { nitro: { preset: "vercel" } } : {}),
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
