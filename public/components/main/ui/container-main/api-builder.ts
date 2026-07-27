
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main-api-builder
// PURPOSE: Container-Main - API Builder
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LIFECYCLE_HOOKS from ./components/event-hooks.js
//   MODE from ./config.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   buildContainerApi() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   LIFECYCLE_HOOKS.BEFORE_UNMOUNT
//   hookName
// LISTENS (eventos):
//   hookName
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
// @version 8.3.0-STRICT-MODE
// @changelog v8.3.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v8.2.0-ENTERPRISE - Enterprise AAA audit compliance
'use strict';

import { LIFECYCLE_HOOKS } from './components/event-hooks.js';
import { MODE } from './config.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '8.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'container-main-api-builder';

// P2.1: DI-STRICT modules (all migrated components with injectEventBus)
const DI_STRICT_MODULES = [
  'controls', 'pluginSystem', 'configPresets',
  'breadcrumb', 'contextMenu', 'drag', 'errorBoundary',
  'keyboard', 'multiWindow', 'notificationBadge', 'performanceMonitor',
  'progressBar', 'resize', 'searchBox', 'snapDock', 'splitView',
  'statePersistence', 'toolbar', 'usageMetrics', 'zoomControls', 'toast',
  'debugPanel'
];

// P2.1: DOM-only modules (no EventBus needed)
const DOM_ONLY_MODULES = ['header', 'accessibility', 'eventHooks', 'skeleton', 'statusIndicator', 'tabs'];

// P2.1: Legacy/Hybrid modules - EMPTY after full migration
const HYBRID_MODULES: unknown[] = [];

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: EventBus availability check
// ═══════════════════════════════════════════════════════════════
function _checkWindowEventBus() {
  if (typeof window === 'undefined') return false;

  // Try Core.windowAdapter first
  if (window.Core?.windowAdapter?.get) {
    const waEventBus = window.Core.windowAdapter.get('EventBus');
    if (waEventBus) return true;
  }

  // In strict mode, don't access window.EventBus directly
  if (isStrict()) return false;

  // Non-strict: check window.EventBus but record violation
  if (window.EventBus) {
    recordViolation('WINDOW_EVENTBUS_CHECK', { module: MODULE_ID });
    return true;
  }

  return false;
}

interface BuildContainerApiDeps {
  container: HTMLElement;
  containerId: string;
  options: Record<string, unknown>;
  state: Record<string, unknown>;
  components: Record<string, Record<string, (...args: unknown[]) => unknown>>;
  onUnmount: (() => void) | null;
  mode: string;
  eventBus: Record<string, unknown> | null;
  version?: string;
  moduleId?: string;
}

