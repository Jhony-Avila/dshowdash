// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: api
// PURPOSE: Navigation History - Public API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//   getInstance, setInstance, hasInstance from ./state.js
//   createNavigationHistory from ./manager.js
//
// PROVIDES:
//   getNavigationHistory() — exported function
//   resetNavigationHistory() — exported function
//   pushNavigation() — exported function
//   goBack() — exported function
//   goForward() — exported function
//   canGoBack() — exported function
//   canGoForward() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION, MODULE_ID } from './constants.js';
import { getInstance, setInstance, hasInstance } from './state.js';
import { createNavigationHistory } from './manager.js';

export function getNavigationHistory(options: Record<string, unknown> = {}) {
  if (!hasInstance()) {
    setInstance(createNavigationHistory(options));
  }
  return getInstance();
}

export function resetNavigationHistory() {
  const instance = getInstance();
  if (instance) {
    (instance.reset as (...args: unknown[]) => unknown)();
    setInstance(null);
  }
}

// @ts-expect-error strict migration — TS2531
export function pushNavigation(panelId: string, state: Record<string, unknown>, title: string) { return (getNavigationHistory().push as (...args: unknown[]) => unknown)(panelId, state, title); }
// @ts-expect-error strict migration — TS2531
export function goBack() { return (getNavigationHistory().back as (...args: unknown[]) => unknown)(); }
// @ts-expect-error strict migration — TS2531
export function goForward() { return (getNavigationHistory().forward as (...args: unknown[]) => unknown)(); }
// @ts-expect-error strict migration — TS2531
export function canGoBack() { return (getNavigationHistory().canGoBack as (...args: unknown[]) => unknown)(); }
// @ts-expect-error strict migration — TS2531
export function canGoForward() { return (getNavigationHistory().canGoForward as (...args: unknown[]) => unknown)(); }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }

export function healthCheck() {
  // @ts-expect-error strict migration — TS2531
  if (hasInstance()) return (getInstance().healthCheck as (...args: unknown[]) => unknown)();
  return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID };
}
