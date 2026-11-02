// Migrado para TypeScript: 2026-02-25
// Re-export from events-catalog.bundle.js (Lote 11)
export * from "./dist/events-catalog.bundle.js";

// Exports missing from bundle — defined in runtime.bundle.js
export const ASSET_INTENTS: Readonly<Record<string, string>> = Object.freeze({
  LOAD_CSS: "asset.css.load.request",
  LOAD_JS: "asset.js.load.request",
  LAZY_LOAD: "asset.lazy.load.request"
});
