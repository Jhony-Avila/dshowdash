// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: api
// PURPOSE: Loading Progress - Public API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//   getInstance, setInstance, hasInstance from ./state.js
//   createLoadingProgress from ./manager.js
//
// PROVIDES:
//   getLoadingProgress() — exported function
//   resetLoadingProgress() — exported function
//   startLoading() — exported function
//   doneLoading() — exported function
//   setLoadingProgress() — exported function
//   isLoading() — exported function
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
import { createLoadingProgress } from './manager.js';

export function getLoadingProgress(options: Record<string, unknown> = {}) {
  if (!hasInstance()) {
    setInstance(createLoadingProgress(options));
  }
  return getInstance();
}

export function resetLoadingProgress() {
  const instance = getInstance();
  if (instance) {
    (instance.destroy as (...args: unknown[]) => unknown)();
    setInstance(null);
  }
}

// @ts-expect-error strict migration — TS2531
export function startLoading() { return (getLoadingProgress().start as (...args: unknown[]) => unknown)(); }
// @ts-expect-error strict migration — TS2531
export function doneLoading() { return (getLoadingProgress().done as (...args: unknown[]) => unknown)(); }
// @ts-expect-error strict migration — TS2531
export function setLoadingProgress(progress: number) { return (getLoadingProgress().set as (...args: unknown[]) => unknown)(progress); }
// @ts-expect-error strict migration — TS2531
export function isLoading() { return (getLoadingProgress().isLoading as (...args: unknown[]) => unknown)(); }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }

export function healthCheck() {
  // @ts-expect-error strict migration — TS2531
  if (hasInstance()) return (getInstance().healthCheck as (...args: unknown[]) => unknown)();
  return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID };
}
