// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-EVENTS)
// ═══════════════════════════════════════════════════════════════
// MODULE: health-registry
// PURPOSE: Health Aggregator - Registry v1.3.0-EVENTS
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   * as StrictMode from /core/runtime/enterprise/strict-mode.js
//   * as GovernanceBridge from /core/runtime/enterprise/governance-telemetry-bridge.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CORE_MODULES — exported value
//   COMPONENT_MODULES — exported value
//   PANEL_MODULES — exported value
//   CATEGORIES — exported value
//   CRITICAL_MODULES — exported value
//   getVersion() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).PanelAuditTrail
//   (window as any).PanelCards
//   (window as any).PanelDashboard
//   (window as any).PanelFeatureFlagsAdmin
//   (window as any).PanelNavAdmin
//   (window as any).PanelOrchestrator
//   (window as any).PanelPermissionsAdmin
//   (window as any).PanelSessionAdmin
//   (window as any).PanelUserManagement
//   (window as any).panelCards
// ═══════════════════════════════════════════════════════════════
'use strict';

import * as StrictMode from '/core/runtime/enterprise/strict-mode.js';
import * as GovernanceBridge from '/core/runtime/enterprise/governance-telemetry-bridge.js';

export var VERSION = '1.3.0-EVENTS';
export var MODULE_ID = 'health-registry';

export var CORE_MODULES = {
  'EventBus': 'EventBus',
  'StateManager': 'StateManager',
  'Telemetry': 'Telemetry',
  'GlobalState': 'GlobalState',
  'Logger': 'Logger',
  'LoggerGlobal': 'LoggerGlobal',
  'Environment': 'Environment',
  'Config': 'Config',
  'RouterGlobal': 'RouterGlobal',
  'AppBootstrap': 'AppBootstrap',
  'AssetLoader': 'AssetLoader',
  'ModalManager': 'ModalManager',
  'EnterpriseStrictMode': function() { return StrictMode; },  // v1.2.0: Governance
  'GovernanceTelemetryBridge': function() { return GovernanceBridge; }  // v1.3.0: Events
};

export var COMPONENT_MODULES = {
  'AppShell': 'AppShell',
  'Header': 'Header',
  'Footer': 'Footer',
  'Sidebar': 'Sidebar',
  'NavRail': 'NavRail',
  'Main': 'Main',
  'Preloader': 'Preloader',
  'LoginModal': 'LoginModal',
  'SessionManager': 'SessionManager',
  'PermissionsGuard': 'PermissionsGuard',
  'ContextProvider': 'ContextProvider',
  'ThemeManager': 'ThemeManager',
  'LayoutManager': 'LayoutManager',
  'CacheManager': 'CacheManager',
  'ErrorBoundary': 'ErrorBoundary',
  'FeatureFlags': 'FeatureFlags',
  'NetworkMonitor': 'NetworkMonitor',
  'PerformanceMonitor': 'PerformanceMonitor',
  'SecurityPoliciesManager': 'SecurityPoliciesManager',
  'NotificationManager': 'NotificationManager',
  'OverlayLayer': 'OverlayLayer',
  'AnalyticsManager': 'AnalyticsManager'
};

export var PANEL_MODULES = {
  'PanelCards': function() { return (window as any).PanelCards || (window as any).panelCards; },
  'PanelOrchestrator': function() { return (window as any).PanelOrchestrator; },
  'PanelDashboard': function() { return (window as any).PanelDashboard; },
  'PanelUserManagement': function() { return (window as any).PanelUserManagement; },
  'PanelPermissionsAdmin': function() { return (window as any).PanelPermissionsAdmin; },
  'PanelSessionAdmin': function() { return (window as any).PanelSessionAdmin; },
  'PanelAuditTrail': function() { return (window as any).PanelAuditTrail; },
  'PanelFeatureFlagsAdmin': function() { return (window as any).PanelFeatureFlagsAdmin; },
  'PanelNavAdmin': function() { return (window as any).PanelNavAdmin; }
};

export var CATEGORIES = {
  core: { label: 'Core Infrastructure', icon: 'cpu', priority: 1 },
  components: { label: 'Components', icon: 'layers', priority: 2 },
  panels: { label: 'Panels', icon: 'grid', priority: 3 }
};

export var CRITICAL_MODULES = ['EventBus', 'StateManager', 'Logger', 'RouterGlobal', 'AppShell', 'SessionManager', 'EnterpriseStrictMode', 'GovernanceTelemetryBridge'];

export function getVersion() { return VERSION; }

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, coreModulesCount: Object.keys(CORE_MODULES).length, componentModulesCount: Object.keys(COMPONENT_MODULES).length, panelModulesCount: Object.keys(PANEL_MODULES).length, criticalModulesCount: CRITICAL_MODULES.length };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { coreModulesReady: Object.keys(CORE_MODULES).length > 0, componentModulesReady: Object.keys(COMPONENT_MODULES).length > 0, categoriesReady: Object.keys(CATEGORIES).length > 0 } };
}

export default { VERSION: VERSION, MODULE_ID: MODULE_ID, CORE_MODULES: CORE_MODULES, COMPONENT_MODULES: COMPONENT_MODULES, PANEL_MODULES: PANEL_MODULES, CATEGORIES: CATEGORIES, CRITICAL_MODULES: CRITICAL_MODULES, getVersion: getVersion, info: info, healthCheck: healthCheck };
