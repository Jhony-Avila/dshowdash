// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navigation
// PURPOSE: Panel Bookmarks Manager - Navigation Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getBookmarks, setBookmarks, incrementMetric from ../state.js
//   log, emit from ../helpers/logger.js
//   saveBookmarks from ../storage/bookmarks.js
//   trackPanelAccess from ./frequency.js
//
// PROVIDES:
//   navigateToBookmark() — exported function
//   reorderBookmarks() — exported function
//   clearBookmarks() — exported function
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

import { getBookmarks, setBookmarks, incrementMetric } from '../state.js';
import { log, emit } from '../helpers/logger.js';
import { saveBookmarks } from '../storage/bookmarks.js';
import { trackPanelAccess } from './frequency.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-bookmarks-manager.operations.navigation';

export function navigateToBookmark(bookmarkId: string) {
  const bookmarks = getBookmarks();
  const bookmark = bookmarks.find(b => b.id === bookmarkId);
  if (!bookmark) return null;
  
  bookmark.lastAccessed = Date.now();
  // @ts-expect-error TS migration - TS2365
  bookmark.accessCount = (bookmark.accessCount || 0) + 1;
  saveBookmarks();
  
  incrementMetric('bookmarksAccessed');
  trackPanelAccess((bookmark.panelId as string));
  
  emit('bookmarkNavigated', { bookmark });
  log('info', 'Navigating to bookmark:', bookmark.title);
  
  return bookmark;
}

export function reorderBookmarks(orderedIds: unknown) {
  if (!Array.isArray(orderedIds)) return false;
  
  const bookmarks = getBookmarks();
  orderedIds.forEach((id, index) => {
    const bookmark = bookmarks.find(b => b.id === id);
    if (bookmark) {
      bookmark.order = index;
    }
  });
  
  bookmarks.sort((a, b) => (a.order as number) - (b.order as number));
  saveBookmarks();
  
  emit('bookmarksReordered', { order: orderedIds });
  return true;
}

export function clearBookmarks() {
  const bookmarks = getBookmarks();
  const count = bookmarks.length;
  setBookmarks([]);
  saveBookmarks();
  
  emit('bookmarksCleared', { count });
  return count;
}