export function buildContainerApi(deps: BuildContainerApiDeps) {
  const { container, containerId, options, state, components, onUnmount, mode, eventBus } = deps;

  function _aggregateComponentHealth() {
    const health: any = { total: 0, healthy: 0, degraded: 0, notInitialized: 0, unknown: 0, scores: [], details: {} };
    const componentKeys = Object.keys(components).filter(k => k !== '_diStatus' && k !== '_timing');

    componentKeys.forEach(name => {
      if (components[name]?.healthCheck) {
        try {
          const check = components[name].healthCheck() as Record<string, unknown>;
          health.total++;
          health.details[name] = check;

          if (check.status === 'HEALTHY') { health.healthy++; health.scores.push(100); }
          else if (check.status === 'DEGRADED') { health.degraded++; health.scores.push(50); }
          else if (check.status === 'NOT_INITIALIZED') { health.notInitialized++; health.scores.push(0); }
          else { health.unknown++; health.scores.push(25); }

          if (typeof check.score === 'number') health.scores.push(check.score);
        } catch (e) {
          health.total++;
          health.unknown++;
          health.scores.push(0);
          health.details[name] = { status: 'ERROR', error: (e as Error).message };
        }
      }
    });

    health.avgScore = health.scores.length > 0 ? Math.round(health.scores.reduce((a: number, b: number) => a + b, 0) / health.scores.length) : 0;
    health.overallStatus = health.degraded > 0 || health.unknown > 0 ? 'DEGRADED' : health.notInitialized > 0 ? 'PARTIAL' : 'HEALTHY';
    return health;
  }

  function _audit() {
    const results: Record<string, any> = {
      timestamp: Date.now(),
      containerId,
      mode: mode || MODE.STRICT,
      modeLabel: mode === MODE.STRICT ? 'STRICT (recommended)' : mode === MODE.HYBRID ? 'HYBRID (transitional)' : 'LEGACY (deprecated)',
      score: 0,
      maxScore: 100,
      issues: [],
      warnings: [],
      passed: [],
      components: {
        diStrict: { expected: [], found: [], missing: [], withoutInjection: [] },
        hybrid: { expected: [], found: [] },
        domOnly: { expected: [], found: [] },
        unknown: []
      },
      eventBus: { injected: !!eventBus, available: _checkWindowEventBus() },
      health: null,
      timing: null,
      strictMode: isStrict()
    };

    let scoreDeductions = 0;
    const componentKeys = Object.keys(components).filter(k => k !== '_diStatus' && k !== '_timing');

    // Check DI-STRICT modules
    DI_STRICT_MODULES.forEach(mod => {
      results.components.diStrict.expected.push(mod);
      if (components[mod]) {
        results.components.diStrict.found.push(mod);
        const health = components[mod].healthCheck?.() as Record<string, unknown> | undefined;
        if (health && health.hasInjectedEventBus === false) {
          results.components.diStrict.withoutInjection.push(mod);
          results.issues.push(`DI-STRICT module "${mod}" running without EventBus injection`);
          scoreDeductions += 15;
        } else {
          results.passed.push(`DI-STRICT module "${mod}" correctly injected`);
        }
      }
    });

    // Check hybrid modules (should be empty after migration)
    HYBRID_MODULES.forEach((mod: unknown) => {
      results.components.hybrid.expected.push(mod);
      if (components[mod as string]) {
        results.components.hybrid.found.push(mod);
        if (mode === MODE.STRICT) {
          results.warnings.push(`Hybrid module "${mod}" active in STRICT mode - consider migration`);
          scoreDeductions += 2;
        }
      }
    });

    // Check DOM-only modules
    DOM_ONLY_MODULES.forEach(mod => {
      results.components.domOnly.expected.push(mod);
      if (components[mod]) {
        results.components.domOnly.found.push(mod);
        results.passed.push(`DOM-only module "${mod}" active (no EventBus needed)`);
      }
    });

    // Find unknown modules
    componentKeys.forEach(key => {
      const isDiStrict = DI_STRICT_MODULES.includes(key);
      const isHybrid = HYBRID_MODULES.includes(key);
      const isDomOnly = DOM_ONLY_MODULES.includes(key);
      if (!isDiStrict && !isHybrid && !isDomOnly) {
        results.components.unknown.push(key);
        results.warnings.push(`Unknown module "${key}" - classify for audit`);
        scoreDeductions += 1;
      }
    });

    // Check mode consistency
    if (mode === MODE.STRICT && !eventBus) {
      results.issues.push('STRICT mode without EventBus injection - components may be muted');
      scoreDeductions += 20;
    }

    if (mode === MODE.LEGACY) {
      results.warnings.push('LEGACY mode is deprecated - migrate to STRICT');
      scoreDeductions += 10;
    }

    // Check _diStatus from init-components
    if (components._diStatus) {
      if (((components._diStatus as Record<string, unknown>).eventBus as number) > 0) {
        results.passed.push(`EventBus DI injection applied at init (${(components._diStatus as Record<string, unknown>).eventBus} modules)`);
      } else {
        results.issues.push('EventBus DI injection NOT applied at init');
        scoreDeductions += 15;
      }
    }

    // Aggregate component health
    results.health = _aggregateComponentHealth();
    if (results.health.degraded > 0) {
      results.warnings.push(`${results.health.degraded} component(s) in DEGRADED state`);
      scoreDeductions += results.health.degraded * 3;
    }
    if (results.health.notInitialized > 0) {
      results.warnings.push(`${results.health.notInitialized} component(s) NOT_INITIALIZED`);
      scoreDeductions += results.health.notInitialized * 2;
    }

    // Include timing data if available
    if (components._timing) {
      results.timing = { ...components._timing };
      const slowComponents = Object.entries(results.timing).filter(([, ms]) => (ms as any) > 50);
      if (slowComponents.length > 0) {
        results.warnings.push(`${slowComponents.length} component(s) took >50ms to initialize`);
        slowComponents.forEach(([name, ms]) => {
          results.warnings.push(`  - ${name}: ${ms}ms`);
        });
      }
    }

    // Calculate score
    results.score = Math.max(0, results.maxScore - scoreDeductions);
    results.grade = results.score >= 90 ? 'A' : results.score >= 80 ? 'B' : results.score >= 70 ? 'C' : results.score >= 60 ? 'D' : 'F';
    results.summary = {
      totalComponents: componentKeys.length,
      diStrictActive: results.components.diStrict.found.length,
      hybridActive: results.components.hybrid.found.length,
      domOnlyActive: results.components.domOnly.found.length,
      healthScore: results.health.avgScore,
      healthStatus: results.health.overallStatus,
      issueCount: results.issues.length,
      warningCount: results.warnings.length,
      passedCount: results.passed.length
    };

    return results;
  }

  return {
    unmount() {
      if (!state.mounted) return this;
      if (components.eventHooks?.emit) {
        components.eventHooks.emit(LIFECYCLE_HOOKS.BEFORE_UNMOUNT, { container });
      }
      if (onUnmount) onUnmount();
      if (container) container.remove();
      state.mounted = false;
      return this;
    },

    getState() { return { ...state }; },
    isCollapsed() { return state.collapsed; },
    isFullscreen() { return state.fullscreen; },
    isMinimized() { return state.minimized; },
    isLoading() { return state.loading; },
    isMounted() { return state.mounted; },

    collapse() { if (components.controls) components.controls.collapse(); return this; },
    expand() { if (components.controls) components.controls.expand(); return this; },
    toggle() { if (components.controls) components.controls.toggle(); return this; },

    fullscreen(enable = true) {
      if (enable) {
        if (components.controls) components.controls.enterFullscreen();
      } else {
        if (components.controls) components.controls.exitFullscreen();
      }
      return this;
    },

    close() { if (components.controls) components.controls.close(); return this; },

    setContent(content: string | HTMLElement) {
      const contentEl = container ? container.querySelector('.dsd-container__content') : null;
      if (!contentEl) return this;
      if (typeof content === 'string') contentEl.innerHTML = content;
      else if (content instanceof HTMLElement) { contentEl.innerHTML = ''; contentEl.appendChild(content); }
      return this;
    },

    getContent() { return container ? container.querySelector('.dsd-container__content') : null; },

    setTitle(title: string) { if (components.header) components.header.setTitle(title); return this; },
    setIcon(icon: HTMLImageElement) { if (components.header) components.header.setIcon(icon); return this; },

    showLoading() {
      state.loading = true;
      if (container) container.classList.add('dsd-container--loading');
      if (components.progressBar) { const pb = components.progressBar.show() as Record<string, (...args: unknown[]) => unknown>; pb?.setIndeterminate?.(true); }
      if (components.accessibility) components.accessibility.setAriaBusy(true);
      return this;
    },

    hideLoading() {
      state.loading = false;
      if (container) container.classList.remove('dsd-container--loading');
      if (components.progressBar) components.progressBar.hide();
      if (components.accessibility) components.accessibility.setAriaBusy(false);
      return this;
    },

    setProgress(value: unknown, variant: string) {
      if (components.progressBar) {
        const pb = components.progressBar.show() as Record<string, (...args: unknown[]) => unknown>; pb?.setIndeterminate?.(false); pb?.setValue?.(value);
        if (variant) components.progressBar.setVariant(variant);
      }
      return this;
    },

    toast(message: string, type = 'info') { return components.toast ? components.toast.show(message, type) : undefined; },
    toastSuccess(message: string) { return components.toast ? components.toast.success(message) : undefined; },
    toastError(message: string) { return components.toast ? components.toast.error(message) : undefined; },
    toastWarning(message: string) { return components.toast ? components.toast.warning(message) : undefined; },
    toastInfo(message: string) { return components.toast ? components.toast.info(message) : undefined; },

    addTab(tab: HTMLElement) { if (components.tabs) components.tabs.addTab(tab); return this; },
    removeTab(tabId: string) { if (components.tabs) components.tabs.removeTab(tabId); return this; },
    setActiveTab(tabId: string) { if (components.tabs) components.tabs.setActive(tabId); return this; },

    setBadge(count: number) { if (components.notificationBadge) components.notificationBadge.setCount(count); return this; },
    clearBadge() { if (components.notificationBadge) components.notificationBadge.clear(); return this; },

    setToolbarItems(items: unknown) { if (components.toolbar) components.toolbar.setItems(items); return this; },
    addToolbarItem(item: Record<string, unknown>, index: number) { if (components.toolbar) components.toolbar.addItem(item, index); return this; },

    zoomIn() { if (components.zoomControls) components.zoomControls.zoomIn(); return this; },
    zoomOut() { if (components.zoomControls) components.zoomControls.zoomOut(); return this; },
    setZoom(value: unknown) { if (components.zoomControls) components.zoomControls.setZoom(value); return this; },
    resetZoom() { if (components.zoomControls) components.zoomControls.reset(); return this; },
    getZoom() { return components.zoomControls ? components.zoomControls.getZoom() : 100; },

    announce(message: string, priority: number) { if (components.accessibility) components.accessibility.announce(message, priority); return this; },
    focusFirst() { if (components.accessibility) components.accessibility.focusFirst(); return this; },
    enableFocusTrap() { if (components.accessibility) components.accessibility.enableFocusTrap(); return this; },
    disableFocusTrap() { if (components.accessibility) components.accessibility.disableFocusTrap(); return this; },

    registerPlugin(plugin: Record<string, unknown>) { if (components.pluginSystem) components.pluginSystem.register(plugin); return this; },
    unregisterPlugin(pluginId: string) { if (components.pluginSystem) components.pluginSystem.unregister(pluginId); return this; },
    getPlugin(pluginId: string) { return components.pluginSystem ? components.pluginSystem.getPlugin(pluginId) : null; },

    on(hookName: string, callback: (...args: unknown[]) => void) { if (components.eventHooks) components.eventHooks.on(hookName, callback); return this; },
    off(hookName: string, callback: (...args: unknown[]) => void) { if (components.eventHooks) components.eventHooks.off(hookName, callback); return this; },
    emit(hookName: string, data: Record<string, unknown>) { if (components.eventHooks) components.eventHooks.emit(hookName, data); return this; },

    debug: {
      log(msg: string, data: Record<string, unknown>) { if (components.debugPanel) components.debugPanel.log?.(msg, data); },
      info(msg: string, data: Record<string, unknown>) { if (components.debugPanel) components.debugPanel.info?.(msg, data); },
      warn(msg: string, data: Record<string, unknown>) { if (components.debugPanel) components.debugPanel.warn?.(msg, data); },
      error(msg: string, data: Record<string, unknown>) { if (components.debugPanel) components.debugPanel.error?.(msg, data); },
      toggle() { if (components.debugPanel) components.debugPanel.toggle?.(); },
      show() { if (components.debugPanel) components.debugPanel.show?.(); },
      hide() { if (components.debugPanel) components.debugPanel.hide?.(); }
    },

    getMetrics() { return components.usageMetrics ? components.usageMetrics.getStats() : {}; },
    getPerformance() { return components.performanceMonitor ? components.performanceMonitor.getMetrics() : {}; },
    getComponentTiming() { return components._timing || {}; },
    getComponent(name: string) { return components[name] || null; },
    getElement() { return container; },
    getId() { return containerId; },
    getOptions() { return { ...options }; },

    audit() { return _audit(); },

    healthCheck() {
      const aggregatedHealth = _aggregateComponentHealth();
      return {
        status: state.error ? 'DEGRADED' : aggregatedHealth.overallStatus,
        version: deps.version || VERSION,
        moduleId: deps.moduleId || MODULE_ID,
        containerId,
        mode: mode || MODE.STRICT,
        mounted: state.mounted,
        state: { ...state },
        componentCount: aggregatedHealth.total,
        healthScore: aggregatedHealth.avgScore,
        components: aggregatedHealth.details,
        summary: { healthy: aggregatedHealth.healthy, degraded: aggregatedHealth.degraded, notInitialized: aggregatedHealth.notInitialized },
        diStrict: true,
        strictMode: isStrict()
      };
    }
  };
}

