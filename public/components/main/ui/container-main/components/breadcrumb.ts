// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-breadcrumb
// PURPOSE: Container Breadcrumb Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MAIN_EVENTS from /core/runtime/events/catalog/main.events.js
//   NAV_INTENTS from /core/runtime/events/catalog/nav.events.js
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   createBreadcrumb() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventType
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MAIN_EVENTS } from '/core/runtime/events/catalog/main.events.js';
import { NAV_INTENTS } from '/core/runtime/events/catalog/nav.events.js';

export const VERSION = '8.2.0-ENTERPRISE';
export const MODULE_ID = 'container-breadcrumb';
import { createLogger } from '../utils/logger.js';
const logger = createLogger(MODULE_ID);

let _injectedEventBus: { emit: (event: string, data: Record<string, unknown>) => void } | null = null;

export function injectEventBus(eventBus: { emit: (event: string, data: Record<string, unknown>) => void }) { _injectedEventBus = eventBus; }

function _getEventBus() { return _injectedEventBus; }

function _emitEvent(eventType: string, payload: Record<string, unknown>) {
  const eb = _getEventBus();
  if (eb?.emit) { eb.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload }); return true; }
  return false;
}

// Options validation
function _validateOptions(options: Record<string, unknown>) {
  const errors = [];
  if (options.separator !== undefined && typeof options.separator !== 'string') errors.push('separator must be a string');
  if (options.maxItems !== undefined && (typeof options.maxItems !== 'number' || options.maxItems < 1)) errors.push('maxItems must be a positive number');
  if (options.onNavigate !== undefined && typeof options.onNavigate !== 'function') errors.push('onNavigate must be a function');
  if (errors.length > 0) logger.warn('Invalid options', { errors });
  return errors.length === 0;
}

function _escapeHtml(str: string) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

