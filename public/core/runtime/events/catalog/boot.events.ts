// Migrado para TypeScript: 2026-02-25
// Re-export from events-catalog.bundle.js (Lote 11)
export * from "./dist/events-catalog.bundle.js";

// Exports missing from bundle — defined in runtime.bundle.js
export const BOOT_INTENTS: Readonly<Record<string, string>> = Object.freeze({
  START: "boot.start.request",
  RESTART: "boot.restart.request"
});
