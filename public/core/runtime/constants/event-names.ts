// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.constants.event-names
// PURPOSE: Centraliza todas as strings de eventos do sistema
// ───────────────────────────────────────────────────────────────
// PROVIDES: RUNTIME_CONTEXT_EVENT_NAMES, KERNEL_EVENT_NAMES, AUTH_EVENT_NAMES, etc.
// @changelog v3.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v3.1.0-ITEM-E: TOOLBAR: FROZEN, UNFROZEN, WIRING_COMPLETE
// @changelog v3.0.0-ITEM-E: TOOLBAR, LAYOUT, PANEL, FOOTER, APP_SHELL
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.9.0-STRICT-MODE' as const;
export const MODULE_ID = 'core.runtime.constants.event-names' as const;

/**
 * RUNTIME_CONTEXT_EVENTS
 * Eventos emitidos pelo RuntimeContext
 */
export const RUNTIME_CONTEXT_EVENT_NAMES = {
  READY: 'kernel.runtime-context.ready',
  UPDATED: 'kernel.runtime-context.updated'
} as const;
export type RuntimeContextEventName = typeof RUNTIME_CONTEXT_EVENT_NAMES[keyof typeof RUNTIME_CONTEXT_EVENT_NAMES];

/**
 * KERNEL_EVENT_NAMES
 * Eventos do Application Kernel (bootstrap-v2)
 */
export const KERNEL_EVENT_NAMES = {
  INITIALIZED: 'kernel.initialized',
  READY: 'kernel.ready',
  SHUTDOWN: 'kernel.shutdown',
  MODE_CHANGE: 'kernel.mode.change',
  MODE_DEGRADED: 'kernel.mode.degraded',
  MODE_RECOVERY: 'kernel.mode.recovery',
  MODE_NORMAL: 'kernel.mode.normal',
  MODE_MAINTENANCE: 'kernel.mode.maintenance',
  MODE_FAILED: 'kernel.mode.failed',
  CAPABILITY_ENABLED: 'kernel.capability.enabled',
  CAPABILITY_DISABLED: 'kernel.capability.disabled',
  CAPABILITY_CHANGE: 'kernel.capability.change',
  HEALTH_UPDATE: 'kernel.health.update',
  HEALTH_DEGRADED: 'kernel.health.degraded',
  HEALTH_RECOVERED: 'kernel.health.recovered',
  STATE_CHANGE: 'kernel.state.change',
  CONTEXT_UPDATE: 'kernel.context.update'
} as const;
export type KernelEventName = typeof KERNEL_EVENT_NAMES[keyof typeof KERNEL_EVENT_NAMES];

/**
 * KERNEL_UI_EVENT_NAMES
 * Eventos do Kernel UI (adaptive-kernel, state-machine, error-handler)
 */
export const KERNEL_UI_EVENT_NAMES = {
  INITIALIZED: 'kernel:initialized',
  STARTED: 'kernel:started',
  PAUSED: 'kernel:paused',
  RESUMED: 'kernel:resumed',
  RESETTING: 'kernel:resetting',
  RESET: 'kernel:reset',
  RECOVERING: 'kernel:recovering',
  RECOVERED: 'kernel:recovered',
  DESTROYED: 'kernel:destroyed',
  STATE_CHANGED: 'kernel:state-changed',
  ERROR: 'kernel:error',
  CLEANUP: 'kernel:cleanup',
  CAPABILITY_DENIED: 'kernel:capability-denied',
  MODE_CHANGE: 'kernel:mode-change'
} as const;
export type KernelUiEventName = typeof KERNEL_UI_EVENT_NAMES[keyof typeof KERNEL_UI_EVENT_NAMES];

/**
 * AUTH_EVENT_NAMES
 * Eventos de autenticação
 */
export const AUTH_EVENT_NAMES = {
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_REQUEST: 'auth.login.request',
  LOGOUT: 'auth.logout',
  LOGOUT_SUCCESS: 'auth.logout.success',
  SESSION_STARTED: 'auth.session.started',
  SESSION_CHECKED: 'auth.session.checked',
  SESSION_EXPIRED: 'auth.session.expired',
  STATE_CHANGED: 'auth.state.changed',
  READY: 'auth.ready'
} as const;
export type AuthEventName = typeof AUTH_EVENT_NAMES[keyof typeof AUTH_EVENT_NAMES];

/**
 * HEADER_EVENT_NAMES
 * Eventos do Header (API pública)
 */
