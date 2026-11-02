// Build-only entry point (não carregado pelo browser)
// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// BARREL ENTRY — core/runtime bundle
// ═══════════════════════════════════════════════════════════════
// Este arquivo NÃO é carregado pelo browser. Serve apenas como entry
// point para o Vite bundlar todos os módulos de core/runtime.
//
// NOTA: governance-telemetry-bridge.js é EXCLUÍDO do bundle porque
// bootstrap faz `import * as GovernanceTelemetryBridge` (namespace import),
// que capturaria TODOS os exports do bundle em vez de apenas os do módulo.
// ═══════════════════════════════════════════════════════════════

// ── Single wildcard source: runtime.bundle.js ──
// All source files (ports-profiles, strict-mode, early-boot-logger, etc.)
// re-export from runtime.bundle.js. Using a single export * avoids TS2308.
export * from './dist/runtime.bundle.js';

// ── Events Catalog: additional names NOT in runtime.bundle ──
// The catalog barrel has ~80 event constants (ACCESSIBILITY_EVENTS, etc.)
// that only exist in the events-catalog bundle. Explicit re-exports avoid
// TS2308 ambiguity with the overlapping names from runtime.bundle.
export {
  ACCESSIBILITY_EVENTS, ACCESSIBILITY_INTENTS, ANNOUNCE_PRIORITY,
  ACTION_EVENTS, ACTION_INTENTS,
  ANALYTICS_EVENTS, ANALYTICS_INTENTS,
  API_EVENTS,
  AUDIT_TRAIL_EVENTS,
  CACHE_EVENTS, CACHE_INTENTS,
  CARD_EVENTS, CARD_INTENTS,
  CAROUSEL_EVENTS,
  CHARTS_EVENTS,
  COMMAND_EVENTS, COMMAND_INTENTS,
  CONTAINER_EVENTS, CONTAINER_INTENTS,
  DEVICE_EVENTS, DEVICE_INTENTS,
  ERROR_BOUNDARY_EVENTS, ERROR_BOUNDARY_INTENTS,
  EXTERNAL_EVENTS, EXTERNAL_INTENTS,
  FOOTER_EVENTS, FOOTER_INTENTS,
  HEADER_EVENTS, HEADER_INTENTS,
  KERNEL_RUNTIME_EVENTS, KERNEL_RUNTIME_INTENTS,
  LOTTIE_EVENTS,
  MAIN_EVENTS, MAIN_INTENTS,
  MANIFEST_EVENTS, MANIFEST_INTENTS,
  MF_EVENTS, MF_INTENTS,
  NAV_EVENTS, NAV_INTENTS,
  NAVIGATION_EVENTS, NAVIGATION_INTENTS,
  NAVRAIL_EVENTS, NAVRAIL_INTENTS,
  NETWORK_EVENTS, NETWORK_INTENTS,
  OVERLAY_EVENTS, OVERLAY_INTENTS,
  PANEL_EVENTS, PANEL_INTENTS,
  PANEL_LOADER_EVENTS, PANEL_LOADER_INTENTS,
  PERFORMANCE_EVENTS, PERFORMANCE_INTENTS,
  PERSISTENCE_EVENTS, PERSISTENCE_INTENTS,
  PLUGIN_EVENTS, PLUGIN_INTENTS,
  PREFERENCES_EVENTS, PREFERENCES_INTENTS,
  SAVED_VIEWS_EVENTS, SAVED_VIEWS_INTENTS,
  SESSION_ADMIN_EVENTS,
  SETTINGS_EVENTS,
  SIDEBAR_EVENTS, SIDEBAR_INTENTS,
  SW_EVENTS, SW_INTENTS,
  TABLE_EVENTS, TABLE_INTENTS,
  THEME_EVENTS, THEME_INTENTS,
  TICKER_EVENTS, TICKER_INTENTS,
  UARPS_EVENTS,
  DENSITY_VALUES,
  BRIDGE_FROM_ACCORDION, BRIDGE_TO_ACCORDION,
  ACCORDION_EVENTS, ACCORDION_INTENTS
} from './events/catalog/_entry.ts';

// ── Resolve conflicting names (canonical source) ──
// VERSION, MODULE_ID, healthCheck are exported by multiple source files.
// Explicit re-export picks the canonical source for the bundle.
export { VERSION, MODULE_ID, healthCheck } from './enterprise/strict-mode.ts';
