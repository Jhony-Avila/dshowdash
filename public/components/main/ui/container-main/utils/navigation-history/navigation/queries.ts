// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: queries
// PURPOSE: Navigation History - Query Functions
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   canGoBack() — exported function
//   canGoForward() — exported function
//   getCurrent() — exported function
//   getCurrentIndex() — exported function
//   getHistory() — exported function
//   getHistorySize() — exported function
//   getEntry() — exported function
//   getBackStack() — exported function
//   getForwardStack() — exported function
//   findByPanelId() — exported function
//   getLastVisited() — exported function
//   clearForward() — exported function
//   clear() — exported function
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

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.navigation-history.navigation.queries';

export function canGoBack(state: Record<string, unknown>) {
  return (state.currentIndex as number) > 0;
}

export function canGoForward(state: Record<string, unknown>) {
  return (state.currentIndex as number) < (state.history as unknown[]).length - 1;
}

export function getCurrent(state: Record<string, unknown>) {
  // @ts-expect-error TS migration - TS2538
  return (state.currentIndex as number) >= 0 ? { ...state.history[state.currentIndex] } : null;
}

export function getCurrentIndex(state: Record<string, unknown>) {
  return state.currentIndex;
}

export function getHistory(state: Record<string, unknown>) {
  return (state.history as unknown[]).map((h: unknown) => ({ ...(h as Record<string, unknown>) }));
}

export function getHistorySize(state: Record<string, unknown>) {
  return (state.history as unknown[]).length;
}

export function getEntry(state: Record<string, unknown>, index: number) {
  return (state.history as unknown[])[index] ? { ...(state.history as unknown[])[index] as Record<string, unknown> } : null;
}

export function getBackStack(state: Record<string, unknown>) {
  return (state.history as unknown[]).slice(0, (state.currentIndex as number)).map((h: unknown) => ({ ...(h as Record<string, unknown>) }));
}

export function getForwardStack(state: Record<string, unknown>) {
  return (state.history as unknown[]).slice((state.currentIndex as number) + 1).map((h: unknown) => ({ ...(h as Record<string, unknown>) }));
}

export function findByPanelId(state: Record<string, unknown>, panelId: string) {
  // @ts-expect-error strict migration — TS18046
  return state.history
    .map((h: unknown, index: number) => ({ ...(h as Record<string, unknown>), index }))
    .filter((h: unknown) => (h as Record<string, unknown>).panelId === panelId);
}

export function getLastVisited(state: Record<string, unknown>, panelId: string) {
  for (let i = (state.history as unknown[]).length - 1; i >= 0; i--) {
    // @ts-expect-error TS migration - TS2339
    if ((state.history as Record<string, unknown>)[i].panelId === panelId) {
      return { ...(state.history as unknown[])[i] as Record<string, unknown>, index: i };
    }
  }
  return null;
}

export function clearForward(state: Record<string, unknown>, notifyListeners: unknown, saveHistory: unknown) {
  if ((state.currentIndex as number) < (state.history as unknown[]).length - 1) {
    state.history = (state.history as unknown[]).slice(0, (state.currentIndex as number) + 1);
    (saveHistory as (...args: unknown[]) => unknown)();
    (notifyListeners as (...args: unknown[]) => unknown)('clearForward', { index: state.currentIndex });
  }
}

export function clear(state: Record<string, unknown>, notifyListeners: unknown, saveHistory: unknown, logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {
  state.history = [];
  state.currentIndex = -1;
  (saveHistory as (...args: unknown[]) => unknown)();
  (notifyListeners as (...args: unknown[]) => unknown)('clear', {});
  logger.debug('History cleared');
}