export const HEADER_EVENT_NAMES = {
  REFRESH: 'header.refresh',
  REFRESH_REQUEST: 'header.refresh.request',
  SHOW_REQUEST: 'header.show.request',
  HIDE_REQUEST: 'header.hide.request',
  RUNTIME_CONTEXT_UPDATED: 'header:runtime-context-updated'
} as const;
export type HeaderEventName = typeof HEADER_EVENT_NAMES[keyof typeof HEADER_EVENT_NAMES];

/**
 * HEADER_INTERNAL_EVENT_NAMES
 * Eventos internos do Header (bootstrap, circuit-breaker, etc.)
 * v3.0.0: Adicionado FEATURE_REACTIVATED
 */
export const HEADER_INTERNAL_EVENT_NAMES = {
  BOOTSTRAP_COMPLETE: 'header:bootstrap:complete',
  CORE_STATE_CHANGE: 'header:core:state-change',
  ROUTE_CHANGED: 'header:route:changed',
  FEATURE_DEGRADED: 'header:feature:degraded',
  FEATURE_REACTIVATED: 'header:feature:reactivated',
  FEATURE_FLAG_CHANGED: 'header:feature-flag:changed',
  CIRCUIT_BREAKER_STATE: 'header:circuit-breaker:state-change',
  COMPONENT_PERMANENT_FAILURE: 'header:component:permanent-failure',
  HEALTH: 'header:health:',
  CACHE: 'header:cache:',
  LAZY_LOADER: 'header:lazy-loader:',
  PLUGIN: 'header:plugin:',
  PLUGIN_SYSTEM: 'header:plugin-system:',
  SHELL: 'header:shell:',
  SW: 'header:sw:',
  RETRY_ATTEMPT: 'header:retry:attempt',
  LOGO_CLICK: 'logo:click'
} as const;
export type HeaderInternalEventName = typeof HEADER_INTERNAL_EVENT_NAMES[keyof typeof HEADER_INTERNAL_EVENT_NAMES];

/**
 * OVERLAY_EVENT_NAMES
 * Eventos do OverlayLayer
 * v3.0.0: Adicionado AUTO_CLEANED
 */
export const OVERLAY_EVENT_NAMES = {
  KERNEL_READY: 'overlay-kernel.ready',
  KERNEL_SHUTDOWN: 'overlay-kernel.shutdown',
  INTEGRATION_READY: 'overlay-kernel.integration-ready',
  RUNTIME_CONTEXT_UPDATED: 'overlay-kernel:runtime-context-updated',
  MODE_CHANGE: 'overlay:mode-change',
  AUTO_CLEANED: 'overlay:auto-cleaned'
} as const;
export type OverlayEventName = typeof OVERLAY_EVENT_NAMES[keyof typeof OVERLAY_EVENT_NAMES];

/**
 * COMPONENT_EVENT_NAMES
 * Eventos genéricos de componentes
 */
export const COMPONENT_EVENT_NAMES = {
  MOUNTED: 'component.mounted',
  READY: 'component.ready',
  ERROR: 'component.error',
  DESTROYED: 'component.destroyed'
} as const;
export type ComponentEventName = typeof COMPONENT_EVENT_NAMES[keyof typeof COMPONENT_EVENT_NAMES];

/**
 * NAVIGATION_EVENT_NAMES
 * Eventos de navegação
 */
export const NAVIGATION_EVENT_NAMES = {
  INTENT: 'nav.intent',
  INTENT_RESOLVED: 'nav.intent.resolved',
  NAVIGATE_START: 'nav.navigate.start',
  NAVIGATE_SUCCESS: 'nav.navigate.success',
  NAVIGATE_ERROR: 'nav.navigate.error',
  NAVIGATE_BLOCKED: 'nav.navigate.blocked',
  NAVIGATE_PATH: 'nav.navigate.path'
} as const;
export type NavigationEventName = typeof NAVIGATION_EVENT_NAMES[keyof typeof NAVIGATION_EVENT_NAMES];

/**
 * BOOTSTRAP_EVENT_NAMES
 * Eventos do bootstrap-integration (container-main)
 */
