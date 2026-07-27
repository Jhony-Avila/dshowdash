// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: persistence
// PURPOSE: Navigation History - Persistence
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getContainerStatePersistence from ../../container-state-persistence.js
//
// PROVIDES:
//   (none)
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

import { getContainerStatePersistence } from '../../container-state-persistence.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.navigation-history.storage.persistence';

export async function saveHistory(history: Record<string, unknown>, currentIndex: unknown, config: Record<string, unknown>, logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {
  if (!config.persistHistory) return;
  
  try {
    const persistence = getContainerStatePersistence();
    await persistence.setCustomSetting('navigationHistory', {
      history: (history.slice as (...args: unknown[]) => unknown)(-20),
      currentIndex: Math.min((currentIndex as number), 19)
    });
  } catch (e) {
    // @ts-expect-error strict migration — TS2345
    logger.warn('Failed to save history:', e);
  }
}

export async function restoreHistory(config: Record<string, unknown>, logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {
  if (!config.persistHistory) return { history: [], currentIndex: -1 };
  
  try {
    const persistence = getContainerStatePersistence();
    await persistence.init();
    const saved = persistence.getCustomSetting('navigationHistory');
    
    if (saved && saved.history) {
      logger.debug('History restored:', { size: saved.history.length, index: saved.currentIndex });
      return {
        history: saved.history,
        currentIndex: saved.currentIndex ?? saved.history.length - 1
      };
    }
  } catch (e) {
    // @ts-expect-error strict migration — TS2345
    logger.warn('Failed to restore history:', e);
  }
  
  return { history: [], currentIndex: -1 };
}
