// Migrado para TypeScript: 2026-02-25
// Re-export from events-catalog.bundle.js (Lote 11)
export * from "./dist/events-catalog.bundle.js";

// Exports missing from bundle — micro-frontend event factory

/**
 * Creates a micro-frontend event name for platform communication.
 * Used by MFE entry points to emit lifecycle events (init, mounted, unmounted).
 */
export function createMfEvent(domain: string, eventType: string): string {
  return `mf.${domain}.${eventType}`;
}