export const BOOTSTRAP_EVENT_NAMES = {
  STARTING: 'bootstrap:starting',
  READY: 'bootstrap:ready',
  ERROR: 'bootstrap:error',
  STATE_CHANGED: 'bootstrap:state-changed',
  PAUSED: 'bootstrap:paused',
  RESUMED: 'bootstrap:resumed',
  SHUTTING_DOWN: 'bootstrap:shutting-down',
  SHUTDOWN: 'bootstrap:shutdown',
  REBOOTING: 'bootstrap:rebooting',
  REBOOTED: 'bootstrap:rebooted',
  MEMORY_WARNING: 'bootstrap:memory-warning',
  MEMORY_CRITICAL: 'bootstrap:memory-critical',
  PERFORMANCE_CRITICAL: 'bootstrap:performance-critical',
  GLOBAL_ERROR: 'bootstrap:global-error',
  FALLBACK_EXHAUSTED: 'bootstrap:fallback-exhausted'
} as const;
export type BootstrapEventName = typeof BOOTSTRAP_EVENT_NAMES[keyof typeof BOOTSTRAP_EVENT_NAMES];

/**
 * RESOURCE_EVENT_NAMES
 * Eventos do resource-manager
 */
export const RESOURCE_EVENT_NAMES = {
  REGISTERED: 'resource:registered',
  UNREGISTERED: 'resource:unregistered',
  PANEL_REGISTERED: 'resource:panel-registered',
  PANEL_UNREGISTERED: 'resource:panel-unregistered',
  PANEL_THROTTLED: 'resource:panel-throttled',
  PANEL_UNTHROTTLED: 'resource:panel-unthrottled',
  PANEL_PAUSED: 'resource:panel-paused',
  PANEL_RESUMED: 'resource:panel-resumed',
  PANEL_CLEANUP: 'resource:panel-cleanup',
  PANEL_LIMITS_UPDATED: 'resource:panel-limits-updated',
  PANEL_LIMIT_EXCEEDED: 'resource:panel-limit-exceeded',
  TYPE_PAUSED: 'resource:type-paused',
  TYPE_RESUMED: 'resource:type-resumed',
  TYPE_CLEANUP: 'resource:type-cleanup',
  MEMORY_WARNING: 'resource:memory-warning',
  MEMORY_CRITICAL: 'resource:memory-critical',
  CLEANUP_COMPLETE: 'resource:cleanup-complete',
  ALL_PAUSED: 'resource:all-paused',
  ALL_RESUMED: 'resource:all-resumed',
  ALL_DISPOSED: 'resource:all-disposed',
  MANAGER_STARTED: 'resource-manager:started',
  MANAGER_STOPPED: 'resource-manager:stopped',
  MANAGER_DESTROYED: 'resource-manager:destroyed'
} as const;
export type ResourceEventName = typeof RESOURCE_EVENT_NAMES[keyof typeof RESOURCE_EVENT_NAMES];

/**
 * LAYOUT_EVENT_NAMES
 * Eventos do layout-manager
 * v3.0.0: Adicionado CHANGE (layout.change do toolbar-wiring)
 */
export const LAYOUT_EVENT_NAMES = {
  CHANGE: 'layout.change',
  RESIZED: 'layout:resized',
  STATE_CHANGED: 'layout:state-changed',
  SPLIT: 'layout:split',
  UNSPLIT: 'layout:unsplit',
  DOCKED: 'layout:docked',
  UNDOCKED: 'layout:undocked',
  MOVED: 'layout:moved',
  RESTORED: 'layout:restored',
  FULLSCREEN_ENTER: 'layout:fullscreen-enter',
  FULLSCREEN_EXIT: 'layout:fullscreen-exit',
  PANEL_REGISTERED: 'layout:panel-registered',
  PANEL_UNREGISTERED: 'layout:panel-unregistered',
  CONSTRAINTS_UPDATED: 'layout:constraints-updated',
  MANAGER_INITIALIZED: 'layout-manager:initialized',
  MANAGER_DESTROYED: 'layout-manager:destroyed'
} as const;
export type LayoutEventName = typeof LAYOUT_EVENT_NAMES[keyof typeof LAYOUT_EVENT_NAMES];

/**
 * CAPABILITY_EVENT_NAMES
 * Eventos do capability-manager
 */
export const CAPABILITY_EVENT_NAMES = {
  REQUEST: 'capability:request',
  GRANTED: 'capability:granted',
  DENIED: 'capability:denied',
  REVOKED: 'capability:revoked',
  PANEL_REGISTERED: 'capability:panel-registered',
  PANEL_UNREGISTERED: 'capability:panel-unregistered',
  PLATFORM_CONFIG_CHANGED: 'capability:platform-config-changed',
  MANAGER_DESTROYED: 'capability-manager:destroyed'
} as const;
export type CapabilityEventName = typeof CAPABILITY_EVENT_NAMES[keyof typeof CAPABILITY_EVENT_NAMES];

