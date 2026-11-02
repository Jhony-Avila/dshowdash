// Migrado para TypeScript: 2026-02-25
// Re-export from events-catalog.bundle.js (Lote 11)
export * from "./dist/events-catalog.bundle.js";

// Exports missing from bundle — defined in runtime.bundle.js
export const SECURITY_INTENTS: Readonly<Record<string, string>> = Object.freeze({
  READY: "SecurityEventsClient inicializado",
  ERROR: "Erro em operação de segurança",
  LIST: "Lista de eventos carregada",
  STATS: "Estatísticas carregadas",
  LOGGED: "Evento de segurança registrado",
  FLUSHED: "Buffer de eventos enviado"
});
