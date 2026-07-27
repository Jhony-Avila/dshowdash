// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: matcher
// PURPOSE: Panel Search Manager - Matcher
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SEARCH_MODES, MATCH_TYPES from ../constants.js
//   getConfig from ../state.js
//   _log from ../helpers/logger.js
//
// PROVIDES:
//   _findMatches() — exported function
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

import { SEARCH_MODES, MATCH_TYPES } from '../constants.js';
import { getConfig } from '../state.js';
import { _log } from '../helpers/logger.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-search-manager.search.matcher';

export function _findMatches(textNodes: Record<string, unknown>, query: string) {
  const config = getConfig();
  const matches: unknown[] = [];
  
  if (!query || query.length < config.minQueryLength) return matches;
  
  let pattern;
  try {
    if ((config.mode as string) === SEARCH_MODES.REGEX) {
      pattern = new RegExp(query, (config.matchType as string) === MATCH_TYPES.EXACT ? 'g' : 'gi');
    } else {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let flags = 'g';
      if ((config.matchType as string) !== MATCH_TYPES.EXACT) flags += 'i';

      if ((config.matchType as string) === MATCH_TYPES.WORD_BOUNDARY) {
        pattern = new RegExp(`\\b${escapedQuery}\\b`, flags);
      } else {
        pattern = new RegExp(escapedQuery, flags);
      }
    }
  } catch (e: any) {
    _log('warn', 'Invalid regex:', e.message);
    return matches;
  }
  
  (textNodes.forEach as (...args: unknown[]) => unknown)((node: HTMLElement) => {
    const text = node.textContent;
    let match;
    
    while ((match = pattern.exec(text)) !== null && matches.length < config.maxResults) {
      matches.push({
        node,
        index: match.index,
        length: match[0].length,
        text: match[0]
      });
    }
  });
  
  return matches;
}
