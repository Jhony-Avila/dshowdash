// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: search-box
// PURPOSE: Panel Search Manager - Search Box UI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SEARCH_MODES, MATCH_TYPES from ../constants.js
//   getConfig, setConfig, getSearchContainer, setSearchContainer, getMatches, get...
//   getSearchStyles from ./styles.js
//   search, nextMatch, previousMatch, close from ../api.js
//
// PROVIDES:
//   _createSearchUI() — exported function
//   _updateUI() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
//   'click'
//   'input'
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SEARCH_MODES, MATCH_TYPES } from '../constants.js';
import { getConfig, setConfig, getSearchContainer, setSearchContainer, getMatches, getCurrentMatchIndex, getCurrentQuery } from '../state.js';
import { getSearchStyles } from './styles.js';
import { search, nextMatch, previousMatch, close } from '../api.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-search-manager.ui.search-box';

export function _createSearchUI() {
  if (getSearchContainer()) return;
  
  const config = getConfig();
  const container = document.createElement('div');
  container.id = 'dsd-panel-search';
  container.className = 'dsd-panel-search';
  container.innerHTML = `
    <style>${getSearchStyles()}</style>
    
    <div class="dsd-ps-input-row">
      <input type="text" class="dsd-ps-input" placeholder="Buscar no painel..." autocomplete="off" spellcheck="false">
      <span class="dsd-ps-count">0/0</span>
      <div class="dsd-ps-nav">
        <button class="dsd-ps-btn dsd-ps-prev" title="Anterior (Shift+Enter)">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
        </button>
        <button class="dsd-ps-btn dsd-ps-next" title="Próximo (Enter)">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
      </div>
      <button class="dsd-ps-btn dsd-ps-close" title="Fechar (Esc)">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    
    <div class="dsd-ps-options">
      <label class="dsd-ps-option">
        <input type="checkbox" class="dsd-ps-case" />
        <span>Aa</span>
      </label>
      <label class="dsd-ps-option">
        <input type="checkbox" class="dsd-ps-regex" />
        <span>.*</span>
      </label>
      <label class="dsd-ps-option">
        <input type="checkbox" class="dsd-ps-word" />
        <span>Palavra</span>
      </label>
    </div>
  `;
  
  document.body.appendChild(container);
  setSearchContainer(container);
  
  _bindSearchEvents(container);
}

function _bindSearchEvents(container: HTMLElement) {
  const config = getConfig();
  const input = container.querySelector('.dsd-ps-input');
  const prevBtn = container.querySelector('.dsd-ps-prev');
  const nextBtn = container.querySelector('.dsd-ps-next');
  const closeBtn = container.querySelector('.dsd-ps-close');
  const caseCheck = container.querySelector('.dsd-ps-case');
  const regexCheck = container.querySelector('.dsd-ps-regex');
  const wordCheck = container.querySelector('.dsd-ps-word');
  
  let debounceTimer: unknown = null;
  
  input!.addEventListener('input', (e: Event) => {
    // @ts-expect-error TS migration - TS2769
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      // @ts-expect-error TS migration - TS2339
      search((e.target as HTMLElement).value);
    }, config.debounceDelay);
  });
  
  // @ts-expect-error strict migration — TS2769
  input!.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        previousMatch();
      } else {
        nextMatch();
      }
    } else if (e.key === 'Escape') {
      close();
    }
  });
  
  prevBtn!.addEventListener('click', () => previousMatch());
  nextBtn!.addEventListener('click', () => nextMatch());
  closeBtn!.addEventListener('click', () => close());
  
  caseCheck!.addEventListener('change', () => {
    const cfg = getConfig();

    // @ts-expect-error TS migration - TS2322
    cfg.matchType = caseCheck.checked ? MATCH_TYPES.EXACT : MATCH_TYPES.CASE_INSENSITIVE;
    setConfig(cfg);
    const query = getCurrentQuery();
    if (query) search(query);
  });
  
  regexCheck!.addEventListener('change', () => {
    const cfg = getConfig();

    // @ts-expect-error TS migration - TS2322
    cfg.mode = regexCheck.checked ? SEARCH_MODES.REGEX : SEARCH_MODES.TEXT;
    setConfig(cfg);
    const query = getCurrentQuery();
    if (query) search(query);
  });
  
  wordCheck!.addEventListener('change', () => {
    const cfg = getConfig();

    // @ts-expect-error TS migration - TS2322
    cfg.matchType = wordCheck.checked ? MATCH_TYPES.WORD_BOUNDARY : MATCH_TYPES.CASE_INSENSITIVE;
    setConfig(cfg);
    const query = getCurrentQuery();
    if (query) search(query);
  });
}

export function _updateUI() {
  const container = getSearchContainer();
  if (!container) return;
  
  const config = getConfig();
  const matches = getMatches();
  const currentIndex = getCurrentMatchIndex();
  const query = getCurrentQuery();
  
  const countEl = container.querySelector('.dsd-ps-count');
  const prevBtn = container.querySelector('.dsd-ps-prev');
  const nextBtn = container.querySelector('.dsd-ps-next');
  
  if (matches.length === 0) {
    countEl!.textContent = query.length >= config.minQueryLength ? 'Sem resultados' : '';
    // @ts-expect-error TS migration - TS2339
    prevBtn.disabled = true;
    // @ts-expect-error TS migration - TS2339
    nextBtn.disabled = true;
  } else {
    countEl!.textContent = `${currentIndex + 1}/${matches.length}`;
    // @ts-expect-error TS migration - TS2339
    prevBtn.disabled = false;
    // @ts-expect-error TS migration - TS2339
    nextBtn.disabled = false;
  }
}
