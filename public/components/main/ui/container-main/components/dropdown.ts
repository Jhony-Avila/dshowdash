
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-dropdown
// PURPOSE: Container Dropdown Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ../utils/icons.js
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   DROPDOWN_POSITION — exported value
//   createDropdown() — exported function
//   closeAll() — exported function
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
//   window.innerHeight
//   window.innerWidth
//   window.scrollX
//   window.scrollY
// ═══════════════════════════════════════════════════════════════
'use strict';

import { ICONS } from '../utils/icons.js';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'container-dropdown';
import { createLogger } from '../utils/logger.js';
const logger = createLogger(MODULE_ID);

let _injectedEventBus: { emit?: (event: string, data: Record<string, unknown>) => void; on?: (event: string, callback: (data: Record<string, unknown>) => void) => (() => void) } | null = null;
let _openDropdowns = new Set();

export function injectEventBus(eventBus: typeof _injectedEventBus) { _injectedEventBus = eventBus; }

function _emitEvent(eventType: string, payload: Record<string, unknown>) {
  if (_injectedEventBus?.emit) {
    _injectedEventBus.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload });
  }
}

export const DROPDOWN_POSITION = { BOTTOM_START: 'bottom-start', BOTTOM_END: 'bottom-end', TOP_START: 'top-start', TOP_END: 'top-end' };

function _validateOptions(options: Record<string, unknown>) {
  const errors = [];
  if (options.position && !Object.values(DROPDOWN_POSITION).includes(options.position as string)) {
    errors.push(`position must be one of: ${Object.values(DROPDOWN_POSITION).join(', ')}`);
  }
  if (options.items && !Array.isArray(options.items)) {
    errors.push('items must be an array');
  }
  if (errors.length > 0) logger.warn('Invalid options', { errors });
  return errors.length === 0;
}

