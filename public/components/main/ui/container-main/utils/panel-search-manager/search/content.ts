// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: content
// PURPOSE: Panel Search Manager - Content Search
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig from ../state.js
//
// PROVIDES:
//   _getSearchableContent() — exported function
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

import { getConfig } from '../state.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-search-manager.search.content';

export function _getSearchableContent(container: HTMLElement) {
  const config = getConfig();
  
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        
        for (const selector of config.excludeSelectors) {
          if (parent.closest(selector)) return NodeFilter.FILTER_REJECT;
        }
        
        // @ts-expect-error strict migration — TS18047
        if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  
  return textNodes;
}
