// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-search-box
// PURPOSE: Container Search Box Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MAIN_EVENTS from /core/runtime/events/catalog/main.events.js
//   ICONS from ../utils/icons.js
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   createSearchBox() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventType
// LISTENS (eventos):
//   'blur'
//   'click'
//   'focus'
//   'input'
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MAIN_EVENTS } from '/core/runtime/events/catalog/main.events.js';
import { ICONS } from '../utils/icons.js';

export const VERSION = '8.2.0-ENTERPRISE';
export const MODULE_ID = 'container-search-box';
import { createLogger } from '../utils/logger.js';
const logger = createLogger(MODULE_ID);

let _injectedEventBus: { emit?: (event: string, data: Record<string, unknown>) => void; on?: (event: string, callback: (data: Record<string, unknown>) => void) => (() => void) } | null = null;

export function injectEventBus(eventBus: typeof _injectedEventBus) { _injectedEventBus = eventBus; }

function _getEventBus() { return _injectedEventBus; }

function _emitEvent(eventType: string, payload: Record<string, unknown>) {
  const eb = _getEventBus();
  if (eb?.emit) { eb.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload }); return true; }
  return false;
}

// Options validation
function _validateOptions(options: Record<string, unknown>) {
  const errors = [];
  if (options.placeholder !== undefined && typeof options.placeholder !== 'string') errors.push('placeholder must be a string');
  if (options.debounceMs !== undefined && (typeof options.debounceMs !== 'number' || options.debounceMs < 0)) errors.push('debounceMs must be a positive number');
  if (options.showClear !== undefined && typeof options.showClear !== 'boolean') errors.push('showClear must be a boolean');
  if (options.showIcon !== undefined && typeof options.showIcon !== 'boolean') errors.push('showIcon must be a boolean');
  if (options.expandable !== undefined && typeof options.expandable !== 'boolean') errors.push('expandable must be a boolean');
  if (options.onSearch !== undefined && typeof options.onSearch !== 'function') errors.push('onSearch must be a function');
  if (errors.length > 0) logger.warn('Invalid options', { errors });
  return errors.length === 0;
}

