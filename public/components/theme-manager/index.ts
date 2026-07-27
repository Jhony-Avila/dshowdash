// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.9.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.theme-manager
// PURPOSE: Theme management with system detection, persistence and orchestrator integration
// ───────────────────────────────────────────────────────────────
// @contract INIT - init(options) initializes theme manager
// @contract SHUTDOWN - shutdown() shuts down theme manager
// @contract RESET - reset() resets theme manager
// @contract SET_THEME - setTheme(theme) sets current theme
// @contract GET_THEME - getTheme() gets current theme
// @contract TOGGLE_THEME - toggleTheme() toggles between light/dark
// @contract SET_LIGHT - setLight() sets light theme
// @contract SET_DARK - setDark() sets dark theme
// @contract SET_AUTO - setAuto() sets auto theme
// @contract GET_SYSTEM_THEME - getSystemTheme() gets system preference
// @contract IS_SYSTEM_DARK - isSystemDark() checks if system prefers dark
// @contract WATCH_SYSTEM_THEME - watchSystemTheme(callback) watches system changes
// @contract GET_AVAILABLE_THEMES - getAvailableThemes() gets available themes
// @contract REGISTER_THEME - registerTheme(name, variables) registers custom theme
// @contract GET_VARIABLE - getVariable(name) gets CSS variable value
// @contract SET_VARIABLE - setVariable(name, value) sets CSS variable
// @contract SUBSCRIBE - subscribe(listener) subscribes to theme changes
// @contract STATUS - status() gets lifecycle status
// @contract IS_INITIALIZED - isInitialized() checks init state
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: THEME_EVENTS, ORCHESTRATOR_EVENTS from /core/runtime/events/index.js
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
// IMPORTS: themeStore from ./state/store.js
// IMPORTS: ThemeApplier from ./core/applier.js
// IMPORTS: ThemeDetector from ./core/detector.js
// IMPORTS: ThemeLifecycle from ./core/lifecycle.js
// IMPORTS: trackThemeEvent, getEventLog, getRecentEvents from ./telemetry/tracker.js
// IMPORTS: saveThemePreference, loadThemePreference, getSystemTheme, createThemeVariables from ./utils/helpers.js
// PROVIDES: ThemeManager, themeStore, ThemeApplier, ThemeDetector, ThemeLifecycle,
//           injectPorts, getPorts, getVersion, VERSION, MODULE_ID
// @changelog v1.9.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.8.1-ENTERPRISE-STRICT-MODE: Strict mode integration (window.ThemeManager blocked in strict mode, __dev always allowed)
// @changelog v1.8.0-ENTERPRISE: ES6 modernization (const/let, arrow functions, template literals, for...of)
// @changelog v1.7.1-ENTERPRISE: ES5 conversion (Object.values/entries → for loops)
// @changelog v1.7.0-P18EC: Migrated orchestrator:preset:applied to ORCHESTRATOR_EVENTS constant
// ═══════════════════════════════════════════════════════════════
'use strict';

import { THEME_EVENTS } from '/core/runtime/events/catalog/theme.events.js';
import { ORCHESTRATOR_EVENTS } from '/core/runtime/events/catalog/orchestrator.events.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { themeStore as _themeStore } from './state/store.js';
import { ThemeApplier as _ThemeApplier } from './core/applier.js';
import { ThemeDetector as _ThemeDetector } from './core/detector.js';

// @ts-expect-error TS migration - TS2614
import { ThemeLifecycle } from './core/lifecycle.js';

const themeStore = _themeStore as any;
const ThemeApplier = _ThemeApplier as any;
const ThemeDetector = _ThemeDetector as any;
import { trackThemeEvent, getEventLog, getRecentEvents } from './telemetry/tracker.js';
import { saveThemePreference, loadThemePreference, getSystemTheme, createThemeVariables } from './utils/helpers.js';

