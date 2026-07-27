// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: manager
// PURPOSE: Panel Bookmarks Manager - Hotkeys
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig, getBookmarks, getHotkeyHandler, setHotkeyHandler from ../state.js
//   navigateToBookmark from ../operations/navigation.js
//
// PROVIDES:
//   setupHotkeys() — exported function
//   removeHotkeys() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getConfig, getBookmarks, getHotkeyHandler, setHotkeyHandler } from '../state.js';
import { navigateToBookmark } from '../operations/navigation.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-bookmarks-manager.hotkeys.manager';

export function setupHotkeys() {
  const config = getConfig();
  if (!config.enableHotkeys || getHotkeyHandler()) return;
  
  const handler = (e: KeyboardEvent) => {
    if (e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        const bookmarks = getBookmarks();
        const bookmark = bookmarks[num - 1];
        if (bookmark) {
          e.preventDefault();
          navigateToBookmark((bookmark.id as string));
        }
      }
    }
  };
  
  setHotkeyHandler(handler);
  document.addEventListener('keydown', handler);
}

export function removeHotkeys() {
  const handler = getHotkeyHandler();
  if (handler) {
    // @ts-expect-error TS migration - TS2769
    document.removeEventListener('keydown', handler);
    setHotkeyHandler(null);
  }
}
