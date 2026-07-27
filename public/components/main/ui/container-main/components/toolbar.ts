// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-toolbar
// PURPOSE: Container Toolbar Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MAIN_EVENTS from /core/runtime/events/catalog/main.events.js
//   NAV_INTENTS from /core/runtime/events/catalog/nav.events.js
//   ICONS from ../utils/icons.js
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   TOOLBAR_POSITION — exported value
//   createToolbar() — exported function
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

import { MAIN_EVENTS } from '/core/runtime/events/catalog/main.events.js';
import { NAV_INTENTS } from '/core/runtime/events/catalog/nav.events.js';
import { ICONS } from '../utils/icons.js';

export const VERSION = '8.2.0-ENTERPRISE';
export const MODULE_ID = 'container-toolbar';
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
  if (options.position !== undefined && !['top', 'bottom', 'left', 'right'].includes(options.position as string)) errors.push('position must be top|bottom|left|right');
  if (options.items !== undefined && !Array.isArray(options.items)) errors.push('items must be an array');
  if (options.size !== undefined && !['small', 'medium', 'large'].includes(options.size as string)) errors.push('size must be small|medium|large');
  if (options.collapsible !== undefined && typeof options.collapsible !== 'boolean') errors.push('collapsible must be a boolean');
  if (options.onAction !== undefined && typeof options.onAction !== 'function') errors.push('onAction must be a function');
  if (errors.length > 0) logger.warn('Invalid options', { errors });
  return errors.length === 0;
}

export const TOOLBAR_POSITION = { TOP: 'top', BOTTOM: 'bottom', LEFT: 'left', RIGHT: 'right' };