const VERSION = '1.9.0-P2-ENTERPRISE';
const MODULE_ID = 'theme-manager';

const hasWindow = typeof window !== 'undefined';

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const injectPorts = (p: unknown) => Ports.inject(p);
const getPorts = () => Ports.snapshot();

let orchestratorCleanups: Array<() => void> = [];
let globalStateCleanups: Array<() => void> = [];

const _metrics: { initCount: number; themeChangeCount: number; toggleCount: number; lastThemeChangeAt: number | null } = { initCount: 0, themeChangeCount: 0, toggleCount: 0, lastThemeChangeAt: null };

const setupGlobalStateIntegration = () => {
  const globalState = _getPort('globalState');
  if (!hasWindow || !globalState) return;
  const unsubscribeTheme = globalState.subscribe((theme: string) => {
    if (theme && theme !== themeStore.getCurrentTheme()) {
      ThemeApplier.apply(theme);
      trackThemeEvent('theme:global-state:synced', { theme });
    }
  }, 'preferences.theme');
  globalStateCleanups.push(unsubscribeTheme);
  const initialState = globalState.getState();
  if (initialState?.preferences?.theme) {
    ThemeApplier.apply(initialState.preferences.theme);
  }
  trackThemeEvent('theme:global-state:connected');
};

const cleanupGlobalStateIntegration = () => {
  globalStateCleanups.forEach((cleanup) => { if (typeof cleanup === 'function') cleanup(); });
  globalStateCleanups = [];
};

const setupOrchestratorIntegration = () => {
  const eventBus = _getPort('eventBus');
  if (!hasWindow || !eventBus) return;
  eventBus.on(ORCHESTRATOR_EVENTS.PRESET_APPLIED, (data: { theme?: string }) => {
    if (data?.theme) {
      ThemeApplier.apply(data.theme);
      trackThemeEvent('theme:orchestrator:preset-applied', { theme: data.theme });
    }
  });
  orchestratorCleanups.push(() => { const eb = _getPort('eventBus'); eb?.off?.(ORCHESTRATOR_EVENTS.PRESET_APPLIED); });
  const unsubscribe = themeStore.subscribe(({ action }: { action: string }) => {
    const eb = _getPort('eventBus');
    if (action === 'theme-changed') {
      eb?.emit?.(THEME_EVENTS.CHANGED, { theme: themeStore.getCurrentTheme(), timestamp: Date.now() });
    }
  });
  orchestratorCleanups.push(unsubscribe);
  trackThemeEvent('theme:orchestrator:connected');
};

const cleanupOrchestratorIntegration = () => {
  orchestratorCleanups.forEach((cleanup) => { if (typeof cleanup === 'function') cleanup(); });
  orchestratorCleanups = [];
};

