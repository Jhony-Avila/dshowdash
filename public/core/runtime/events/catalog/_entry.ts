// Migrado para TypeScript: 2026-02-25
'use strict';
// ═══════════════════════════════════════════════════════════════
// Events Catalog Barrel — Lote 11 (AUDIT COMPLETO v2)
// Cherry-picks all named exports needed by existing bundles.
// VERSION and MODULE_ID are excluded (metadata, not imported by bundles).
// @changelog v2 — Added CORE_EVENTS, CORE_INTENTS, DEGRADATION_EVENTS
// ═══════════════════════════════════════════════════════════════

export { ACCESSIBILITY_EVENTS, ACCESSIBILITY_INTENTS, ANNOUNCE_PRIORITY } from './accessibility.events.js';
export { ACTION_EVENTS, ACTION_INTENTS } from './action.events.js';
export { ANALYTICS_EVENTS, ANALYTICS_INTENTS } from './analytics.events.js';
export { API_EVENTS } from './api.events.js';
export { AUDIT_TRAIL_EVENTS } from './audit-trail.events.js';
export { CACHE_EVENTS, CACHE_INTENTS } from './cache.events.js';
export { CARD_EVENTS, CARD_INTENTS } from './card.events.js';
export { CAROUSEL_EVENTS } from './carousel.events.js';
export { CHARTS_EVENTS } from './charts.events.js';
export { COMMAND_EVENTS, COMMAND_INTENTS } from './command.events.js';
export { CONTAINER_EVENTS, CONTAINER_INTENTS } from './container.events.js';
export { DEVICE_EVENTS, DEVICE_INTENTS } from './device.events.js';
export { ERROR_BOUNDARY_EVENTS, ERROR_BOUNDARY_INTENTS } from './error-boundary.events.js';
export { EXTERNAL_EVENTS, EXTERNAL_INTENTS } from './external.events.js';
export { FOOTER_EVENTS, FOOTER_INTENTS } from './footer.events.js';
export { HEADER_EVENTS, HEADER_INTENTS } from './header.events.js';
export { KERNEL_RUNTIME_EVENTS, KERNEL_RUNTIME_INTENTS } from './kernel.events.js';
export { LOTTIE_EVENTS } from './lottie.events.js';
export { MAIN_EVENTS, MAIN_INTENTS } from './main.events.js';
export { MANIFEST_EVENTS, MANIFEST_INTENTS } from './manifest.events.js';
export { MF_EVENTS, MF_INTENTS } from './mf.events.js';
export { NAV_EVENTS, NAV_INTENTS } from './nav.events.js';
export { BRIDGE_FROM_ACCORDION, BRIDGE_TO_ACCORDION, NAVIGATION_EVENTS, NAVIGATION_INTENTS } from './navigation.events.js';
export { NAVRAIL_EVENTS, NAVRAIL_INTENTS } from './navrail.events.js';
export { NETWORK_EVENTS, NETWORK_INTENTS } from './network.events.js';
export { OVERLAY_EVENTS, OVERLAY_INTENTS } from './overlay.events.js';
export { PANEL_LOADER_EVENTS, PANEL_LOADER_INTENTS } from './panel-loader.events.js';
export { PANEL_16_UI_EVENTS, PANEL_EVENTS, PANEL_INTENTS } from './panels.events.js';
export { PERFORMANCE_EVENTS, PERFORMANCE_INTENTS } from './performance.events.js';
export { PERSISTENCE_EVENTS, PERSISTENCE_INTENTS } from './persistence.events.js';
export { PLUGIN_EVENTS, PLUGIN_INTENTS } from './plugin.events.js';
export { DENSITY_VALUES, PREFERENCES_EVENTS, PREFERENCES_INTENTS } from './preferences.events.js';
export { SAVED_VIEWS_EVENTS, SAVED_VIEWS_INTENTS } from './saved-views.events.js';
export { SESSION_ADMIN_EVENTS } from './session-admin.events.js';
export { SETTINGS_EVENTS } from './settings.events.js';
export { ACCORDION_EVENTS, ACCORDION_INTENTS, SIDEBAR_EVENTS, SIDEBAR_INTENTS } from './sidebar.events.js';
export { SW_EVENTS, SW_INTENTS } from './sw.events.js';
export { TABLE_EVENTS, TABLE_INTENTS } from './table.events.js';
export { THEME_EVENTS, THEME_INTENTS } from './theme.events.js';
export { TICKER_EVENTS, TICKER_INTENTS } from './ticker.events.js';
export { UARPS_EVENTS } from './uarps.events.js';

export { GOVERNANCE_EVENTS, GOVERNANCE_INTENTS, VIOLATION_TO_EVENT, GOVERNANCE_THRESHOLDS, getViolationEvent } from './governance.events.js';

// ═══ Re-exports from proxy files (originally export * from runtime.bundle.js) ═══

export { APP_EVENTS } from './app.events.js';
export { ASSET_EVENTS } from './asset.events.js';
export { AUTH_EVENTS, AUTH_INTENTS, AUTH_STATES } from './auth.events.js';
export { BOOT_EVENTS } from './boot.events.js';
export { COMPONENT_EVENTS, COMPONENT_INTENTS } from './component.events.js';
export { CORE_EVENTS, CORE_INTENTS } from './core.events.js';
export { DEGRADATION_EVENTS } from './degradation.events.js';
export { ERROR_EVENTS } from './error.events.js';
export { FEATURE_FLAGS_EVENTS } from './feature-flags.events.js';
export { LAYOUT_EVENTS, LAYOUT_INTENTS } from './layout.events.js';
export { LIFECYCLE_EVENTS } from './lifecycle.events.js';
export { LOG_EVENTS } from './log.events.js';
export { ORCHESTRATOR_EVENTS } from './orchestrator.events.js';
export { PERMISSIONS_EVENTS } from './permissions.events.js';
export { PRELOADER_EVENTS } from './preloader.events.js';
export { ROUTER_EVENTS } from './router.events.js';
export { SECURITY_EVENTS } from './security.events.js';
export { SESSION_EVENTS } from './session.events.js';
export { SHELL_EVENTS } from './shell.events.js';
export { CONTEXT_EVENTS, GLOBAL_STATE_EVENTS, STATE_EVENTS, validateEventContracts } from './state.events.js';
export { SYSTEM_EVENTS } from './system.events.js';
export { TELEMETRY_EVENTS, TELEMETRY_INTENTS } from './telemetry.events.js';
export { UI_EVENTS, UI_INTENTS } from './ui.events.js';
