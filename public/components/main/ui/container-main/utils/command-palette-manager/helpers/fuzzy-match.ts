// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: fuzzy-match
// PURPOSE: Command Palette - Fuzzy Match Helper
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig from ../state.js
//
// PROVIDES:
//   _fuzzyMatch() — exported function
//   _highlightText() — exported function
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
export const MODULE_ID = 'main.ui.container-main.utils.command-palette-manager.helpers.fuzzy-match';

export function _fuzzyMatch(text: string, query: string) {
  if (!query) return { match: true, score: 0, indices: [] };
  
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  const config = getConfig();
  
  // Exact match
  if (textLower.includes(queryLower)) {
    const index = textLower.indexOf(queryLower);
    const indices = [];
    for (let i = index; i < index + query.length; i++) indices.push(i);
    return { match: true, score: 100 - index, indices };
  }
  
  // Fuzzy match
  if (!config.fuzzySearch) return { match: false, score: 0, indices: [] };
  
  let queryIndex = 0;
  const indices = [];
  
  for (let i = 0; i < text.length && queryIndex < query.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      indices.push(i);
      queryIndex++;
    }
  }
  
  if (queryIndex === query.length) {
    const score = (query.length / text.length) * 50 - (indices[indices.length - 1] - indices[0]);
    return { match: true, score, indices };
  }
  
  return { match: false, score: 0, indices: [] };
}

export function _highlightText(text: string, indices: unknown[]) {
  const config = getConfig();
  if (!config.highlightMatches || indices.length === 0) return text;
  
  let result = '';
  let lastIndex = 0;
  
  // @ts-expect-error strict migration — TS2345
  indices.forEach((i: number) => {
    result += text.slice(lastIndex, i);
    result += `<mark class="dsd-cp-highlight">${text[i]}</mark>`;
    lastIndex = i + 1;
  });
  
  result += text.slice(lastIndex);
  return result;
}
