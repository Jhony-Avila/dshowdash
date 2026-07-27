// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-component-loaders
// PURPOSE: NavRail Component - Loaders
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   NavRailRegistry from ../registry/index.js
//   NavRailComponentMounter from ../core/component-mounter.js
//   NavRailTracker from ../telemetry/tracker.js
//   RetryManager from ../core/retry-manager.js
//   createLogger from ../core/constants.js
//   getPort from ../ports.js
//
// PROVIDES:
//   (none)
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

import { NavRailRegistry } from '../registry/index.js';
import { NavRailComponentMounter } from '../core/component-mounter.js';
import { NavRailTracker } from '../telemetry/tracker.js';
import { RetryManager } from '../core/retry-manager.js';
import { createLogger } from '../core/constants.js';
import { getPort } from '../ports.js';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'nav-rail.component.loaders';

const _log = createLogger(getPort);

export async function loadCSSWithRetry() {
  const cssPath = '/components/nav-rail/styles/index.css';
  if (document.querySelector(`link[href="${cssPath}"]`)) return;

  return RetryManager.execute(() => new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssPath;
    link.onload = resolve;
    link.onerror = () => reject(new Error('Failed to load NavRail CSS'));
    document.head.appendChild(link);
  }), { maxAttempts: 2, baseDelay: 500, serviceName: 'css-loader' });
}

export async function loadRegistryWithRetry() {
  try {
    return await RetryManager.execute(
      () => NavRailRegistry.load(),
      { maxAttempts: 3, baseDelay: 1000, serviceName: 'registry-api' }
    );
  } catch (error: any) {
    _log('warn', 'Registry load failed, using fallback', { error: error.message });
    NavRailRegistry._loadFallback();
    return { success: true, source: 'fallback' };
  }
}

export async function mountComponentsSafe(component: Record<string, unknown>) {
  try {
    if (component._componentsMounted) {
      await NavRailComponentMounter.unmountAll();
    }

    const items = NavRailRegistry.getItems();
    const results = await NavRailComponentMounter.mountAll(component._root as HTMLElement, items) as { mounted: unknown[]; failed: unknown[]; lazy: unknown[] };

    component._componentsMounted = true;
    _log('info', 'Components mounted', {
      eager: results.mounted.length,
      failed: results.failed.length,
      lazy: results.lazy ? results.lazy.length : 0
    });

    if (results.failed.length > 0) {
      _log('warn', 'Some components failed to mount', { failed: results.failed });
    }

    return results;
  } catch (error: any) {
    _log('error', 'Component mounting failed', { error: error.message });
    NavRailTracker.error(error, { phase: 'mount-components' });
    component._componentsMounted = false;
    return { mounted: [] as string[], failed: [] as string[], lazy: [] as string[], error: error.message };
  }
}
