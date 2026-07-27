// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: core
// PURPOSE: Navigation History - Core Navigation
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   NAVIGATION_TYPES from ../constants.js
//   createEntry from ../helpers/entry.js
//   updateBrowserHistory from ../browser/integration.js
//
// PROVIDES:
//   push() — exported function
//   replace() — exported function
//   back() — exported function
//   forward() — exported function
//   go() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.history
// ═══════════════════════════════════════════════════════════════
'use strict';

import { NAVIGATION_TYPES } from '../constants.js';
import { createEntry } from '../helpers/entry.js';
import { updateBrowserHistory } from '../browser/integration.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.navigation-history.navigation.core';

export function push(state: Record<string, unknown>, config: Record<string, unknown>, panelId: string, entryState: Record<string, unknown> = {}, title = '', notifyListeners: unknown, saveHistory: unknown, logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {
  if (!panelId) {
    logger.warn('Cannot push without panelId');
    return null;
  }

  if ((state.currentIndex as number) < (state.history as unknown[]).length - 1) {
    state.history = (state.history as unknown[]).slice(0, (state.currentIndex as number) + 1);
  }

  const entry = createEntry(panelId, entryState, title, config);
  (state.history as unknown[]).push(entry);
  state.currentIndex = (state.history as unknown[]).length - 1;

  // @ts-expect-error TS migration - TS2365
  if ((state.history as unknown[]).length > config.maxHistorySize) {
    const removeCount = (state.history as unknown[]).length - (config.maxHistorySize as number);
    state.history = (state.history as unknown[]).slice(removeCount);
    (state.currentIndex as number) -= removeCount;
  }

  updateBrowserHistory(entry, NAVIGATION_TYPES.PUSH, state.browserHistoryEnabled, state.isNavigating);
  (saveHistory as (...args: unknown[]) => unknown)();

  (notifyListeners as (...args: unknown[]) => unknown)('push', { entry, index: state.currentIndex });
  // @ts-expect-error TS migration - TS2349
  config.onNavigate?.(entry, NAVIGATION_TYPES.PUSH);

  // @ts-expect-error TS migration - TS2554
  if (config.debug) logger.debug('Push:', entry.panelId, { index: state.currentIndex });

  return entry;
}

export function replace(state: Record<string, unknown>, config: Record<string, unknown>, panelId: string, entryState: Record<string, unknown> = {}, title = '', notifyListeners: unknown, saveHistory: unknown, logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {
  if (!panelId) {
    logger.warn('Cannot replace without panelId');
    return null;
  }

  const entry = createEntry(panelId, entryState, title, config);

  if ((state.currentIndex as number) >= 0) {
    // @ts-expect-error TS migration - TS2538
    state.history[state.currentIndex] = entry;
  } else {
    (state.history as unknown[]).push(entry);
    state.currentIndex = 0;
  }

  updateBrowserHistory(entry, NAVIGATION_TYPES.REPLACE, state.browserHistoryEnabled, state.isNavigating);
  (saveHistory as (...args: unknown[]) => unknown)();

  (notifyListeners as (...args: unknown[]) => unknown)('replace', { entry, index: state.currentIndex });
  // @ts-expect-error TS migration - TS2349
  config.onNavigate?.(entry, NAVIGATION_TYPES.REPLACE);

  // @ts-expect-error TS migration - TS2345
  if (config.debug) logger.debug('Replace:', entry.panelId);

  return entry;
}

export function back(state: Record<string, unknown>, config: Record<string, unknown>, notifyListeners: unknown, saveHistory: unknown, logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {
  if ((state.currentIndex as number) <= 0) {
    logger.debug('Cannot go back - at beginning');
    return null;
  }

  (state.currentIndex as number)--;
  // @ts-expect-error TS migration - TS2538
  const entry = state.history[state.currentIndex];

  if (state.browserHistoryEnabled && !state.isNavigating) {
    state.isNavigating = true;
    window.history.back();
    setTimeout(() => { state.isNavigating = false; }, 100);
  }

  (saveHistory as (...args: unknown[]) => unknown)();
  (notifyListeners as (...args: unknown[]) => unknown)('back', { entry, index: state.currentIndex });
  // @ts-expect-error TS migration - TS2349
  config.onNavigate?.(entry, NAVIGATION_TYPES.POP);

  // @ts-expect-error TS migration - TS2554
  if (config.debug) logger.debug('Back to:', entry.panelId, { index: state.currentIndex });

  return entry;
}

export function forward(state: Record<string, unknown>, config: Record<string, unknown>, notifyListeners: unknown, saveHistory: unknown, logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {
  if ((state.currentIndex as number) >= (state.history as unknown[]).length - 1) {
    logger.debug('Cannot go forward - at end');
    return null;
  }

  (state.currentIndex as number)++;
  // @ts-expect-error TS migration - TS2538
  const entry = state.history[state.currentIndex];

  if (state.browserHistoryEnabled && !state.isNavigating) {
    state.isNavigating = true;
    window.history.forward();
    setTimeout(() => { state.isNavigating = false; }, 100);
  }

  (saveHistory as (...args: unknown[]) => unknown)();
  (notifyListeners as (...args: unknown[]) => unknown)('forward', { entry, index: state.currentIndex });
  // @ts-expect-error TS migration - TS2349
  config.onNavigate?.(entry, NAVIGATION_TYPES.POP);

  // @ts-expect-error TS migration - TS2554
  if (config.debug) logger.debug('Forward to:', entry.panelId, { index: state.currentIndex });

  return entry;
}

export function go(state: Record<string, unknown>, config: Record<string, unknown>, delta: number, notifyListeners: unknown, saveHistory: unknown, logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {
  const newIndex = (state.currentIndex as number) + delta;

  if (newIndex < 0 || newIndex >= (state.history as unknown[]).length) {
    // @ts-expect-error TS migration - TS2345
    logger.debug('Cannot go to index:', newIndex);
    return null;
  }

  state.currentIndex = newIndex;
  // @ts-expect-error TS migration - TS2538
  const entry = state.history[state.currentIndex];

  if (state.browserHistoryEnabled && !state.isNavigating) {
    state.isNavigating = true;
    window.history.go(delta);
    setTimeout(() => { state.isNavigating = false; }, 100);
  }

  (saveHistory as (...args: unknown[]) => unknown)();
  (notifyListeners as (...args: unknown[]) => unknown)('go', { entry, index: state.currentIndex, delta });
  // @ts-expect-error TS migration - TS2349
  config.onNavigate?.(entry, NAVIGATION_TYPES.GO);

  // @ts-expect-error TS migration - TS2554
  if (config.debug) logger.debug('Go to:', entry.panelId, { delta, index: state.currentIndex });

  return entry;
}
