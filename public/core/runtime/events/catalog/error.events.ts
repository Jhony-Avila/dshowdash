// Migrado para TypeScript: 2026-02-25
// Re-export from events-catalog.bundle.js (Lote 11)
export * from "./dist/events-catalog.bundle.js";

// Exports missing from bundle — defined in runtime.bundle.js
export const ERROR_INTENTS: Readonly<Record<string, string>> = Object.freeze({
  RETRY: "error.retry.request",
  RELOAD_PANEL: "error.reload.panel.request",
  RELOAD_ENGINE: "error.reload.engine.request",
  DISMISS: "error.dismiss.request",
  RECOVER: "error.recover.request"
});
