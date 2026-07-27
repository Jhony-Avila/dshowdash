// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.3.0-RELOAD-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-component-init
// PURPOSE: NavRail Component - Init
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   mergeConfig, LOCAL_EVENTS from ../core/contracts.js
//   NavRailRegistry from ../registry/index.js
//   NavRailRender from ../ui/render.js
//   NavRailEvents from ../core/events.js
//   NavRailLifecycle from ../core/lifecycle.js
//   NavRailTracker from ../telemetry/tracker.js
//   NavRailBehaviors from ../ui/behaviors.js
//   NavRailFeatureLoader from ../core/feature-loader.js
//   createLogger from ../core/constants.js
//   getPort from ../ports.js
//   loadCSSWithRetry, loadRegistryWithRetry, mountComponentsSafe from ./loaders.js
//   initFeatureLoader from ./features.js
//   render, refresh from ./operations.js
//
// PROVIDES:
//   onModeChangeSafe() — exported function
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   LOCAL_EVENTS.READY — event emission
//
// LISTENS (eventos):
//   'navigation:icons:updated' (window)
//   'navigation:items:changed' (window)
//
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '1.1.0-RELOAD-FIX';
export const MODULE_ID = 'nav-rail.component.init';

import { mergeConfig, LOCAL_EVENTS } from '../core/contracts.js';
import { NavRailRegistry } from '../registry/index.js';
import { NavRailRender } from '../ui/render.js';
import { NavRailEvents } from '../core/events.js';
import { NavRailLifecycle } from '../core/lifecycle.js';
import { NavRailTracker } from '../telemetry/tracker.js';
import { NavRailBehaviors } from '../ui/behaviors.js';
import { NavRailFeatureLoader } from '../core/feature-loader.js';
import { createLogger } from '../core/constants.js';
import { getPort } from '../ports.js';
import * as NavRailRCHandler from '/core/runtime/constants/navrail-handler.js';

import { loadCSSWithRetry, loadRegistryWithRetry, mountComponentsSafe } from './loaders.js';
import { initFeatureLoader } from './features.js';
import { render, refresh } from './operations.js';

const _log = createLogger(getPort);

export async function doInit(component: Record<string, unknown>, rootElement: unknown, userConfig: unknown) {
  try {
    NavRailLifecycle.setState(NavRailLifecycle.STATES.INITIALIZING);
    NavRailTracker.init();

    component._root = typeof rootElement === 'string' ? document.querySelector(rootElement) : rootElement;
    if (!component._root) {
      throw new Error('NavRail: root element not found');
    }

    component._config = mergeConfig(userConfig as Record<string, unknown>);
    component._errorState = null;
    component._degradedMode = false;

    await loadCSSWithRetry();

    const loadResult = await loadRegistryWithRetry() as Record<string, unknown>;
    component._registrySource = loadResult.source;

    NavRailRender.init(component._root as HTMLElement);
    NavRailEvents.init(component._root as HTMLElement);

    render(component);

    await mountComponentsSafe(component);

    await initFeatureLoader(component);

    NavRailBehaviors.init(component._root as HTMLElement, component._config as Record<string, unknown>, (mode: string) => onModeChangeSafe(component, mode));

    NavRailLifecycle.markMounted();
    NavRailLifecycle.markReady();
    NavRailTracker.ready();
    component._initialized = true;

    // P5: Setup RuntimeContext handler apos NavRail estar pronto
    try {
      const rcResult = NavRailRCHandler.setup();
      component._runtimeContextSetup = rcResult.ok;
    } catch (e) {
      component._runtimeContextSetup = false;
    }

    // Listen for icon updates from panel-nav-admin — re-render navrail
    window.addEventListener('navigation:icons:updated', () => {
      try { render(component); } catch (e) { _log('warn', 'Icon update re-render failed', e); }
    });

    // Listen for item changes (label edit, group change) — full reload (invalidate cache + API fetch + re-render)
    window.addEventListener('navigation:items:changed', () => {
      refresh(component).catch((e: any) => { _log('warn', 'Items changed refresh failed', e); });
    });

    NavRailEvents.emit(LOCAL_EVENTS.READY, {
      version: '5.2.0',
      config: component._config,
      registrySource: component._registrySource,
      degradedMode: component._degradedMode,
      offlineMode: NavRailRegistry.isOfflineMode(),
      featuresLoaded: NavRailFeatureLoader.getLoadedFeatures().map(f => f.id),
      runtimeContextSetup: component._runtimeContextSetup
    });

    _log('info', `v5.2.0 initialized (registry: ${component._registrySource}, degraded: ${component._degradedMode}, offline: ${NavRailRegistry.isOfflineMode()}, rc: ${component._runtimeContextSetup})`);
    return component;

  } catch (error: any) {
    component._errorState = { message: error.message, time: Date.now() };
    NavRailLifecycle.markError(error);
    NavRailTracker.error(error, { phase: 'init' });
    _log('error', 'Init failed', { error: error.message });

    if (!component._degradedMode) {
      return initDegradedMode(component, rootElement, userConfig);
    }

    throw error;
  }
}

export async function initDegradedMode(component: Record<string, unknown>, rootElement: unknown, userConfig: unknown) {
  _log('warn', 'Entering degraded mode');
  component._degradedMode = true;
  NavRailTracker.track('degraded:enter', {});

  try {
    component._root = typeof rootElement === 'string' ? document.querySelector(rootElement) : rootElement;
    if (!component._root) throw new Error('Root not found for degraded mode');

    component._config = mergeConfig(userConfig as Record<string, unknown>);

    NavRailRegistry._loadFallback();
    component._registrySource = 'fallback-degraded';

    NavRailRender.init(component._root as HTMLElement);
    render(component);

    component._componentsMounted = false;
    component._featuresMounted = false;

    NavRailLifecycle.markMounted();
    component._initialized = true;

    _log('info', 'Degraded mode initialized');
    NavRailTracker.track('degraded:ready', {});

    return component;
  } catch (error: any) {
    _log('error', 'Degraded mode failed', { error: error.message });
    NavRailTracker.error(error, { phase: 'degraded-init' });
    throw error;
  }
}

export function onModeChangeSafe(component: Record<string, unknown>, mode: string) {
  try {
    if (mode === 'mobile') NavRailRender.activateMobile();
    else NavRailRender.activateDesktop();

    mountComponentsSafe(component).catch(err => {
      _log('error', 'Failed to remount on mode change', { error: err.message });
    });

    NavRailTracker.modeChange(mode);
  } catch (error: any) {
    _log('error', 'Mode change failed', { error: error.message });
    NavRailTracker.error(error, { phase: 'mode-change' });
  }
}
