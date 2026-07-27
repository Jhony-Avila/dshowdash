// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: crud
// PURPOSE: Panel Bookmarks Manager - CRUD Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   BOOKMARK_TYPES from ../constants.js
//   getConfig, getBookmarks, incrementMetric from ../state.js
//   log, emit, generateId from ../helpers/logger.js
//   sortBookmarks from ../helpers/sorting.js
//   saveBookmarks from ../storage/bookmarks.js
//
// PROVIDES:
//   addBookmark() — exported function
//   removeBookmark() — exported function
//   updateBookmark() — exported function
//   getBookmark() — exported function
//   getAllBookmarks() — exported function
//   getBookmarkByPanelId() — exported function
//   isBookmarked() — exported function
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

import { BOOKMARK_TYPES } from '../constants.js';
import { getConfig, getBookmarks, incrementMetric } from '../state.js';
import { log, emit, generateId } from '../helpers/logger.js';
import { sortBookmarks } from '../helpers/sorting.js';
import { saveBookmarks } from '../storage/bookmarks.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-bookmarks-manager.operations.crud';

export function addBookmark(bookmarkData: unknown) {
  const config = getConfig();
  const bookmarks = getBookmarks();
  
  if (bookmarks.length >= config.maxBookmarks) {
    log('warn', 'Maximum bookmarks reached');
    emit('maxBookmarksReached', { max: config.maxBookmarks });
    return null;
  }
  
  const { panelId, title, icon, state, type = BOOKMARK_TYPES.PANEL, metadata: metadataOpt = {} } = bookmarkData as { panelId?: string; title?: string; icon?: string; state?: unknown; type?: string; metadata?: Record<string, unknown> };
  
  if (!panelId) {
    log('error', 'panelId is required');
    return null;
  }
  
  if (isBookmarked(panelId)) {
    log('warn', 'Panel already bookmarked:', panelId);
    return getBookmarkByPanelId(panelId);
  }
  
  const bookmark = {
    id: generateId(),
    panelId,
    title: title || panelId,
    icon: icon || '📌',
    type,
    state: state || null,

    metadata: metadataOpt,
    order: bookmarks.length,
    createdAt: Date.now(),
    lastAccessed: null as Record<string, unknown> | null,
    accessCount: 0
  };
  
  bookmarks.push(bookmark);
  saveBookmarks();
  incrementMetric('bookmarksAdded');
  
  emit('bookmarkAdded', { bookmark });
  log('info', 'Bookmark added:', bookmark.title);
  
  return bookmark;
}

export function removeBookmark(bookmarkId: string) {
  const bookmarks = getBookmarks();
  const index = bookmarks.findIndex(b => b.id === bookmarkId);
  if (index === -1) return false;
  
  const [removed] = bookmarks.splice(index, 1);
  bookmarks.forEach((b, i) => b.order = i);
  
  saveBookmarks();
  incrementMetric('bookmarksRemoved');
  
  emit('bookmarkRemoved', { bookmark: removed });
  log('info', 'Bookmark removed:', removed.title);
  
  return true;
}

export function updateBookmark(bookmarkId: string, updates: Record<string, unknown>) {
  const bookmarks = getBookmarks();
  const bookmark = bookmarks.find(b => b.id === bookmarkId);
  if (!bookmark) return null;
  
  const allowedFields = ['title', 'icon', 'state', 'metadata', 'order'];
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      (bookmark as Record<string, unknown>)[field] = updates[field];
    }
  });
  
  bookmark.updatedAt = Date.now();
  
  saveBookmarks();
  emit('bookmarkUpdated', { bookmark });
  
  return bookmark;
}

export function getBookmark(bookmarkId: string) {
  return getBookmarks().find(b => b.id === bookmarkId) || null;
}

export function getAllBookmarks(sorted = true) {
  const bookmarks = getBookmarks();
  return sorted ? sortBookmarks(bookmarks) : [...bookmarks];
}

export function getBookmarkByPanelId(panelId: string) {
  return getBookmarks().find(b => b.panelId === panelId) || null;
}

export function isBookmarked(panelId: string) {
  return getBookmarks().some(b => b.panelId === panelId);
}
