// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-accordion
// PURPOSE: Container Accordion Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ../utils/icons.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   createAccordion() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventType
// LISTENS (eventos):
//   'click'
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { ICONS } from '../utils/icons.js';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'container-accordion';

let _injectedEventBus: { emit: (event: string, data: Record<string, unknown>) => void } | null = null;

export function injectEventBus(eventBus: { emit: (event: string, data: Record<string, unknown>) => void }) { _injectedEventBus = eventBus; }

function _emitEvent(eventType: string, payload: Record<string, unknown>) {
  if (_injectedEventBus?.emit) {
    _injectedEventBus.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload });
  }
}

export function createAccordion(container: HTMLElement, options: Record<string, any> = {}) {
  const {
    items = [],
    multiple = false,
    defaultOpen = [],
    animated = true,
    className = '',
    onToggle,
    eventBus
  } = options;
  
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  
  let _items = [...items];
  let _openItems = new Set(defaultOpen);
  let _initialized = false;
  let _accordionEl: HTMLElement | null = null;
  
  function _createItemElement(item: Record<string, unknown>, index: number) {
    const isOpen = _openItems.has(index);
    const itemEl = document.createElement('div');
    itemEl.className = `dsd-accordion__item ${isOpen ? 'dsd-accordion__item--open' : ''}`;
    itemEl.dataset.index = String(index);
    
    itemEl.innerHTML = `
      <button type="button" class="dsd-accordion__header" aria-expanded="${isOpen}" aria-controls="accordion-panel-${index}">
        <span class="dsd-accordion__title">${item.title}</span>
        <span class="dsd-accordion__icon">${ICONS.chevronDown || '▼'}</span>
      </button>
      <div id="accordion-panel-${index}" class="dsd-accordion__panel" role="region" ${isOpen ? '' : 'hidden'}>
        <div class="dsd-accordion__content">${typeof item.content === 'string' ? item.content : ''}</div>
      </div>
    `;
    
    if (item.content instanceof HTMLElement) {
      // @ts-expect-error strict migration — TS2531
      itemEl.querySelector('.dsd-accordion__content').appendChild(item.content);
    }
    
    return itemEl;
  }
  
  function _render() {
    if (!container) return;
    
    _accordionEl = document.createElement('div');
    _accordionEl!.className = `dsd-accordion ${animated ? 'dsd-accordion--animated' : ''} ${className}`.trim();
    
    _items.forEach((item, index) => {
      _accordionEl!.appendChild(_createItemElement(item, index));
    });
    
    container.innerHTML = '';
    container.appendChild(_accordionEl!);
  }
  
  function _toggleItem(index: number) {
    const isOpen = _openItems.has(index);
    
    if (!multiple && !isOpen) {
      _openItems.forEach(i => {
        if (i !== index) _closeItem(i as number);
      });
    }
    
    if (isOpen) {
      _closeItem(index);
    } else {
      _openItem(index);
    }
  }
  
  function _openItem(index: number) {
    _openItems.add(index);
    const itemEl = _accordionEl?.querySelector(`[data-index="${index}"]`);
    if (!itemEl) return;
    
    itemEl.classList.add('dsd-accordion__item--open');
    const header = itemEl.querySelector('.dsd-accordion__header');
    const panel = itemEl.querySelector('.dsd-accordion__panel');
    
    header?.setAttribute('aria-expanded', 'true');
    panel?.removeAttribute('hidden');
    
    _emitEvent('accordion:open', { index, item: _items[index] });
    onToggle?.(index, true, _items[index]);
  }
  
  function _closeItem(index: number) {
    _openItems.delete(index);
    const itemEl = _accordionEl?.querySelector(`[data-index="${index}"]`);
    if (!itemEl) return;
    
    itemEl.classList.remove('dsd-accordion__item--open');
    const header = itemEl.querySelector('.dsd-accordion__header');
    const panel = itemEl.querySelector('.dsd-accordion__panel');
    
    header?.setAttribute('aria-expanded', 'false');
    panel?.setAttribute('hidden', '');
    
    _emitEvent('accordion:close', { index, item: _items[index] });
    onToggle?.(index, false, _items[index]);
  }
  
  function _handleClick(e: Event) {
    const header = (e.target as HTMLElement).closest('.dsd-accordion__header');
    if (!header) return;
    
    const itemEl = header.closest('.dsd-accordion__item');
    const index = parseInt((itemEl as HTMLElement)?.dataset.index || '', 10);
    if (!isNaN(index)) _toggleItem(index);
  }
  
  function _handleKeydown(e: KeyboardEvent) {
    const header = (e.target as HTMLElement).closest('.dsd-accordion__header');
    if (!header) return;
    
    const headers = Array.from(_accordionEl!.querySelectorAll('.dsd-accordion__header'));
    const currentIndex = headers.indexOf(header);
    let newIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        newIndex = (currentIndex + 1) % headers.length;
        break;
      case 'ArrowUp':
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : headers.length - 1;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = headers.length - 1;
        break;
    }
    
    if (newIndex !== currentIndex) {

      (headers[newIndex] as HTMLElement).focus();
    }
  }
  
  const accordion = {
    init() {
      if (_initialized) return this;
      _render();
      _accordionEl?.addEventListener('click', _handleClick as EventListener);
      _accordionEl?.addEventListener('keydown', _handleKeydown as EventListener);
      _initialized = true;
      return this;
    },
    
    open(index: number) { _openItem(index); return this; },
    close(index: number) { _closeItem(index); return this; },
    toggle(index: number) { _toggleItem(index); return this; },
    
    openAll() { _items.forEach((_, i) => _openItem(i)); return this; },
    closeAll() { _items.forEach((_, i) => _closeItem(i)); return this; },
    
    isOpen(index: number) { return _openItems.has(index); },
    getOpenItems() { return [..._openItems]; },
    
    addItem(item: Record<string, unknown>, index: number) {
      const insertIndex = index !== undefined ? index : _items.length;
      _items.splice(insertIndex, 0, item);
      _render();
      return this;
    },
    
    removeItem(index: number) {
      _items.splice(index, 1);
      _openItems.delete(index);
      _render();
      return this;
    },
    
    isInitialized() { return _initialized; },
    
    destroy() {
      _accordionEl?.removeEventListener('click', _handleClick as EventListener);
      _accordionEl?.removeEventListener('keydown', _handleKeydown as EventListener);
      container.innerHTML = '';
      _initialized = false;
    },
    
    healthCheck() {
      return { status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, itemCount: _items.length, openCount: _openItems.size, hasEventBus: !!_injectedEventBus };
    }
  };
  
  return accordion;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasEventBus: !!_injectedEventBus };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, hasEventBus: !!_injectedEventBus };
}

export default { createAccordion, injectEventBus, info, healthCheck, VERSION, MODULE_ID };
