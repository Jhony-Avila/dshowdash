// Migrado para TypeScript: 2026-02-25
// Re-export from events-catalog.bundle.js (Lote 11)
export * from "./dist/events-catalog.bundle.js";

// Exports missing from bundle — defined in runtime.bundle.js
export const ORCHESTRATOR_INTENTS: Readonly<Record<string, string>> = Object.freeze({
  EMIT_INTENT: "Emitir intent para resolução",
  RESOLVE_INTENT: "Resolver intent com regras",
  DENY_INTENT: "Negar intent por permissão",
  FAIL_INTENT: "Falha na resolução de intent",
  REGISTER_MODULE: "Registrar módulo no orchestrator",
  UNREGISTER_MODULE: "Desregistrar módulo do orchestrator",
  APPLY_PRESET: "Aplicar preset de layout",
  REQUEST_LAYOUT: "Solicitar mudança de layout"
});
