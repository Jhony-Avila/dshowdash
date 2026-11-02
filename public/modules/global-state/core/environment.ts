// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.0.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: global-state-environment
// PURPOSE: Global State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from /core/runtime/events/index.js
//
// PROVIDES:
//   MODULE_ID
//   VERSION
//   setupEnvironmentListeners
//   loadStyles
//   info
//   healthCheck
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

import { APP_EVENTS } from '/core/runtime/events/catalog/app.events.js';

export const MODULE_ID = 'global-state-environment';
export const VERSION = '9.0.0-P18EC';

export function setupEnvironmentListeners(manager: Record<string, unknown>) {
  const m: any = manager;
  const signal: AbortSignal = (m.abortController as AbortController).signal;

  window.addEventListener('online', () => {
    m.store.dispatch(m.actions.setOnlineStatus(true));
  }, { signal });

  window.addEventListener('offline', () => {
    m.store.dispatch(m.actions.setOnlineStatus(false));
  }, { signal });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      m.telemetry.track(APP_EVENTS.VISIBLE, {});
    } else {
      m.telemetry.track(APP_EVENTS.HIDDEN, {});
    }
  }, { signal });
}

export function loadStyles(manager: Record<string, unknown>) {
  const styleId = 'global-state-styles';
  if (document.getElementById(styleId)) return;

  const link = document.createElement('link');
  link.id = styleId;
  link.rel = 'stylesheet';
  link.href = '/modules/global-state/styles.css';
  document.head.appendChild(link);
  manager._styleElement = link;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { MODULE_ID, VERSION, setupEnvironmentListeners, loadStyles, info, healthCheck };
