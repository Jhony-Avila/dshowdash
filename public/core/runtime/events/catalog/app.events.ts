// Migrado para TypeScript: 2026-02-25
// Re-export from events-catalog.bundle.js (Lote 11)
export * from "./dist/events-catalog.bundle.js";

// Exports missing from bundle — defined in runtime.bundle.js
export const APP_INTENTS: Readonly<Record<string, string>> = Object.freeze({
  REFRESH: "app.refresh.request"
});