/**
 * ERROR_EVENT_NAMES
 * Eventos do error-boundary
 */
export const ERROR_EVENT_NAMES = {
  UNHANDLED: 'error:unhandled',
  REJECTION: 'error:rejection',
  LOGGED: 'error:logged',
  RECOVERED: 'error:recovered',
  BOUNDARY_ERROR: 'error-boundary:error'
} as const;
export type ErrorEventName = typeof ERROR_EVENT_NAMES[keyof typeof ERROR_EVENT_NAMES];

/**
 * SNAPSHOT_EVENT_NAMES
 * Eventos do snapshot system
 */
export const SNAPSHOT_EVENT_NAMES = {
  CREATED: 'snapshot:created',
  DELETED: 'snapshot:deleted',
  CLEARED: 'snapshot:cleared',
  RESTORE_REQUESTED: 'snapshot:restore-requested'
} as const;
export type SnapshotEventName = typeof SNAPSHOT_EVENT_NAMES[keyof typeof SNAPSHOT_EVENT_NAMES];

/**
 * LISTENER_TRACKER_EVENT_NAMES
 * Eventos do listener-tracker
 */
export const LISTENER_TRACKER_EVENT_NAMES = {
  PANEL_REGISTERED: 'listener-tracker:panel-registered',
  PANEL_UNREGISTERED: 'listener-tracker:panel-unregistered',
  PANEL_CLEANUP: 'listener-tracker:panel-cleanup',
  LIMITS_UPDATED: 'listener-tracker:limits-updated',
  LIMIT_EXCEEDED: 'listener-tracker:limit-exceeded',
  LEAKS_DETECTED: 'listener-tracker:leaks-detected',
  WARNING: 'listener-tracker:warning',
  DESTROYED: 'listener-tracker:destroyed'
} as const;
export type ListenerTrackerEventName = typeof LISTENER_TRACKER_EVENT_NAMES[keyof typeof LISTENER_TRACKER_EVENT_NAMES];

/**
 * PLUGIN_EVENT_NAMES
 * Eventos do plugin system
 */
export const PLUGIN_EVENT_NAMES = {
  REGISTERED: 'plugin:registered',
  UNREGISTERED: 'plugin:unregistered',
  INITIALIZED: 'plugin:initialized',
  DISABLED: 'plugin:disabled'
} as const;
export type PluginEventName = typeof PLUGIN_EVENT_NAMES[keyof typeof PLUGIN_EVENT_NAMES];

/**
 * TELEMETRY_EVENT_NAMES
 * Eventos de telemetria
 */
export const TELEMETRY_EVENT_NAMES = {
  TRACK: 'telemetry:track',
  FLUSH: 'telemetry:flush',
  ENTRY: 'logger:entry'
} as const;
export type TelemetryEventName = typeof TELEMETRY_EVENT_NAMES[keyof typeof TELEMETRY_EVENT_NAMES];

/**
 * SESSION_EVENT_NAMES
 * Eventos do session-sync
 */
export const SESSION_EVENT_NAMES = {
  PREFIX: 'session-sync:'
} as const;
export type SessionEventName = typeof SESSION_EVENT_NAMES[keyof typeof SESSION_EVENT_NAMES];

/**
 * TOOLBAR_EVENT_NAMES
 * Eventos do features-toolbar (container-main)
 * v3.0.0: Novo grupo
 * v3.1.0: Adicionados FROZEN, UNFROZEN, WIRING_COMPLETE
 */
export const TOOLBAR_EVENT_NAMES = {
  INITIALIZING: 'toolbar.initializing',
  INITIALIZED: 'toolbar.initialized',
  DESTROYED: 'toolbar.destroyed',
  RECOVERED: 'toolbar.recovered',
  REWIRED: 'toolbar.rewired',
  FROZEN: 'toolbar.frozen',
  UNFROZEN: 'toolbar.unfrozen',
  GROUP_ADDED: 'toolbar.group.added',
  GROUP_REMOVED: 'toolbar.group.removed',
  WIRING_COMPLETE: 'toolbar.wiring.complete'
} as const;
export type ToolbarEventName = typeof TOOLBAR_EVENT_NAMES[keyof typeof TOOLBAR_EVENT_NAMES];

