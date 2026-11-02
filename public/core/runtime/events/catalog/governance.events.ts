// Migrado para TypeScript: 2026-02-25
// Re-export from events-catalog.bundle.js (Lote 11)
export * from "./dist/events-catalog.bundle.js";

// Exports missing from bundle — defined in runtime.bundle.js

/**
 * Checks if a governance violation severity is critical (CRITICAL or HIGH).
 */
export function isSeverityCritical(severity: string): boolean {
  return severity === "CRITICAL" || severity === "HIGH";
}
