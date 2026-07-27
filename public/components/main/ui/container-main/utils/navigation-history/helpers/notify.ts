// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: notify
// PURPOSE: Navigation History - Notify Helper
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   notifyListeners() — exported function
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
export const MODULE_ID = 'main.ui.container-main.utils.navigation-history.helpers.notify';

export function notifyListeners(listeners: Array<(...args: unknown[]) => void>, event: string, data: Record<string, unknown>, logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {
  listeners.forEach((listener: (...args: unknown[]) => void) => {
    try {
      listener({ event, ...data, timestamp: Date.now() });
    } catch (e) {
      // @ts-expect-error strict migration — TS2345
      logger.warn('Listener error:', e);
    }
  });
}
