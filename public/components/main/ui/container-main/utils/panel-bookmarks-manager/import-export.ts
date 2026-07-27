// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: import-export
// PURPOSE: Panel Bookmarks Manager - Import/Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION from ./constants.js
//   getConfig, getBookmarks as getRecentPanelsState, getPanelFrequency, increment...
//   log, emit, generateId from ./helpers/logger.js
//   saveBookmarks from ./storage/bookmarks.js
//   isBookmarked from ./operations/crud.js
//
// PROVIDES:
//   exportBookmarks() — exported function
//   importBookmarks() — exported function
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

import { VERSION } from './constants.js';
import { getConfig, getBookmarks, getBookmarks as getRecentPanelsState, getPanelFrequency, incrementMetric } from './state.js';
import { log, emit, generateId } from './helpers/logger.js';
import { saveBookmarks } from './storage/bookmarks.js';
import { isBookmarked } from './operations/crud.js';

export const MODULE_ID = 'main.ui.container-main.utils.panel-bookmarks-manager.import-export';

export function exportBookmarks() {
  return JSON.stringify({
    version: VERSION,
    exportedAt: Date.now(),
    bookmarks: getBookmarks(),
    recentPanels: getRecentPanelsState(),
    frequency: getPanelFrequency()
  }, null, 2);
}

export function importBookmarks(jsonData: unknown, options: Record<string, unknown> = {}) {
  const { merge = true, overwrite = false } = options;
  const config = getConfig();
  const bookmarks = getBookmarks();
  
  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    
    if (!data.bookmarks || !Array.isArray(data.bookmarks)) {
      throw new Error('Invalid bookmark data format');
    }
    
    let imported = 0;
    let skipped = 0;
    
    if (overwrite) {
      bookmarks.length = 0;
    }
    
    data.bookmarks.forEach((bookmark: Record<string, unknown>) => {
      if (merge && isBookmarked((bookmark.panelId as string))) {
        skipped++;
        return;
      }
      
      if (bookmarks.length < config.maxBookmarks) {
        const newBookmark = {
          ...bookmark,
          id: generateId(),
          order: bookmarks.length,
          importedAt: Date.now()
        };
        bookmarks.push(newBookmark);
        imported++;
      }
    });
    
    saveBookmarks();
    
    const result = { imported, skipped, total: data.bookmarks.length };
    emit('bookmarksImported', result);
    
    return result;
    
  } catch (error: any) {
    incrementMetric('errors');
    log('error', 'Import failed:', error.message);
    return { error: error.message, imported: 0, skipped: 0 };
  }
}
