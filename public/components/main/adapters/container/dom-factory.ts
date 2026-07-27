// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.0.0-UNIFIED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-container-dom-factory
// PURPOSE: ContainerAdapter - DOM Factory (AAA)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   STATE, DOCK_SLOTS from ./constants.js
//   validateVariant from ./helpers.js
//
// PROVIDES:
//   initDOMFactory() — exported function
//   ensureDockSlots() — exported function
//   getSlotElement() — exported function
//   createContainerElement() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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

const MODULE_ID = 'main-container-dom-factory';
const VERSION = '8.0.0-UNIFIED';

import { STATE, DOCK_SLOTS } from './constants.js';
import { validateVariant } from './helpers.js';

const DF_SVGS = {
  chevronDown: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>'
};

let _domAdapter: Record<string, unknown> | null = null;

export function initDOMFactory(domAdapter: Record<string, unknown>) {
  if (!domAdapter) throw new Error('[dom-factory] DOMAdapter é obrigatório');
  _domAdapter = domAdapter;
  return true;
}

function _createElement(tagName: string, options: Record<string, unknown> = {}): HTMLElement {
  const opts = options || {};
  if (_domAdapter) return (_domAdapter.createElement as (tag: string, opts: Record<string, unknown>) => HTMLElement)(tagName, opts);
  const el = document.createElement(tagName);
  if (opts.className) el.className = opts.className as string;
  if (opts.id) el.id = opts.id as string;
  if (opts.textContent) el.textContent = opts.textContent as string;
  if (opts.innerHTML) el.innerHTML = opts.innerHTML as string;
  if (opts.type) (el as HTMLInputElement).type = opts.type as string;
  if (opts.title) el.title = opts.title as string;
  if (opts.attributes) { const attrs = opts.attributes as Record<string, string>; for (const key in attrs) { if (attrs.hasOwnProperty(key)) el.setAttribute(key, attrs[key]); } }
  return el;
}

function _querySelector(selector: string, context: HTMLElement | null = null): HTMLElement | null {
  if (_domAdapter) return (_domAdapter.querySelector as (sel: string, ctx: HTMLElement | null) => HTMLElement | null)(selector, context);
  return (context ? context.querySelector(selector) : document.querySelector(selector)) as HTMLElement | null;
}

export function ensureDockSlots(host: HTMLElement) {
  if (!host) return false;
  const slotOrder = [DOCK_SLOTS.PRIMARY, DOCK_SLOTS.SECONDARY, DOCK_SLOTS.TERTIARY];
  slotOrder.forEach(slotName => {
    if (!_querySelector(`[data-dock-slot="${slotName}"]`, host)) {
      const slotEl = _createElement('div', { className: `dsd-dock-slot dsd-dock-slot--${slotName}`, attributes: { 'data-dock-slot': slotName } });
      host.insertBefore(slotEl, host.firstChild);
    }
  });
  const slots = slotOrder.map((s: string) => _querySelector(`[data-dock-slot="${s}"]`, host)).filter(Boolean) as HTMLElement[];
  for (let i = slots.length - 1; i >= 0; i--) host.insertBefore(slots[i], host.firstChild);
  return true;
}

export function getSlotElement(host: HTMLElement, slotName: string) {
  ensureDockSlots(host);
  return _querySelector(`[data-dock-slot="${slotName}"]`, host) || host;
}

export function createContainerElement(options: Record<string, unknown>) {
  const opts = options || {};
  const id = opts.id;
  const title = opts.title || '';
  const variant = (opts.variant as string) || 'default';
  const collapsible = opts.collapsible !== false;
  const defaultCollapsed = opts.defaultCollapsed || false;
  const safeVariant = validateVariant(variant);
  const collapsedClass = defaultCollapsed ? ' dsd-container--collapsed' : '';

  const rootEl = _createElement('div', { className: `dsd-container dsd-container--${safeVariant}${collapsedClass}`, attributes: { 'data-container-id': id, 'data-variant': safeVariant, 'data-state': STATE.CREATING.toLowerCase(), 'data-active': 'false', 'data-dock-slot': '', 'data-layout-mode': 'inherit', 'role': 'region', 'aria-labelledby': `${id}-header` } });

  const headerEl = _createElement('div', { className: 'dsd-container__header', id: `${id}-header` });
  const headerLeft = _createElement('div', { className: 'dsd-container__header-left' });
  if (title) headerLeft.appendChild(_createElement('span', { className: 'dsd-container__title', textContent: title }));

  const headerRight = _createElement('div', { className: 'dsd-container__header-right' });

  if (collapsible) {
    const toggleBtn = _createElement('button', { className: 'dsd-container__toggle', type: 'button', title: 'Minimizar/Expandir', attributes: { 'aria-expanded': defaultCollapsed ? 'false' : 'true', 'aria-controls': `${id}-content` } });
    toggleBtn.appendChild(_createElement('span', { className: 'dsd-container__toggle-icon', innerHTML: DF_SVGS.chevronDown }));
    headerRight.appendChild(toggleBtn);
  }

  headerEl.appendChild(headerLeft);
  headerEl.appendChild(headerRight);

  const bodyEl = _createElement('div', { className: 'dsd-container__body', id: `${id}-content` });
  const contentEl = _createElement('div', { className: 'dsd-container__content' });
  bodyEl.appendChild(contentEl);

  const footerEl = _createElement('div', { className: 'dsd-container__footer' });
  const loadingEl = _createElement('div', { className: 'dsd-container__loading', attributes: { 'aria-hidden': 'true' } });
  loadingEl.appendChild(_createElement('div', { className: 'dsd-container__spinner' }));
  const errorEl = _createElement('div', { className: 'dsd-container__error', attributes: { 'role': 'alert', 'aria-live': 'polite' } });

  rootEl.appendChild(headerEl);
  rootEl.appendChild(bodyEl);
  rootEl.appendChild(footerEl);
  rootEl.appendChild(loadingEl);
  rootEl.appendChild(errorEl);

  return { rootEl, contentEl };
}

export function info() { return { version: VERSION, moduleId: MODULE_ID, initialized: !!_domAdapter }; }

export function healthCheck() {
  const initialized = !!_domAdapter;
  return { status: initialized ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { initialized, domAdapterInfo: (_domAdapter && typeof _domAdapter.info === 'function') ? (_domAdapter.info as () => Record<string, unknown>)() : null } };
}

export { MODULE_ID, VERSION };

export default { MODULE_ID, VERSION, initDOMFactory, ensureDockSlots, getSlotElement, createContainerElement, info, healthCheck };
