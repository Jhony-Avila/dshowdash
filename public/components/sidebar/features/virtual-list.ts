// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-virtual-list
// PURPOSE: Sidebar Features - Virtual List
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SIDEBAR_EVENTS from /core/runtime/events/catalog/sidebar.events.js
//   createUiPorts from /core/runtime/ports-profiles.js
//   CSS_CLASSES as C from ../ui/constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   enable() — exported function
//   disable() — exported function
//   scrollToItem() — exported function
//   updateItem() — exported function
//   addItem() — exported function
//   removeItem() — exported function
//   getState() — exported function
//   isEnabled() — exported function
//   getItems() — exported function
//   setItems() — exported function
//   destroy() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SIDEBAR_EVENTS.VIRTUAL_DISABLED
//   SIDEBAR_EVENTS.VIRTUAL_ENABLED
//   SIDEBAR_EVENTS.VIRTUAL_INITIALIZED
//   SIDEBAR_EVENTS.VIRTUAL_UPDATED
// LISTENS (eventos):
//   'scroll'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { CSS_CLASSES as C } from '../ui/constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '6.1.0-ES6';
export const MODULE_ID = 'sidebar-virtual-list';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _container: HTMLElement | null = null;
let _config = { itemHeight: 40, bufferSize: 5, threshold: 50 };
let _state = { items: [] as DynObj[], visibleItems: [] as DynObj[], scrollTop: 0, startIndex: 0, endIndex: 0, totalHeight: 0, enabled: false };
let _cleanup: (() => void) | null = null;
let _metrics = { enables: 0, disables: 0, renders: 0 };

export function init(eventBus: DynObj, container: HTMLElement, config: DynObj) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  _container = container;
  _config = Object.assign({}, _config, config || {});
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.VIRTUAL_INITIALIZED);
}

export function enable(items: DynObj[]) {
  if (!_container || items.length < _config.threshold) return false;
  _metrics.enables++;
  _state.items = items;
  _state.enabled = true;
  _state.totalHeight = items.length * _config.itemHeight;
  const wrapper = createVirtualWrapper();
  const scrollContainer = _container.querySelector(`.${C.NAV_CONTENT}, .${C.NAV}`);
  if (!scrollContainer) return false;
  const originalContent = scrollContainer.innerHTML;
  scrollContainer.innerHTML = '';
  scrollContainer.appendChild(wrapper);
  const scrollHandler = () => { handleScroll(scrollContainer, wrapper); };
  scrollContainer.addEventListener('scroll', scrollHandler, { passive: true });
  updateVisibleItems(scrollContainer, wrapper);
  _cleanup = () => { scrollContainer.removeEventListener('scroll', scrollHandler); scrollContainer.innerHTML = originalContent; _state.enabled = false; };
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.VIRTUAL_ENABLED, { itemCount: items.length });
  return true;
}

export function disable() { _metrics.disables++; _cleanup?.(); _cleanup = null; _state.enabled = false; const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.VIRTUAL_DISABLED); }

function createVirtualWrapper() { const wrapper = document.createElement('div'); wrapper.className = 'dsd-virtual-list'; wrapper.style.cssText = `position:relative;height:${_state.totalHeight}px;overflow:hidden;`; const content = document.createElement('div'); content.className = 'dsd-virtual-list__content'; content.style.cssText = 'position:absolute;left:0;right:0;will-change:transform;'; wrapper.appendChild(content); return wrapper; }

function handleScroll(scrollContainer: DynObj, wrapper: HTMLElement) { if (!_state.enabled) return; requestAnimationFrame(() => { updateVisibleItems(scrollContainer, wrapper); }); }

function updateVisibleItems(scrollContainer: DynObj, wrapper: HTMLElement) {
  _metrics.renders++;
  const scrollTop = scrollContainer.scrollTop;
  const viewportHeight = scrollContainer.clientHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / _config.itemHeight) - _config.bufferSize);
  const endIndex = Math.min(_state.items.length, Math.ceil((scrollTop + viewportHeight) / _config.itemHeight) + _config.bufferSize);
  if (startIndex === _state.startIndex && endIndex === _state.endIndex) return;
  _state.startIndex = startIndex;
  _state.endIndex = endIndex;
  _state.scrollTop = scrollTop;
  const content = wrapper.querySelector('.dsd-virtual-list__content');
  if (!content) return;
  const fragment = document.createDocumentFragment();
  for (let i = startIndex; i < endIndex; i++) { const item = _state.items[i]; if (!item) continue; const itemEl = renderItem(item, i); fragment.appendChild(itemEl); }
  content.innerHTML = '';
  content.appendChild(fragment);
  (content as DynObj).style.transform = `translateY(${startIndex * _config.itemHeight}px)`;
  _state.visibleItems = _state.items.slice(startIndex, endIndex);
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.VIRTUAL_UPDATED, { startIndex, endIndex, visibleCount: endIndex - startIndex });
}