export function info() {
  return {
    moduleId: MODULE_ID, version: VERSION, diStrict: true, hasHealthAggregation: true, strictMode: isStrict(),
    methods: [
      'unmount', 'getState', 'isCollapsed', 'isFullscreen', 'isMinimized', 'isLoading', 'isMounted',
      'collapse', 'expand', 'toggle', 'fullscreen', 'close', 'setContent', 'getContent',
      'setTitle', 'setIcon', 'showLoading', 'hideLoading', 'setProgress',
      'toast', 'toastSuccess', 'toastError', 'toastWarning', 'toastInfo',
      'addTab', 'removeTab', 'setActiveTab', 'setBadge', 'clearBadge',
      'setToolbarItems', 'addToolbarItem', 'zoomIn', 'zoomOut', 'setZoom', 'resetZoom', 'getZoom',
      'announce', 'focusFirst', 'enableFocusTrap', 'disableFocusTrap',
      'registerPlugin', 'unregisterPlugin', 'getPlugin', 'on', 'off', 'emit',
      'getMetrics', 'getPerformance', 'getComponentTiming', 'getComponent', 'getElement', 'getId', 'getOptions',
      'audit', 'healthCheck'
    ]
  };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, diStrict: true, hasHealthAggregation: true, strictMode: isStrict() };
}

export default { buildContainerApi, info, healthCheck, VERSION, MODULE_ID };
