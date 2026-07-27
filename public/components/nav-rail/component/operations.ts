// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-component-operations
// PURPOSE: NavRail Component - Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   mergeConfig from ../core/contracts.js
//   NavRailRegistry from ../registry/index.js
//   NavRailTemplate from ../ui/template.js
//   NavRailRender from ../ui/render.js
//   NavRailEvents from ../core/events.js
//   NavRailLifecycle from ../core/lifecycle.js
//   NavRailTracker from ../telemetry/tracker.js
//   NavRailBehaviors from ../ui/behaviors.js
//   NavRailComponentMounter from ../core/component-mounter.js
//   NavRailFeatureLoader from ../core/feature-loader.js
//   createLogger from ../core/constants.js
//   getPort from ../ports.js
//   doInit from ./init.js
//   loadRegistryWithRetry, mountComponentsSafe from ./loaders.js
//
// PROVIDES:
//   render() — exported function
//   setActiveItem() — exported function
//   getActiveItem() — exported function
//   update() — exported function
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   (none)
//
// LISTENS (eventos):
//   (none)
//
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'nav-rail.component.operations';

import { mergeConfig } from '../core/contracts.js';
import { NavRailRegistry } from '../registry/index.js';
import { NavRailTemplate } from '../ui/template.js';
import { NavRailRender } from '../ui/render.js';
import { NavRailEvents } from '../core/events.js';
import { NavRailLifecycle } from '../core/lifecycle.js';
import { NavRailTracker } from '../telemetry/tracker.js';
import { NavRailBehaviors } from '../ui/behaviors.js';
import { NavRailComponentMounter } from '../core/component-mounter.js';
import { NavRailFeatureLoader } from '../core/feature-loader.js';
import { createLogger } from '../core/constants.js';
import { getPort } from '../ports.js';

import { doInit } from './init.js';
import { loadRegistryWithRetry, mountComponentsSafe } from './loaders.js';

const _log = createLogger(getPort);

export function render(component: Record<string, unknown>) {
  try {
    const groups = NavRailRegistry.getGroups();
    const items = NavRailRegistry.getItems();
    const mobileItems = NavRailRegistry.getMobileItems();
    const html = NavRailTemplate.render({ groups: groups as unknown[], items: items as unknown[], mobileItems: mobileItems as unknown[] } as Parameters<typeof NavRailTemplate.render>[0]);
    NavRailRender.apply(html);
    NavRailTracker.rendered();
    return component;
  } catch (error: any) {
    _log('error', 'Render failed', { error: error.message });
    NavRailTracker.error(error, { phase: 'render' });
    if (component._root) {
      (component._root as HTMLElement).innerHTML = '<nav class="nav-rail nav-rail--error" role="navigation"><div class="nav-rail__error">NavRail Error</div></nav>';
    }
    return component;
  }
}

export function setActiveItem(component: Record<string, unknown>, itemId: string) {
  try { NavRailRender.setActiveItem(itemId); } catch (error: any) { _log('error', 'setActiveItem failed', { error: error.message }); }
  return component;
}

export function getActiveItem(component: Record<string, unknown>) {
  try {
    const root = component._root as HTMLElement;
    return (root?.querySelector('.nav-rail__item--active') as HTMLElement | null)?.dataset?.itemId ||
           (root?.querySelector('.navrail-btn.is-active') as HTMLElement | null)?.dataset?.buttonId || null;
  } catch (error: any) {
    _log('error', 'getActiveItem failed', { error: error.message });
    return null;
  }
}

export function update(component: Record<string, unknown>, newConfig: Record<string, unknown> = {}) {
  try {
    component._config = mergeConfig({ ...(component._config as Record<string, unknown>), ...newConfig });
    render(component);
    mountComponentsSafe(component);
  } catch (error: any) {
    _log('error', 'Update failed', { error: error.message });
  }
  return component;
}

export async function refresh(component: Record<string, unknown>) {
  try {
    NavRailRegistry.invalidateCache();
    const loadResult = await loadRegistryWithRetry() as Record<string, unknown>;
    component._registrySource = loadResult.source;
    render(component);
    await mountComponentsSafe(component);
    _log('info', 'NavRail refreshed', { source: component._registrySource });
    return component;
  } catch (error: any) {
    _log('error', 'Refresh failed', { error: error.message });
    return component;
  }
}

export async function reinit(component: Record<string, unknown>, rootElement: unknown, userConfig: Record<string, unknown> = {}) {
  _log('info', 'Performing reinit');
  NavRailTracker.track('reinit:start', {});

  try {
    await destroy(component);
    component._initialized = false;
    component._degradedMode = false;
    component._errorState = null;

    const result = await doInit(component, rootElement || component._root, userConfig || component._config);
    NavRailTracker.track('reinit:success', {});
    return result;
  } catch (error: any) {
    _log('error', 'Reinit failed', { error: error.message });
    NavRailTracker.track('reinit:failed', { error: error.message });
    throw error;
  }
}

export async function destroy(component: Record<string, unknown>) {
  try {
    await NavRailFeatureLoader.destroy();
  } catch (e: any) {
    _log('warn', 'Feature loader destroy failed', { error: e.message });
  }

  try {
    await NavRailComponentMounter.unmountAll();
  } catch (e: any) {
    _log('warn', 'Component unmount failed during destroy', { error: e.message });
  }

  try { NavRailEvents.destroy(); } catch (e: any) { /* ignore */ }
  try { NavRailBehaviors.destroy(); } catch (e: any) { /* ignore */ }
  try { NavRailRender.destroy(); } catch (e: any) { /* ignore */ }

  NavRailLifecycle.markDestroyed();
  NavRailTracker.destroy();

  component._componentsMounted = false;
  component._featuresMounted = false;
  component._root = null;
  component._config = null;
  component._initialized = false;
  component._registrySource = null;
  component._degradedMode = false;
  component._errorState = null;

  _log('info', 'Destroyed');
}
