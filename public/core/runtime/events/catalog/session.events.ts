// Migrado para TypeScript: 2026-02-25
// Re-export from events-catalog.bundle.js (Lote 11)
export * from "./dist/events-catalog.bundle.js";

// Exports missing from bundle — defined in runtime.bundle.js
export const SESSION_INTENTS: Readonly<Record<string, string>> = Object.freeze({
  INIT: "session.init.request",
  DESTROY: "session.destroy.request",
  REFRESH: "session.refresh.request",
  EXTEND: "session.extend.request"
});