const ThemeManager = {
  version: VERSION, name: MODULE_ID,
  init: (options = {}) => {
    trackThemeEvent('theme:api:init:called');
    _initPorts();
    return ThemeLifecycle.init(options).then((result: unknown) => {
      setupGlobalStateIntegration();
      setupOrchestratorIntegration();
      _metrics.initCount++;
      return result;
    });
  },
  shutdown: () => { trackThemeEvent('theme:api:shutdown:called'); cleanupGlobalStateIntegration(); cleanupOrchestratorIntegration(); return ThemeLifecycle.shutdown(); },
  reset: () => { trackThemeEvent('theme:api:reset:called'); return (ThemeLifecycle as any).reset ? (ThemeLifecycle as any).reset() : true; },
  setTheme: (theme: string) => {
    ThemeApplier.apply(theme);
    saveThemePreference(theme);
    const globalState = _getPort('globalState');
    if (hasWindow && globalState?.dispatch && globalState?.actions?.updatePreferences) {
      try { globalState.dispatch(globalState.actions.updatePreferences({ theme })); } catch(e) {}
    }
    trackThemeEvent('theme:set', { theme });
    _metrics.themeChangeCount++;
    _metrics.lastThemeChangeAt = Date.now();
  },
  getTheme: () => themeStore.getCurrentTheme(),
  toggleTheme: () => {
    const current = themeStore.getCurrentTheme();
    const newTheme = current === 'dark' ? 'light' : 'dark';
    ThemeManager.setTheme(newTheme);
    _metrics.toggleCount++;
    return newTheme;
  },
  setLight: () => ThemeManager.setTheme('light'),
  setDark: () => ThemeManager.setTheme('dark'),
  setAuto: () => ThemeManager.setTheme('auto'),
  getSystemTheme: () => ThemeDetector.getSystemTheme(),
  isSystemDark: () => ThemeDetector.isSystemDark(),
  watchSystemTheme: (callback: (theme: string) => void) => ThemeDetector.watch(callback),
  getAvailableThemes: () => themeStore.getAvailableThemes(),
  registerTheme: (name: string, variables: Record<string, string>) => themeStore.registerTheme(name, variables),
  getVariable: (name: string) => ThemeApplier.getVariable(name),
  setVariable: (name: string, value: string) => ThemeApplier.setVariable(name, value),
  subscribe: (listener: (state: unknown) => void) => themeStore.subscribe(listener),
  status: () => ThemeLifecycle.getStatus(),
  isInitialized: () => ThemeLifecycle.isInitialized(),
  getVersion: () => VERSION,
  injectPorts, getPorts,
  getMetrics: () => ({ ..._metrics }),
  resetMetrics: () => { for (const k of Object.keys(_metrics)) { (_metrics as Record<string, number | null>)[k] = typeof (_metrics as Record<string, unknown>)[k] === 'number' ? 0 : null; } },
  healthCheck: () => {
    const checks = { hasWindow, initialized: ThemeLifecycle.isInitialized(), hasThemeStore: !!themeStore, hasApplier: !!ThemeApplier, hasDetector: !!ThemeDetector, orchestratorConnected: orchestratorCleanups.length > 0, globalStateConnected: globalStateCleanups.length > 0, portsInitialized: Ports.isInitialized() };
    const issues = [];
    let passed = 0;
    for (const [key, value] of Object.entries(checks)) {
      if (value) passed++; else issues.push(key);
    }
    const total = Object.keys(checks).length;
    return { status: passed === total ? 'HEALTHY' : (passed >= 5 ? 'DEGRADED' : 'UNHEALTHY'), score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues, currentTheme: themeStore?.getCurrentTheme() || 'unknown', metrics: { ..._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
  },
  info: () => ({ name: MODULE_ID, version: VERSION, status: ThemeLifecycle.getStatus(), currentTheme: themeStore?.getCurrentTheme() || null, orchestratorConnected: orchestratorCleanups.length > 0, globalStateConnected: globalStateCleanups.length > 0, metrics: { ..._metrics }, portsInitialized: Ports.isInitialized(), healthCheck: ThemeManager.healthCheck() }),
  utils: { saveThemePreference, loadThemePreference, getSystemTheme, createThemeVariables },
  debug: { getEventLog, getRecentEvents, getStore: () => themeStore.toJSON() }
};

if (hasWindow) {
  const strictMode = isStrict();
  if (!strictMode) {
    (window as any).ThemeManager = ThemeManager;
    trackThemeEvent('theme:global:exposed');
  } else {
    recordViolation('THEME_MANAGER_STRICT_MODE_BLOCK', { module: MODULE_ID, action: 'window.ThemeManager exposure blocked' });
  }
  // DevTools sempre permitido
  window.__dev = window.__dev || {};
  window.__dev.themeManager = ThemeManager;
}

export default ThemeManager;
export { ThemeManager, themeStore, ThemeApplier, ThemeDetector, ThemeLifecycle, injectPorts, getPorts, VERSION, MODULE_ID };
export const getVersion = () => VERSION;