export function createDropdown(trigger: HTMLElement | null, options: Record<string, any> = {}) {
  _validateOptions(options);

  const {
    items = [],
    position = DROPDOWN_POSITION.BOTTOM_START,
    closeOnSelect = true,
    closeOnClickOutside = true,
    className = '',
    onSelect,
    onOpen,
    onClose,
    eventBus
  } = options;
  
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  
  let _isOpen = false;
  let _menuEl: HTMLElement | null = null;
  let _focusedIndex = -1;
  let _clickOutsideHandler: EventListener | null = null;
  let _keydownHandler: EventListener | null = null;
  let _items = [...items];
  
  function _createMenuElement() {
    const menu = document.createElement('div');
    menu.className = `dsd-dropdown dsd-dropdown--${position} ${className}`.trim();
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-hidden', 'true');
    menu.tabIndex = -1;
    
    _renderItems(menu);
    return menu;
  }
  
  function _renderItems(menu: HTMLElement) {
    menu.innerHTML = _items.map((item, index) => {
      if (item.type === 'separator') {
        return '<div class="dsd-dropdown__separator" role="separator"></div>';
      }
      if (item.type === 'header') {
        return `<div class="dsd-dropdown__header">${item.label}</div>`;
      }
      const disabled = item.disabled ? 'aria-disabled="true"' : '';
      const icon = item.icon ? `<span class="dsd-dropdown__icon">${(ICONS as Record<string, unknown>)[item.icon] || item.icon}</span>` : '';
      const shortcut = item.shortcut ? `<span class="dsd-dropdown__shortcut">${item.shortcut}</span>` : '';
      return `
        <button type="button" class="dsd-dropdown__item" role="menuitem" data-index="${index}" data-value="${item.value || ''}" ${disabled}>
          ${icon}
          <span class="dsd-dropdown__label">${item.label}</span>
          ${shortcut}
        </button>
      `;
    }).join('');
  }
  
  function _positionMenu() {
    if (!_menuEl || !trigger) return;
    
    const triggerRect = (trigger as HTMLElement).getBoundingClientRect();
    const menuRect = _menuEl.getBoundingClientRect();
    
    let top = 0;
    let left = 0;
    
    switch (position) {
      case DROPDOWN_POSITION.BOTTOM_START:
        top = triggerRect.bottom + 4;
        left = triggerRect.left;
        break;
      case DROPDOWN_POSITION.BOTTOM_END:
        top = triggerRect.bottom + 4;
        left = triggerRect.right - menuRect.width;
        break;
      case DROPDOWN_POSITION.TOP_START:
        top = triggerRect.top - menuRect.height - 4;
        left = triggerRect.left;
        break;
      case DROPDOWN_POSITION.TOP_END:
        top = triggerRect.top - menuRect.height - 4;
        left = triggerRect.right - menuRect.width;
        break;
    }
    
    // Keep within viewport
    left = Math.max(8, Math.min(left, window.innerWidth - menuRect.width - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - menuRect.height - 8));
    
    _menuEl.style.top = `${top + window.scrollY}px`;
    _menuEl.style.left = `${left + window.scrollX}px`;
  }
  
  function _handleKeydown(e: KeyboardEvent) {
    const menuItems = _menuEl?.querySelectorAll('.dsd-dropdown__item:not([aria-disabled="true"])');
    if (!menuItems?.length) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        _focusedIndex = (_focusedIndex + 1) % menuItems.length;
        (menuItems[_focusedIndex] as HTMLElement)?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        _focusedIndex = _focusedIndex <= 0 ? menuItems.length - 1 : _focusedIndex - 1;
        (menuItems[_focusedIndex] as HTMLElement)?.focus();
        break;
      case 'Home':
        e.preventDefault();
        _focusedIndex = 0;
        (menuItems[0] as HTMLElement)?.focus();
        break;
      case 'End':
        e.preventDefault();
        _focusedIndex = menuItems.length - 1;
        (menuItems[_focusedIndex] as HTMLElement)?.focus();
        break;
      case 'Escape':
        e.preventDefault();
        dropdown.close();
        (trigger as HTMLElement)?.focus();
        break;
      case 'Enter':
      case ' ':
        if (document.activeElement?.classList.contains('dsd-dropdown__item')) {
          e.preventDefault();
          (document.activeElement as HTMLElement).click();
        }
        break;
    }
  }
  
  function _handleItemClick(e: Event) {
    const item = (e.target as HTMLElement).closest('.dsd-dropdown__item');
    if (!item || item.getAttribute('aria-disabled') === 'true') return;
    
    const index = parseInt((item as HTMLElement).dataset.index || '', 10);
    const value = (item as HTMLElement).dataset.value;
    const itemData = _items[index];
    
    onSelect?.(itemData, index);
    itemData?.onClick?.(itemData);
    _emitEvent('dropdown:select', { value, index, item: itemData });
    
    if (closeOnSelect) dropdown.close();
  }
  
  function _handleClickOutside(e: Event) {
    if (!_menuEl?.contains(e.target as Node) && !trigger?.contains(e.target as Node)) {
      dropdown.close();
    }
  }
  
  const dropdown = {
    open() {
      if (_isOpen) return this;
      
      if (!_menuEl) {
        _menuEl = _createMenuElement();
        document.body.appendChild(_menuEl);
      }
      
      _menuEl.classList.add('dsd-dropdown--visible');
      _menuEl.setAttribute('aria-hidden', 'false');
      (trigger as HTMLElement)?.setAttribute('aria-expanded', 'true');
      
      requestAnimationFrame(() => _positionMenu());
      
      // @ts-expect-error strict migration — TS2322
      _keydownHandler = _handleKeydown;
      document.addEventListener('keydown', _keydownHandler as EventListener);
      _menuEl.addEventListener('click', _handleItemClick);
      
      if (closeOnClickOutside) {
        _clickOutsideHandler = _handleClickOutside;
        setTimeout(() => document.addEventListener('click', _clickOutsideHandler as EventListener), 0);
      }
      
      _isOpen = true;
      _focusedIndex = -1;
      _openDropdowns.add(this);
      
      _emitEvent('dropdown:open', {});
      onOpen?.();
      
      return this;
    },
    
    close() {
      if (!_isOpen) return this;
      
      _menuEl?.classList.remove('dsd-dropdown--visible');
      _menuEl?.setAttribute('aria-hidden', 'true');
      (trigger as HTMLElement)?.setAttribute('aria-expanded', 'false');
      
      if (_keydownHandler) document.removeEventListener('keydown', _keydownHandler as EventListener);
      if (_clickOutsideHandler) document.removeEventListener('click', _clickOutsideHandler as EventListener);
      
      _isOpen = false;
      _openDropdowns.delete(this);
      
      _emitEvent('dropdown:close', {});
      onClose?.();
      
      return this;
    },
    
    toggle() {
      return _isOpen ? this.close() : this.open();
    },
    
    setItems(newItems: Record<string, unknown>[]) {
      _items = [...newItems];
      if (_menuEl) _renderItems(_menuEl);
      return this;
    },
    
    isOpen() { return _isOpen; },
    getElement() { return _menuEl; },
    
    destroy() {
      this.close();
      _menuEl?.remove();
      _menuEl = null;
    },
    
    healthCheck() {
      return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, isOpen: _isOpen, itemCount: _items.length, hasEventBus: !!_injectedEventBus };
    }
  };
  
  // Setup trigger
  if (trigger) {
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', () => dropdown.toggle());
  }
  
  return dropdown;
}

export function closeAll() {
  [..._openDropdowns].forEach((d) => (d as { close: () => void }).close());
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, openCount: _openDropdowns.size, hasEventBus: !!_injectedEventBus };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, openCount: _openDropdowns.size, hasEventBus: !!_injectedEventBus };
}

export default {
  createDropdown, closeAll, injectEventBus,
  info, healthCheck, VERSION, MODULE_ID, DROPDOWN_POSITION
};
