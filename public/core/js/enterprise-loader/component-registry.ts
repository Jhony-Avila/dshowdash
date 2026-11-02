// @upgrade v*.*.*-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// EnterpriseLoader - Component Registry
// DEPENDENCY CONTRACT — Core js module
// @version 8.3.0-NO-LAYOUT-MANAGER
// @changelog v8.3.0-NO-LAYOUT-MANAGER - Removed LayoutManager (now handled by phase-3-shell)
// @changelog v8.2.0-ENTERPRISE - ES6 modernization (const/let, arrow functions)
'use strict';

export const MODULE_ID = 'enterprise-loader-component-registry';
export const VERSION = '8.3.0-NO-LAYOUT-MANAGER';

export interface ComponentRegistryEntry {
  readonly name: string;
  readonly path: string;
  readonly critical: boolean;
  readonly initOptions: Readonly<Record<string, unknown>>;
}

export const COMPONENT_REGISTRY = Object.freeze([
  { name: 'ErrorBoundary', path: '/components/error-boundary/index.js', critical: true, initOptions: { ignoredMessages: ['ResizeObserver loop'], ignoredTypes: [] } },
  { name: 'CacheManager', path: '/components/cache-manager/index.js', critical: true, initOptions: { maxSize: 500, defaultTTL: 300000, policy: 'lru', cleanupInterval: 60000 } },
  { name: 'NetworkMonitor', path: '/components/network-monitor/index.js', critical: true, initOptions: { healthCheckInterval: 30000, healthCheckUrl: '/api/health' } },
  { name: 'ContextProvider', path: '/components/context-provider/index.js', critical: false, initOptions: {} },
  { name: 'SessionManager', path: '/components/session-manager/index.js', critical: false, initOptions: { sessionTimeout: 3600000, renewThreshold: 300000, persistSession: true, checkOnInit: true } },
  { name: 'PermissionsGuard', path: '/components/permissions-guard/index.js', critical: false, initOptions: { defaultRole: 'viewer', cachePermissions: true } },
  { name: 'ThemeTokensLoader', path: '/assets/js/core/theme-tokens-loader/index.js', critical: false, initOptions: {} },
  { name: 'ThemeManager', path: '/assets/js/core/theme-manager/index.js', critical: false, initOptions: { defaultTheme: 'dark', persistTheme: true, followSystem: true } },
  // LayoutManager REMOVED - Now initialized by phase-3-shell to avoid duplicate initialization
  { name: 'AccessibilityManager', path: '/components/accessibility-manager/index.js', critical: false, initOptions: { followSystem: true } },
  { name: 'OverlayLayer', path: '/components/overlay-layer/index.js', critical: false, initOptions: { baseZIndex: 1000, enableKeyboard: true } },
  { name: 'ModalManagerGlobal', path: '/components/modal-manager-global/index.js', critical: false, initOptions: { legacyAdapter: true } },
  { name: 'NotificationManager', path: '/components/notification-manager/index.js', critical: false, initOptions: { position: 'top-right', maxVisible: 5, enableSound: false, enableNative: false } },
  { name: 'AnalyticsManager', path: '/components/analytics-manager/index.js', critical: false, initOptions: { trackPageViews: true, trackInitialPageView: true, flushInterval: 60000 } },
  { name: 'PerformanceMonitor', path: '/components/performance-monitor/index.js', critical: false, initOptions: { monitorFPS: true, monitorLongTasks: true, collectionInterval: 30000 } },
  { name: 'FeatureFlags', path: '/components/feature-flags/index.js', critical: false, initOptions: { loadFromStorage: true, flags: { 'dark-mode': { enabled: true }, 'new-dashboard': { enabled: false, percentage: 50 }, 'advanced-analytics': { enabled: true } } } },
  { name: 'SWController', path: '/components/sw-controller/index.js', critical: false, initOptions: { autoRegister: false } },
  { name: 'Carousel', path: '/components/carousel/index.js', critical: false, initOptions: {} },
  { name: 'Charts', path: '/components/charts/index.js', critical: false, initOptions: {} },
  { name: 'Animacoes', path: '/components/animacoes/index.js', critical: false, initOptions: { preloadLottie: false } }
] as const);

export type ComponentRegistryType = typeof COMPONENT_REGISTRY;
export type ComponentName = ComponentRegistryType[number]['name'];

export const getCriticalComponents = (): ComponentRegistryType[number][] => COMPONENT_REGISTRY.filter((c) => c.critical);
export const getNonCriticalComponents = (): ComponentRegistryType[number][] => COMPONENT_REGISTRY.filter((c) => !c.critical);
export const getComponentByName = (name: string): ComponentRegistryType[number] | null => COMPONENT_REGISTRY.find((c) => c.name === name) || null;

export const info = (): { moduleId: string; version: string } => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = (): { status: string; moduleId: string; version: string; componentsCount: number } => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, componentsCount: COMPONENT_REGISTRY.length });

export default COMPONENT_REGISTRY;
