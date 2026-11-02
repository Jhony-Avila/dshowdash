// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// @deprecated v5.0.0-P2 — NÃO IMPORTE DESTE ARQUIVO.
// Use imports granulares de /core/runtime/events/catalog/*.events.js
// Exemplo: import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
// Este barrel será removido em versão futura.
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.0.0-P2-DEPRECATED)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.events
// PURPOSE: Central Export (Barrel) - DEPRECATED - Catálogo de eventos
// ───────────────────────────────────────────────────────────────
// @contract BARREL_FILE - DEPRECATED - Exportações centralizadas de eventos
// @changelog v5.0.0-P2-DEPRECATED: Barrel deprecated — 0 consumer imports, all migrated to granular catalogs
// @changelog v4.14.0-GOVERNANCE: Added GOVERNANCE_EVENTS for enterprise strict-mode
// @changelog v4.13.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v4.12.0-P1-ENTERPRISE: Added listeners-registry.js
// @changelog v4.11.0: Added DEGRADATION_EVENTS catalog
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION: string = '2.9.0-STRICT-MODE';
export const MODULE_ID: string = 'core.runtime.events';

export { NAMESPACES, VALID_NAMESPACES, isValidNamespace, extractNamespace, validateEventName } from './namespaces.js';
export { AUTH_EVENTS, AUTH_INTENTS, AUTH_STATES, AUTH_DATA_ATTRIBUTES, LOGIN_MODAL_EVENTS, LOGIN_MODAL_INTENTS } from './catalog/auth.events.js';
export { ROUTER_EVENTS, ROUTER_INTENTS } from './catalog/router.events.js';
export { SESSION_EVENTS, SESSION_INTENTS } from './catalog/session.events.js';
export { PANEL_EVENTS, PANEL_INTENTS, PANEL_16_UI_EVENTS, createPanelHandler, emitPanelIntent } from './catalog/panels.events.js';
export { PERMISSIONS_EVENTS, PERMISSIONS_INTENTS } from './catalog/permissions.events.js';
export { SECURITY_EVENTS, SECURITY_INTENTS } from './catalog/security.events.js';
export { UI_EVENTS, UI_INTENTS } from './catalog/ui.events.js';
export { TELEMETRY_EVENTS, TELEMETRY_INTENTS } from './catalog/telemetry.events.js';
export { ORCHESTRATOR_EVENTS, ORCHESTRATOR_INTENTS } from './catalog/orchestrator.events.js';
export { SYSTEM_EVENTS, SYSTEM_INTENTS, LEGACY_ALIASES } from './catalog/system.events.js';
export { LOG_EVENTS, LOG_INTENTS } from './catalog/log.events.js';
export { ACTION_EVENTS, ACTION_INTENTS } from './catalog/action.events.js';
export { APP_EVENTS, APP_INTENTS } from './catalog/app.events.js';
export { ASSET_EVENTS, ASSET_INTENTS } from './catalog/asset.events.js';
export { BOOT_EVENTS, BOOT_INTENTS } from './catalog/boot.events.js';
export { COMMAND_EVENTS, COMMAND_INTENTS } from './catalog/command.events.js';
export { DEGRADATION_EVENTS } from './catalog/degradation.events.js';
export { MANIFEST_EVENTS, MANIFEST_INTENTS } from './catalog/manifest.events.js';
export { NAV_EVENTS, NAV_INTENTS } from './catalog/nav.events.js';
export { EXTERNAL_EVENTS, EXTERNAL_INTENTS } from './catalog/external.events.js';
export { CORE_EVENTS, CORE_INTENTS } from './catalog/core.events.js';
export { SHELL_EVENTS, SHELL_INTENTS } from './catalog/shell.events.js';
export { STATE_EVENTS, STATE_INTENTS, GLOBAL_STATE_EVENTS, GLOBAL_STATE_INTENTS, CONTEXT_EVENTS, CONTEXT_INTENTS, PANEL_16_STATE_EVENTS, validateEventContracts } from './catalog/state.events.js';
export { PERFORMANCE_EVENTS, PERFORMANCE_INTENTS } from './catalog/performance.events.js';
export { ERROR_BOUNDARY_EVENTS, ERROR_BOUNDARY_INTENTS } from './catalog/error-boundary.events.js';
export { MF_EVENTS, MF_INTENTS, createMfEvent } from './catalog/mf.events.js';
export { CONTAINER_EVENTS, CONTAINER_INTENTS } from './catalog/container.events.js';
export { PERSISTENCE_EVENTS, PERSISTENCE_INTENTS } from './catalog/persistence.events.js';
export { TABLE_EVENTS, TABLE_INTENTS } from './catalog/table.events.js';
export { SIDEBAR_EVENTS, SIDEBAR_INTENTS, ACCORDION_EVENTS, ACCORDION_INTENTS } from './catalog/sidebar.events.js';
export { NAVIGATION_EVENTS, NAVIGATION_INTENTS, BRIDGE_TO_ACCORDION, BRIDGE_FROM_ACCORDION, getAccordionEvent, getNavigationEvent, isNavigationEvent, isAccordionEvent, createNavigationEventBridge } from './catalog/navigation.events.js';
export { ERROR_EVENTS, ERROR_INTENTS } from './catalog/error.events.js';
export { MAIN_EVENTS, MAIN_INTENTS } from './catalog/main.events.js';
export { PANEL_LOADER_EVENTS, PANEL_LOADER_INTENTS } from './catalog/panel-loader.events.js';
export { PLUGIN_EVENTS, PLUGIN_INTENTS } from './catalog/plugin.events.js';
export { AUDIT_TRAIL_EVENTS } from './catalog/audit-trail.events.js';
export { API_EVENTS } from './catalog/api.events.js';
export { PRELOADER_EVENTS } from './catalog/preloader.events.js';
export { CACHE_EVENTS, CACHE_INTENTS } from './catalog/cache.events.js';
export { THEME_EVENTS, THEME_INTENTS } from './catalog/theme.events.js';
export { SW_EVENTS, SW_INTENTS } from './catalog/sw.events.js';
export { NETWORK_EVENTS, NETWORK_INTENTS } from './catalog/network.events.js';
export { FEATURE_FLAGS_EVENTS } from './catalog/feature-flags.events.js';
export { CHARTS_EVENTS } from './catalog/charts.events.js';
export { CAROUSEL_EVENTS } from './catalog/carousel.events.js';
export { KERNEL_RUNTIME_EVENTS, KERNEL_RUNTIME_INTENTS } from './catalog/kernel.events.js';
export { LOTTIE_EVENTS } from './catalog/lottie.events.js';
export { ANALYTICS_EVENTS, ANALYTICS_INTENTS } from './catalog/analytics.events.js';
export { CARD_EVENTS, CARD_INTENTS } from './catalog/card.events.js';
export { COMPONENT_EVENTS, COMPONENT_INTENTS } from './catalog/component.events.js';
export { DEVICE_EVENTS, DEVICE_INTENTS } from './catalog/device.events.js';
export { FOOTER_EVENTS, FOOTER_INTENTS } from './catalog/footer.events.js';
export { HEADER_EVENTS, HEADER_INTENTS } from './catalog/header.events.js';
export { LAYOUT_EVENTS, LAYOUT_INTENTS } from './catalog/layout.events.js';
export { LIFECYCLE_EVENTS, LIFECYCLE_INTENTS } from './catalog/lifecycle.events.js';
export { NAVRAIL_EVENTS, NAVRAIL_INTENTS } from './catalog/navrail.events.js';
export { OVERLAY_EVENTS, OVERLAY_INTENTS } from './catalog/overlay.events.js';
export { SAVED_VIEWS_EVENTS, SAVED_VIEWS_INTENTS } from './catalog/saved-views.events.js';
export { TICKER_EVENTS, TICKER_INTENTS } from './catalog/ticker.events.js';
export { ACCESSIBILITY_EVENTS, ACCESSIBILITY_INTENTS, ANNOUNCE_PRIORITY } from './catalog/accessibility.events.js';
export { PREFERENCES_EVENTS, PREFERENCES_INTENTS, DENSITY_VALUES } from './catalog/preferences.events.js';
export { SESSION_ADMIN_EVENTS } from './catalog/session-admin.events.js';
export { UARPS_EVENTS } from './catalog/uarps.events.js';
export { SETTINGS_EVENTS } from './catalog/settings.events.js';
export { GOVERNANCE_EVENTS, GOVERNANCE_INTENTS, VIOLATION_TO_EVENT, GOVERNANCE_THRESHOLDS, getViolationEvent, isSeverityCritical } from './catalog/governance.events.js';
export { AUTH_PAYLOADS } from './payloads/auth.payloads.js';
export { ROUTER_PAYLOADS } from './payloads/router.payloads.js';
export { SESSION_PAYLOADS } from './payloads/session.payloads.js';
export { PANEL_PAYLOADS } from './payloads/panels.payloads.js';
export { PERMISSIONS_PAYLOADS } from './payloads/permissions.payloads.js';
export { SECURITY_PAYLOADS } from './payloads/security.payloads.js';
export { UI_PAYLOADS } from './payloads/ui.payloads.js';
export { TELEMETRY_PAYLOADS } from './payloads/telemetry.payloads.js';
export { ORCHESTRATOR_PAYLOADS } from './payloads/orchestrator.payloads.js';
export { SYSTEM_PAYLOADS } from './payloads/system.payloads.js';
export { GOVERNANCE_PAYLOADS, isValidViolationPayload, isValidAlertPayload, createViolationPayload } from './payloads/governance.payloads.js';
export { validatePayload, createPayload, isValidEvent, resolveLegacyEvent } from './validate.js';

// P1 ENTERPRISE: Listeners Registry for auditability
export {
  registerListener,
  unregisterListener,
  getListeners,
  getListenersByEvent,
  getListenersByModule,
  getListenerStats,
  auditListeners
} from './listeners-registry.js';