/**
 * PANEL_EVENT_NAMES
 * Eventos de painéis (refresh, lifecycle)
 * v3.0.0: Novo grupo
 */
export const PANEL_EVENT_NAMES = {
  REFRESH: 'panel.refresh',
  REFRESH_REQUEST: 'panel.refresh.request'
} as const;
export type PanelEventName = typeof PANEL_EVENT_NAMES[keyof typeof PANEL_EVENT_NAMES];

/**
 * FOOTER_EVENT_NAMES
 * Eventos do Footer
 * v3.0.0: Novo grupo
 */
export const FOOTER_EVENT_NAMES = {
  SHOWN: 'footer:shown',
  HIDDEN: 'footer:hidden'
} as const;
export type FooterEventName = typeof FOOTER_EVENT_NAMES[keyof typeof FOOTER_EVENT_NAMES];

/**
 * APP_SHELL_EVENT_NAMES
 * Eventos do App Shell
 * v3.0.0: Novo grupo (prefixo dinâmico para health)
 */
export const APP_SHELL_EVENT_NAMES = {
  HEALTH_PREFIX: 'app-shell:health:'
} as const;
export type AppShellEventName = typeof APP_SHELL_EVENT_NAMES[keyof typeof APP_SHELL_EVENT_NAMES];

/**
 * ALL_EVENT_NAMES
 * Agregado de todos os eventos para debug
 */
export const ALL_EVENT_NAMES = {
  ...RUNTIME_CONTEXT_EVENT_NAMES,
  ...KERNEL_EVENT_NAMES,
  ...KERNEL_UI_EVENT_NAMES,
  ...AUTH_EVENT_NAMES,
  ...HEADER_EVENT_NAMES,
  ...HEADER_INTERNAL_EVENT_NAMES,
  ...OVERLAY_EVENT_NAMES,
  ...COMPONENT_EVENT_NAMES,
  ...NAVIGATION_EVENT_NAMES,
  ...BOOTSTRAP_EVENT_NAMES,
  ...RESOURCE_EVENT_NAMES,
  ...LAYOUT_EVENT_NAMES,
  ...CAPABILITY_EVENT_NAMES,
  ...ERROR_EVENT_NAMES,
  ...SNAPSHOT_EVENT_NAMES,
  ...LISTENER_TRACKER_EVENT_NAMES,
  ...PLUGIN_EVENT_NAMES,
  ...TELEMETRY_EVENT_NAMES,
  ...TOOLBAR_EVENT_NAMES,
  ...PANEL_EVENT_NAMES,
  ...FOOTER_EVENT_NAMES,
  ...APP_SHELL_EVENT_NAMES
} as const;
export type AllEventName = typeof ALL_EVENT_NAMES[keyof typeof ALL_EVENT_NAMES];

export default {
  RUNTIME_CONTEXT: RUNTIME_CONTEXT_EVENT_NAMES,
  KERNEL: KERNEL_EVENT_NAMES,
  KERNEL_UI: KERNEL_UI_EVENT_NAMES,
  AUTH: AUTH_EVENT_NAMES,
  HEADER: HEADER_EVENT_NAMES,
  HEADER_INTERNAL: HEADER_INTERNAL_EVENT_NAMES,
  OVERLAY: OVERLAY_EVENT_NAMES,
  COMPONENT: COMPONENT_EVENT_NAMES,
  NAVIGATION: NAVIGATION_EVENT_NAMES,
  BOOTSTRAP: BOOTSTRAP_EVENT_NAMES,
  RESOURCE: RESOURCE_EVENT_NAMES,
  LAYOUT: LAYOUT_EVENT_NAMES,
  CAPABILITY: CAPABILITY_EVENT_NAMES,
  ERROR: ERROR_EVENT_NAMES,
  SNAPSHOT: SNAPSHOT_EVENT_NAMES,
  LISTENER_TRACKER: LISTENER_TRACKER_EVENT_NAMES,
  PLUGIN: PLUGIN_EVENT_NAMES,
  TELEMETRY: TELEMETRY_EVENT_NAMES,
  TOOLBAR: TOOLBAR_EVENT_NAMES,
  PANEL: PANEL_EVENT_NAMES,
  FOOTER: FOOTER_EVENT_NAMES,
  APP_SHELL: APP_SHELL_EVENT_NAMES,
  ALL: ALL_EVENT_NAMES
};