export function createToolbar(container: HTMLElement, options: Record<string, any> = {}) {
  _validateOptions(options);
  const { position = TOOLBAR_POSITION.TOP, items = [], size = 'medium', collapsible = false, onAction, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;

  let _initialized = false;
  let _toolbarEl: HTMLElement | null = null;
  let _items = [...items];
  let _collapsed = false;
  let _boundToggleHandler: EventListener | null = null;
  let _buttonHandlers: { btn: HTMLElement; handler: EventListener; type?: string }[] = [];
  let _focusableItems: HTMLElement[] = [];

  function _createToolbarElement() {
    const content = container.querySelector('.dsd-container__content');
    if (!content) return null;
    let existing = container.querySelector('.dsd-toolbar');
    if (existing) return existing;
    const toolbar = document.createElement('div');
    toolbar.className = `dsd-toolbar dsd-toolbar--${position} dsd-toolbar--${size}`;
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'Barra de ferramentas');
    toolbar.setAttribute('aria-orientation', position === 'left' || position === 'right' ? 'vertical' : 'horizontal');
    toolbar.innerHTML = `<div class="dsd-toolbar__items" data-slot="items" role="group"></div>${collapsible ? `<button type="button" class="dsd-toolbar__toggle" aria-label="Expandir/Recolher barra de ferramentas" aria-expanded="true">${ICONS.chevronDown}</button>` : ''}`;
    if (position === 'top' || position === 'left') content.insertAdjacentElement('beforebegin', toolbar);
    else content.insertAdjacentElement('afterend', toolbar);
    if (collapsible) {
      const toggle = toolbar.querySelector('.dsd-toolbar__toggle');
      if (toggle) { _boundToggleHandler = () => toolbarApi.toggle(); toggle.addEventListener('click', _boundToggleHandler); }
    }
    return toolbar;
  }

  function _handleAction(item: Record<string, unknown>) {
    if (item.disabled) return;
    if (item.navigate || item.panelId || item.route) {
      const route = item.route || item.navigate || item.panelId;
      _emitEvent(NAV_INTENTS.NAVIGATE, { route, panelId: item.panelId || null, meta: { source: MODULE_ID, actionId: item.id, containerId: container.id } });
    }
    _emitEvent(MAIN_EVENTS.TOOLBAR_ACTION, { action: item.id, item, containerId: container.id });
    onAction?.(item.id, item);
  }

  function _handleKeyboardNav(e: KeyboardEvent, currentIndex: number) {
    const isVertical = position === 'left' || position === 'right';
    const prev = isVertical ? 'ArrowUp' : 'ArrowLeft';
    const next = isVertical ? 'ArrowDown' : 'ArrowRight';
    let newIndex = currentIndex;

    if (e.key === prev) { newIndex = currentIndex > 0 ? currentIndex - 1 : _focusableItems.length - 1; e.preventDefault(); }
    else if (e.key === next) { newIndex = currentIndex < _focusableItems.length - 1 ? currentIndex + 1 : 0; e.preventDefault(); }
    else if (e.key === 'Home') { newIndex = 0; e.preventDefault(); }
    else if (e.key === 'End') { newIndex = _focusableItems.length - 1; e.preventDefault(); }

    if (newIndex !== currentIndex && _focusableItems[newIndex]) {
      _focusableItems.forEach((btn, i) => btn.setAttribute('tabindex', i === newIndex ? '0' : '-1'));
      _focusableItems[newIndex].focus();
    }
  }

  function _renderItems() {
    if (!_toolbarEl) return;
    const slot = _toolbarEl.querySelector('[data-slot="items"]');
    if (!slot) return;
    _clearButtonHandlers();
    _focusableItems = [];
    slot.innerHTML = '';

    _items.forEach((item, idx) => {
      if (item.type === 'divider') {
        const divider = document.createElement('div');
        divider.className = 'dsd-toolbar__divider';
        divider.setAttribute('role', 'separator');
        divider.setAttribute('aria-orientation', position === 'left' || position === 'right' ? 'horizontal' : 'vertical');
        slot.appendChild(divider);
        return;
      }
      if (item.type === 'spacer') {
        const spacer = document.createElement('div');
        spacer.className = 'dsd-toolbar__spacer';
        slot.appendChild(spacer);
        return;
      }
      if (item.type === 'group') {
        const group = document.createElement('div');
        group.className = 'dsd-toolbar__group';
        group.setAttribute('role', 'group');
        if (item.label) group.setAttribute('aria-label', item.label);
        item.items?.forEach((subItem: Record<string, unknown>) => {
          const btn = _createButton(subItem);
          group.appendChild(btn);
          if (!(subItem as Record<string, unknown>).disabled) _focusableItems.push(btn);
        });
        slot.appendChild(group);
        return;
      }
      const btn = _createButton(item);
      slot.appendChild(btn);
      if (!item.disabled) _focusableItems.push(btn);
    });

    // Setup roving tabindex
    _focusableItems.forEach((btn, i) => {
      btn.setAttribute('tabindex', i === 0 ? '0' : '-1');
      const keyHandler = (e: KeyboardEvent) => _handleKeyboardNav(e, _focusableItems.indexOf(btn));
      btn.addEventListener('keydown', keyHandler);
      // @ts-expect-error strict migration — TS2322
      _buttonHandlers.push({ btn, handler: keyHandler, type: 'keydown' });
    });
  }

  function _createButton(item: Record<string, unknown>) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dsd-toolbar__btn';
    if (item.active) { btn.classList.add('dsd-toolbar__btn--active'); btn.setAttribute('aria-pressed', 'true'); }
    if (item.disabled) { (btn as HTMLButtonElement).disabled = true; btn.setAttribute('aria-disabled', 'true'); }
    btn.dataset.action = String(item.id);
    btn.setAttribute('aria-label', String(item.label || item.id));
    if (item.tooltip) btn.title = String(item.tooltip);
    btn.innerHTML = `${item.icon ? `<span class="dsd-toolbar__icon" aria-hidden="true">${item.icon}</span>` : ''}${item.text ? `<span class="dsd-toolbar__text">${item.text}</span>` : ''}`;
    const handler = () => _handleAction(item);
    btn.addEventListener('click', handler);
    _buttonHandlers.push({ btn, handler, type: 'click' });
    return btn;
  }

  function _clearButtonHandlers() {
    _buttonHandlers.forEach(({ btn, handler, type = 'click' }) => btn.removeEventListener(type, handler));
    _buttonHandlers = [];
    _focusableItems = [];
  }

  const toolbarApi = {
    init() {
      if (_initialized) return this;
      _toolbarEl = _createToolbarElement() as HTMLElement | null;
      _renderItems();
      _initialized = true;
      return this;
    },
    setItems(items: unknown) {
      if (!Array.isArray(items)) return this;
      _items = [...items];
      _renderItems();
      return this;
    },
    addItem(item: Record<string, unknown>, index = -1) {
      if (!item || typeof item !== 'object') return this;
      if (index < 0 || index >= _items.length) _items.push(item);
      else _items.splice(index, 0, item);
      _renderItems();
      return this;
    },
    removeItem(id: string) { _items = _items.filter(i => i.id !== id); _renderItems(); return this; },
    updateItem(id: string, updates: Record<string, unknown>) {
      const item = _items.find(i => i.id === id);
      if (item) { Object.assign(item, updates); _renderItems(); }
      return this;
    },
    setActive(id: string, active = true) {
      const btn = _toolbarEl?.querySelector(`[data-action="${id}"]`);
      if (btn) btn.setAttribute('aria-pressed', String(active));
      return this.updateItem(id, { active });
    },
    setDisabled(id: string, disabled = true) {
      const btn = _toolbarEl?.querySelector(`[data-action="${id}"]`);
      if (btn) btn.setAttribute('aria-disabled', String(disabled));
      return this.updateItem(id, { disabled });
    },
    toggle() {
      _collapsed = !_collapsed;
      _toolbarEl?.classList.toggle('dsd-toolbar--collapsed', _collapsed);
      const toggle = _toolbarEl?.querySelector('.dsd-toolbar__toggle');
      if (toggle) {
        toggle.setAttribute('aria-expanded', String(!_collapsed));
        toggle.setAttribute('aria-label', _collapsed ? 'Expandir barra de ferramentas' : 'Recolher barra de ferramentas');
      }
      return this;
    },
    expand() {
      _collapsed = false;
      _toolbarEl?.classList.remove('dsd-toolbar--collapsed');
      const toggle = _toolbarEl?.querySelector('.dsd-toolbar__toggle');
      if (toggle) { toggle.setAttribute('aria-expanded', 'true'); toggle.setAttribute('aria-label', 'Recolher barra de ferramentas'); }
      return this;
    },
    collapse() {
      _collapsed = true;
      _toolbarEl?.classList.add('dsd-toolbar--collapsed');
      const toggle = _toolbarEl?.querySelector('.dsd-toolbar__toggle');
      if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Expandir barra de ferramentas'); }
      return this;
    },
    isCollapsed() { return _collapsed; },
    isInitialized() { return _initialized; },
    destroy() {
      _clearButtonHandlers();
      if (_toolbarEl && _boundToggleHandler) {
        const toggle = _toolbarEl.querySelector('.dsd-toolbar__toggle');
        toggle?.removeEventListener('click', _boundToggleHandler as EventListener);
      }
      _boundToggleHandler = null;
      _toolbarEl?.remove();
      _toolbarEl = null;
      _items = [];
      _initialized = false;
    },
    healthCheck() {
      return { status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, position, itemCount: _items.length, collapsed: _collapsed, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true, hasKeyboardNav: true };
    }
  };
  return toolbarApi;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true, hasKeyboardNav: true }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true, hasKeyboardNav: true }; }

export default { createToolbar, injectEventBus, info, healthCheck, VERSION, MODULE_ID, TOOLBAR_POSITION };
