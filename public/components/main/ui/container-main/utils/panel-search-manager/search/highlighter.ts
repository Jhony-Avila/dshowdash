// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: highlighter
// PURPOSE: Panel Search Manager - Highlighter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig, getMatches, getCurrentMatchIndex, getHighlightedElements, setHighl...
//
// PROVIDES:
//   _highlightMatches() — exported function
//   _clearHighlights() — exported function
//   _updateActiveHighlight() — exported function
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

import { getConfig, getMatches, getCurrentMatchIndex, getHighlightedElements, setHighlightedElements, getOriginalContents } from '../state.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-search-manager.search.highlighter';

export function _highlightMatches() {
  _clearHighlights();
  
  const matches = getMatches();
  const currentMatchIndex = getCurrentMatchIndex();
  const originalContents = getOriginalContents();
  
  if (matches.length === 0) return;
  
  const nodeMatches = new Map();
  matches.forEach((match, idx) => {
    if (!nodeMatches.has(match.node)) {
      nodeMatches.set(match.node, []);
    }
    nodeMatches.get(match.node).push({ ...(match as Record<string, unknown>), globalIndex: idx });
  });
  
  const highlightedElements: unknown[] = [];
  
  nodeMatches.forEach((matchList, node) => {
    originalContents.set(node, node.textContent);
    // @ts-expect-error TS migration - TS2362, TS2363
    matchList.sort((a: unknown, b: unknown) => (b as Record<string, unknown>).index - (a as Record<string, unknown>).index);
    
    const wrapper = document.createElement('span');
    wrapper.className = 'dsd-search-wrapper';
    
    let html = node.textContent;
    
    matchList.forEach((match: unknown) => {
      const before = html.slice(0, (match as Record<string, unknown>).index);
      // @ts-expect-error TS migration - TS2339
      const matchText = html.slice((match as Record<string, unknown>).index, match.index + (match as unknown[]).length);
      // @ts-expect-error TS migration - TS2365
      const after = html.slice((match as Record<string, unknown>).index + (match as unknown[]).length);
      
      const isActive = (match as Record<string, unknown>).globalIndex === currentMatchIndex;
      const className = isActive ? 'dsd-search-highlight dsd-search-highlight--active' : 'dsd-search-highlight';
      
      html = `${before}<mark class="${className}" data-match-index="${(match as Record<string, unknown>).globalIndex}">${matchText}</mark>${after}`;
    });
    
    wrapper.innerHTML = html;
    node.parentNode.replaceChild(wrapper, node);
    highlightedElements.push({ wrapper, originalNode: node });
  });
  
  setHighlightedElements(highlightedElements);
}

export function _clearHighlights() {
  const highlightedElements = getHighlightedElements();
  const originalContents = getOriginalContents();
  
  // @ts-expect-error strict migration — TS2345
  highlightedElements.forEach(({ wrapper, originalNode }) => {
    if (wrapper.parentNode) {
      const textNode = document.createTextNode(originalContents.get(originalNode) || '');
      wrapper.parentNode.replaceChild(textNode, wrapper);
    }
  });
  
  setHighlightedElements([]);
  originalContents.clear();
}

export function _updateActiveHighlight() {
  const config = getConfig();
  const currentMatchIndex = getCurrentMatchIndex();
  
  document.querySelectorAll('.dsd-search-highlight--active').forEach(el => {
    el.classList.remove('dsd-search-highlight--active');
  });
  
  const activeEl = document.querySelector(`[data-match-index="${currentMatchIndex}"]`);
  if (activeEl) {
    activeEl.classList.add('dsd-search-highlight--active');
    activeEl.scrollIntoView({ behavior: config.scrollBehavior, block: 'center' });
  }
}