function renderItem(item: DynObj, index: number) {
  const el = document.createElement('div');
  el.className = `${C.ITEM} dsd-virtual-list__item`;
  el.style.height = `${_config.itemHeight}px`;
  (el as DynObj).dataset.itemId = item.id;
  el.dataset.virtualIndex = index as DynObj;
  const isActive = item.active || item.id === getActiveItemId();
  if (isActive) el.classList.add(C.ITEM_ACTIVE);
  el.innerHTML = `<a class="${C.LINK}" href="${item.route || '#'}" tabindex="${isActive ? 0 : -1}">${item.icon ? `<span class="${C.ITEM_ICON}" aria-hidden="true">${item.icon}</span>` : ''}<span class="${C.ITEM_TEXT}">${item.label}</span>${item.badge ? `<span class="${C.BADGE}">${item.badge}</span>` : ''}</a>`;
  return el;
}

function getActiveItemId() { return (_container?.querySelector(`.${C.ITEM_ACTIVE}`) as DynObj)?.dataset?.itemId; }

export function scrollToItem(itemId: string) { const index = _state.items.findIndex(item => item.id === itemId); if (index === -1) return false; const scrollContainer = _container?.querySelector(`.${C.NAV_CONTENT}, .${C.NAV}`); if (!scrollContainer) return false; const targetScroll = index * _config.itemHeight; scrollContainer.scrollTo({ top: targetScroll, behavior: 'smooth' }); return true; }
export function updateItem(itemId: string, updates: DynObj) { const index = _state.items.findIndex(item => item.id === itemId); if (index === -1) return false; _state.items[index] = Object.assign({}, _state.items[index], updates); if (index >= _state.startIndex && index < _state.endIndex) { const scrollContainer = _container?.querySelector(`.${C.NAV_CONTENT}, .${C.NAV}`); const wrapper = _container?.querySelector('.dsd-virtual-list'); if (scrollContainer && wrapper) updateVisibleItems(scrollContainer, (wrapper as DynObj)); } return true; }
export function addItem(item: DynObj, index: number) { if (index === undefined || index === -1) _state.items.push(item); else _state.items.splice(index, 0, item); _state.totalHeight = _state.items.length * _config.itemHeight; const wrapper = _container?.querySelector('.dsd-virtual-list'); if (wrapper) (wrapper as DynObj).style.height = `${_state.totalHeight}px`; return true; }
export function removeItem(itemId: string) { const index = _state.items.findIndex(item => item.id === itemId); if (index === -1) return false; _state.items.splice(index, 1); _state.totalHeight = _state.items.length * _config.itemHeight; const wrapper = _container?.querySelector('.dsd-virtual-list'); if (wrapper) (wrapper as DynObj).style.height = `${_state.totalHeight}px`; const scrollContainer = _container?.querySelector(`.${C.NAV_CONTENT}, .${C.NAV}`); if (scrollContainer && wrapper) updateVisibleItems(scrollContainer, (wrapper as DynObj)); return true; }
export function getState() { return { enabled: _state.enabled, totalItems: _state.items.length, visibleItems: _state.visibleItems.length, startIndex: _state.startIndex, endIndex: _state.endIndex, totalHeight: _state.totalHeight, itemHeight: _config.itemHeight }; }
export function isEnabled() { return _state.enabled; }
// @ts-expect-error strict migration — TS2769
export function getItems() { return [].concat(_state.items); }
export function setItems(items: DynObj[]) { const wasEnabled = _state.enabled; if (wasEnabled) disable(); if (wasEnabled && items.length >= _config.threshold) enable(items); else _state.items = items; }
export function destroy() { disable(); _state = { items: [], visibleItems: [], scrollTop: 0, startIndex: 0, endIndex: 0, totalHeight: 0, enabled: false }; }
export function getMetrics() { return { ..._metrics, ...getState() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), state: getState(), metrics: getMetrics() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { enabled: _state.enabled, itemCount: _state.items.length, visibleCount: _state.visibleItems.length, threshold: _config.threshold }, metrics: getMetrics() }; }

export default { init, enable, disable, scrollToItem, updateItem, addItem, removeItem, getState, isEnabled, getItems, setItems, healthCheck, destroy, injectPorts, getPorts, getMetrics, info, VERSION, MODULE_ID };
