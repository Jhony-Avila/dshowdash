// Migrado para TypeScript: 2026-02-25
// Re-export from events-catalog.bundle.js (Lote 11)
export * from "./dist/events-catalog.bundle.js";

// Exports missing from bundle — defined in runtime.bundle.js
export const LIFECYCLE_INTENTS: Readonly<Record<string, string>> = Object.freeze({
  MOUNT: "lifecycle.mount.request",
  UNMOUNT: "lifecycle.unmount.request",
  DESTROY: "lifecycle.destroy.request"
});