export function createBreadcrumb(container: HTMLElement, options: Record<string, any> = {}) {
  _validateOptions(options);
  const { separator = '/', maxItems = 5, onNavigate, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;

  let _initialized = false;
  let _items: unknown[] = [];
  let _breadcrumbEl: HTMLElement | null = null;
  let _linkHandlers: { link: Element; handler: (e: Event) => void }[] = [];

  function _createBreadcrumbElement() {
    const header = container.querySelector('.dsd-container__header');
    if (!header) return null;
    let existing = container.querySelector('.dsd-breadcrumb') as HTMLElement | null;
    if (existing) return existing;
    const breadcrumb = document.createElement('nav');
    breadcrumb.className = 'dsd-breadcrumb';
    breadcrumb.setAttribute('aria-label', 'Navegação estrutural');
    const list = document.createElement('ol');
    list.className = 'dsd-breadcrumb__list';
    list.setAttribute('role', 'list');
    breadcrumb.appendChild(list);
    const tabBar = container.querySelector('.dsd-tab-bar');
    const insertAfter = tabBar || header;
    (insertAfter as HTMLElement).insertAdjacentElement('afterend', breadcrumb);
    return breadcrumb;
  }

  function _clearLinkHandlers() {
    _linkHandlers.forEach(({ link, handler }) => link.removeEventListener('click', handler as EventListener));
    _linkHandlers = [];
  }

  function _handleNavigation(item: Record<string, unknown>) {
    if (item.panelId || item.route || item.href) {
      const route = item.route || item.href || item.panelId;
      _emitEvent(NAV_INTENTS.NAVIGATE, { route, panelId: item.panelId || null, meta: { source: MODULE_ID, itemId: item.id, itemLabel: item.label, containerId: container.id } });
    }
    _emitEvent(MAIN_EVENTS.BREADCRUMB_NAVIGATE, { item, containerId: container.id });
    onNavigate?.(item);
  }

  function _render() {
    if (!_breadcrumbEl) return;
    const list = _breadcrumbEl.querySelector('.dsd-breadcrumb__list');
    if (!list) return;
    _clearLinkHandlers();
    list.innerHTML = '';

    let displayItems = _items;
    if (_items.length > maxItems) {
      displayItems = [_items[0], { id: 'ellipsis', label: '...', disabled: true }, ..._items.slice(-maxItems + 2)];
    }

    displayItems.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'dsd-breadcrumb__item';
      const isLast = index === displayItems.length - 1;

      const safeLabel = _escapeHtml((item as Record<string, string>).label);
      const safeHref = _escapeHtml((item as Record<string, string>).href || '#');
      const safeId = _escapeHtml((item as Record<string, string>).id);
      if ((item as Record<string, unknown>).id === 'ellipsis') {
        li.innerHTML = `<span class="dsd-breadcrumb__ellipsis" aria-hidden="true">${safeLabel}</span>`;
      } else if (isLast || (item as Record<string, unknown>).disabled) {
        li.innerHTML = `<span class="dsd-breadcrumb__text ${isLast ? 'dsd-breadcrumb__text--current' : ''}" ${isLast ? 'aria-current="page"' : ''}>${(item as Record<string, unknown>).icon ? `<span class="dsd-breadcrumb__icon" aria-hidden="true">${(item as Record<string, unknown>).icon}</span>` : ''}${safeLabel}</span>`;
      } else {
        li.innerHTML = `<a href="${safeHref}" class="dsd-breadcrumb__link" data-id="${safeId}">${(item as Record<string, unknown>).icon ? `<span class="dsd-breadcrumb__icon" aria-hidden="true">${(item as Record<string, unknown>).icon}</span>` : ''}${safeLabel}</a>`;
        const link = li.querySelector('.dsd-breadcrumb__link');
        if (link) {
          const handler = (e: Event) => { e.preventDefault(); _handleNavigation(item as Record<string, unknown>); };
          link.addEventListener('click', handler);
          _linkHandlers.push({ link, handler });
        }
      }

      if (index < displayItems.length - 1) {
        const sep = document.createElement('span');
        sep.className = 'dsd-breadcrumb__separator';
        sep.setAttribute('aria-hidden', 'true');
        sep.setAttribute('role', 'presentation');
        sep.textContent = separator;
        li.appendChild(sep);
      }
      list.appendChild(li);
    });
  }

  const breadcrumb = {
    init() {
      if (_initialized) return this;
      _breadcrumbEl = _createBreadcrumbElement();
      _render();
      _initialized = true;
      return this;
    },
    setItems(items: unknown) {
      if (!Array.isArray(items)) return this;
      _items = items.map((item, index) => ({
        id: item.id || `item-${index}`,
        label: item.label || item,
        icon: item.icon || '',
        href: item.href || '#',
        panelId: item.panelId || null,
        route: item.route || null,
        disabled: item.disabled || false,
        data: item.data || {}
      }));
      _render();
      return this;
    },
    push(item: Record<string, unknown>) {
      if (!item) return this;
      _items.push({
        id: item.id || `item-${_items.length}`,
        label: item.label || item,
        icon: item.icon || '',
        href: item.href || '#',
        panelId: item.panelId || null,
        route: item.route || null,
        data: item.data || {}
      });
      _render();
      return this;
    },
    pop() { const item = _items.pop(); _render(); return item; },
    navigateTo(itemId: string) {
      const index = _items.findIndex(item => (item as Record<string, unknown>).id === itemId);
      if (index !== -1) { _items = _items.slice(0, index + 1); _render(); }
      return this;
    },
    clear() { _items = []; _render(); return this; },
    getItems() { return [..._items]; },
    isInitialized() { return _initialized; },
    destroy() { _clearLinkHandlers(); (_breadcrumbEl as HTMLElement | null)?.remove(); _breadcrumbEl = null; _items = []; _initialized = false; },
    healthCheck() {
      return { status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, itemCount: _items.length, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true };
    }
  };
  return breadcrumb;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true }; }

export default { createBreadcrumb, injectEventBus, info, healthCheck, VERSION, MODULE_ID };