export function createSearchBox(container: HTMLElement, options: Record<string, any> = {}) {
  _validateOptions(options);
  const { placeholder = 'Buscar...', debounceMs = 300, showClear = true, showIcon = true, expandable = false, onSearch, onClear, onFocus, onBlur, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;

  let _initialized = false;
  let _searchEl: HTMLElement | null = null;
  let _inputEl: HTMLElement | null = null;
  let _debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let _value = '';
  let _expanded = !expandable;
  let _boundOnInput: EventListener | null = null;
  let _boundOnFocus: EventListener | null = null;
  let _boundOnBlur: EventListener | null = null;
  let _boundOnKeydown: EventListener | null = null;
  let _boundOnClear: EventListener | null = null;
  let _boundOnIconClick: EventListener | null = null;
  let _searchId = `search-${container?.id || Date.now()}`;

  function _createSearchElement() {
    const header = container.querySelector('.dsd-container__header');
    if (!header) return null;
    let existing = container.querySelector('.dsd-search-box');
    if (existing) return existing;
    const search = document.createElement('div');
    search.className = `dsd-search-box ${expandable ? 'dsd-search-box--expandable' : ''}`;
    search.setAttribute('role', 'search');
    search.setAttribute('aria-label', 'Busca no container');
    search.innerHTML = `${showIcon ? `<button type="button" class="dsd-search-box__icon-btn" aria-label="Abrir busca" aria-controls="${_searchId}">${ICONS.search}</button>` : ''}<input type="search" id="${_searchId}" class="dsd-search-box__input" placeholder="${placeholder}" aria-label="${placeholder}" autocomplete="off" spellcheck="false">${showClear ? `<button type="button" class="dsd-search-box__clear" aria-label="Limpar busca" hidden>${ICONS.closeSmall}</button>` : ''}`;
    const controls = header.querySelector('.dsd-container__controls');
    if (controls) controls.insertAdjacentElement('beforebegin', search);
    else header.appendChild(search);
    return search;
  }

  function _updateClearButton() {
    const clearBtn = _searchEl?.querySelector('.dsd-search-box__clear');
    if (clearBtn) {
      (clearBtn as HTMLInputElement).hidden = !_value;
      clearBtn.setAttribute('aria-hidden', String(!_value));
    }
  }

  function _debounceSearch() {
    if (_debounceTimer) clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => {
      onSearch?.(_value);
      _emitEvent(MAIN_EVENTS.SEARCH_QUERY, { query: _value, containerId: container.id });
    }, debounceMs);
  }

  function _setupEvents() {
    if (!_searchEl) return;
    _inputEl = _searchEl.querySelector('.dsd-search-box__input');
    const clearBtn = _searchEl.querySelector('.dsd-search-box__clear');
    const iconBtn = _searchEl.querySelector('.dsd-search-box__icon-btn');

    _boundOnInput = (e: Event) => { _value = (e.target as HTMLInputElement).value; _updateClearButton(); _debounceSearch(); };
    _boundOnFocus = () => {
      _searchEl!.classList.add('dsd-search-box--focused');
      _searchEl!.setAttribute('aria-expanded', 'true');
      if (expandable) searchApi.expand();
      onFocus?.();
    };
    _boundOnBlur = () => {
      _searchEl!.classList.remove('dsd-search-box--focused');
      if (expandable && !_value) {
        searchApi.collapse();
        _searchEl!.setAttribute('aria-expanded', 'false');
      }
      onBlur?.();
    };
    // @ts-expect-error strict migration — TS2322
    _boundOnKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (_value) { searchApi.clear(); }
        else if (expandable) { searchApi.collapse(); (_inputEl as HTMLElement).blur(); }
      }
    };
    _boundOnClear = () => { searchApi.clear(); (_inputEl as HTMLElement)?.focus(); };
    _boundOnIconClick = () => {
      if (expandable) { searchApi.expand(); (_inputEl as HTMLElement)?.focus(); }
      else { (_inputEl as HTMLElement)?.focus(); }
    };

    (_inputEl as HTMLElement)?.addEventListener('input', _boundOnInput as EventListener);
    (_inputEl as HTMLElement)?.addEventListener('focus', _boundOnFocus as EventListener);
    (_inputEl as HTMLElement)?.addEventListener('blur', _boundOnBlur as EventListener);
    (_inputEl as HTMLElement)?.addEventListener('keydown', _boundOnKeydown as EventListener);
    clearBtn?.addEventListener('click', _boundOnClear);
    iconBtn?.addEventListener('click', _boundOnIconClick);
  }

  function _removeEvents() {
    const clearBtn = _searchEl?.querySelector('.dsd-search-box__clear');
    const iconBtn = _searchEl?.querySelector('.dsd-search-box__icon-btn');
    if (_inputEl) {
      if (_boundOnInput) (_inputEl as HTMLElement).removeEventListener('input', _boundOnInput as EventListener);
      if (_boundOnFocus) (_inputEl as HTMLElement).removeEventListener('focus', _boundOnFocus as EventListener);
      if (_boundOnBlur) (_inputEl as HTMLElement).removeEventListener('blur', _boundOnBlur as EventListener);
      if (_boundOnKeydown) (_inputEl as HTMLElement).removeEventListener('keydown', _boundOnKeydown as EventListener);
    }
    if (clearBtn && _boundOnClear) clearBtn.removeEventListener('click', _boundOnClear);
    if (iconBtn && _boundOnIconClick) iconBtn.removeEventListener('click', _boundOnIconClick);
    _boundOnInput = null; _boundOnFocus = null; _boundOnBlur = null; _boundOnKeydown = null; _boundOnClear = null; _boundOnIconClick = null;
  }

  const searchApi = {
    init() {
      if (_initialized) return this;
      _searchEl = _createSearchElement() as HTMLElement | null;
      _setupEvents();
      if (expandable) {
        this.collapse();
        _searchEl?.setAttribute('aria-expanded', 'false');
      }
      _initialized = true;
      return this;
    },
    getValue() { return _value; },
    setValue(value: string) {
      if (typeof value !== 'string') return this;
      _value = value;
      if (_inputEl) (_inputEl as HTMLInputElement).value = value;
      _updateClearButton();
      return this;
    },
    clear() {
      _value = '';
      if (_inputEl) (_inputEl as HTMLInputElement).value = '';
      _updateClearButton();
      onClear?.();
      _emitEvent(MAIN_EVENTS.SEARCH_CLEAR, { containerId: container.id });
      return this;
    },
    focus() { (_inputEl as HTMLElement)?.focus(); return this; },
    blur() { (_inputEl as HTMLElement)?.blur(); return this; },
    expand() {
      _expanded = true;
      _searchEl?.classList.add('dsd-search-box--expanded');
      _searchEl?.setAttribute('aria-expanded', 'true');
      return this;
    },
    collapse() {
      _expanded = false;
      _searchEl?.classList.remove('dsd-search-box--expanded');
      _searchEl?.setAttribute('aria-expanded', 'false');
      return this;
    },
    isExpanded() { return _expanded; },
    isInitialized() { return _initialized; },
    destroy() {
      _removeEvents();
      if (_debounceTimer) clearTimeout(_debounceTimer);
      _debounceTimer = null;
      _searchEl?.remove();
      _searchEl = null;
      _inputEl = null;
      _initialized = false;
    },
    healthCheck() {
      return { status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, value: _value, expanded: _expanded, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true };
    }
  };
  return searchApi;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true }; }

export default { createSearchBox, injectEventBus, info, healthCheck, VERSION, MODULE_ID };
