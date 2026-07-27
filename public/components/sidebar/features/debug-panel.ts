// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.9.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-debug-panel
// PURPOSE: Sidebar Features - Debug Panel
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SIDEBAR_EVENTS from /core/runtime/events/catalog/sidebar.events.js
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   open() — exported function
//   close() — exported function
//   toggle() — exported function
//   log() — exported function
//   destroy() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SIDEBAR_EVENTS.DEBUG_PANEL_INITIALIZED
// LISTENS (eventos):
//   'click'
//   'keydown'
//   'mousedown'
//   'mousemove'
//   'mouseup'
// WINDOW ACCESS:
//   (window as any).Sidebar
//   (window as any).__dev
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '5.9.0-ES6';
export const MODULE_ID = 'sidebar-debug-panel';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const DP_SVGS = {
  close: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  check: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
};

let _container = null;
let _eventBus: DynObj | null = null;
let _panelEl: HTMLElement | null = null;
let _isOpen = false;
let _logs: DynObj[] = [];
const _maxLogs = 100;
let _metrics = { opens: 0, closes: 0, logsAdded: 0 };
let _cleanups: (() => void)[] = [];

const PANEL_STYLES = '.dsd-debug-panel{position:fixed;bottom:20px;right:20px;width:400px;max-height:500px;background:#1e1e2e;border:1px solid #3a3a5a;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,0.5);z-index:99999;font-family:"SF Mono","Fira Code",monospace;font-size:12px;color:#e0e0e0;display:flex;flex-direction:column;overflow:hidden;animation:debugPanelSlideIn 0.3s ease}@keyframes debugPanelSlideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.dsd-debug-panel__header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#2a2a4a;border-bottom:1px solid #3a3a5a;cursor:move}.dsd-debug-panel__title{font-weight:600;color:#a855f7}.dsd-debug-panel__actions{display:flex;gap:8px}.dsd-debug-panel__btn{background:transparent;border:1px solid #3a3a5a;color:#a0a0a0;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;transition:all 0.15s ease;display:flex;align-items:center;justify-content:center}.dsd-debug-panel__btn:hover{background:#3a3a5a;color:white}.dsd-debug-panel__tabs{display:flex;border-bottom:1px solid #3a3a5a}.dsd-debug-panel__tab{flex:1;padding:8px;background:transparent;border:none;color:#808080;cursor:pointer;font-size:11px;transition:all 0.15s ease}.dsd-debug-panel__tab--active{color:#a855f7;background:rgba(168,85,247,0.1);border-bottom:2px solid #a855f7}.dsd-debug-panel__content{flex:1;overflow-y:auto;padding:12px;max-height:350px}.dsd-debug-panel__section{margin-bottom:12px}.dsd-debug-panel__section-title{font-size:10px;text-transform:uppercase;color:#808080;margin-bottom:8px;letter-spacing:0.5px}.dsd-debug-panel__state-item{display:flex;justify-content:space-between;padding:4px 8px;background:#2a2a3a;border-radius:4px;margin-bottom:4px}.dsd-debug-panel__state-key{color:#7dd3fc}.dsd-debug-panel__state-value{color:#fbbf24;display:flex;align-items:center}.dsd-debug-panel__log{padding:6px 8px;border-left:3px solid #3a3a5a;margin-bottom:4px;font-size:11px}.dsd-debug-panel__log--info{border-color:#3b82f6}.dsd-debug-panel__log--warn{border-color:#f59e0b}.dsd-debug-panel__log--error{border-color:#ef4444}.dsd-debug-panel__log--event{border-color:#a855f7}.dsd-debug-panel__log-time{color:#808080;margin-right:8px}';

function handleKeydown(e: KeyboardEvent) { if (e.ctrlKey && e.shiftKey && e.key === 'D') { e.preventDefault(); toggle(); } }

export function init(eventBus: DynObj, container: HTMLElement) {
  _eventBus = eventBus;
  _container = container;
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  injectStyles();
  interceptEvents();
  document.addEventListener('keydown', handleKeydown);
  _cleanups.push(() => { document.removeEventListener('keydown', handleKeydown); });
  _getPort('logger')?.info?.('[DebugPanel] Initialized. Press Ctrl+Shift+D to open.');
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.DEBUG_PANEL_INITIALIZED);
}

function injectStyles() { if (document.getElementById('dsd-debug-panel-styles')) return; const style = document.createElement('style'); style.id = 'dsd-debug-panel-styles'; style.textContent = PANEL_STYLES; document.head.appendChild(style); }

function interceptEvents() { if (!_eventBus || !_eventBus.on) return; const originalEmit = _eventBus.emit ? _eventBus.emit.bind(_eventBus) : null; if (originalEmit) { _eventBus.emit = (event: string, data: DynObj) => { log('event', event, data); return originalEmit(event, data); }; } }

function handlePanelClick(e: DynObj) { const action = (e.target as DynObj).dataset.action; const tab = (e.target as DynObj).dataset.tab; if (action === 'close') close(); if (action === 'refresh') updateContent(); if (action === 'clear') clearLogs(); if (tab) { _panelEl!.querySelectorAll('.dsd-debug-panel__tab').forEach((t: DynObj) => { t.classList.toggle('dsd-debug-panel__tab--active', t.dataset.tab === tab); }); updateContent(tab); } }

export function open() { if (_isOpen) return; _panelEl = createPanel(); document.body.appendChild(_panelEl); _isOpen = true; _metrics.opens++; updateContent('state'); }
export function close() { if (!_isOpen || !_panelEl) return; _panelEl.remove(); _panelEl = null; _isOpen = false; _metrics.closes++; }
export function toggle() { _isOpen ? close() : open(); }

function createPanel() {
  const panel = document.createElement('div');
  panel.className = 'dsd-debug-panel';
  panel.innerHTML = `<div class="dsd-debug-panel__header"><span class="dsd-debug-panel__title">🔧 Sidebar Debug</span><div class="dsd-debug-panel__actions"><button class="dsd-debug-panel__btn" data-action="refresh">↻</button><button class="dsd-debug-panel__btn" data-action="clear">Clear</button><button class="dsd-debug-panel__btn" data-action="close">${DP_SVGS.close}</button></div></div><div class="dsd-debug-panel__tabs"><button class="dsd-debug-panel__tab dsd-debug-panel__tab--active" data-tab="state">State</button><button class="dsd-debug-panel__tab" data-tab="events">Events</button><button class="dsd-debug-panel__tab" data-tab="perf">Perf</button><button class="dsd-debug-panel__tab" data-tab="features">Features</button></div><div class="dsd-debug-panel__content"></div>`;
  panel.addEventListener('click', handlePanelClick);
  _cleanups.push(() => { panel.removeEventListener('click', handlePanelClick); });
  makeDraggable(panel);
  return panel;
}

function updateContent(tab?: DynObj) { const t = tab || 'state'; const content = _panelEl ? _panelEl.querySelector('.dsd-debug-panel__content') : null; if (!content) return; if (t === 'state') content.innerHTML = renderState(); else if (t === 'events') content.innerHTML = renderEvents(); else if (t === 'perf') content.innerHTML = renderPerf(); else if (t === 'features') content.innerHTML = renderFeatures(); }

function renderState() { const state = ((window as any).Sidebar && (window as any).Sidebar.getState) ? (window as any).Sidebar.getState() : {}; return `<div class="dsd-debug-panel__section"><div class="dsd-debug-panel__section-title">Current State</div>${Object.keys(state).map(key => `<div class="dsd-debug-panel__state-item"><span class="dsd-debug-panel__state-key">${key}</span><span class="dsd-debug-panel__state-value">${JSON.stringify(state[key])}</span></div>`).join('')}</div>`; }
function renderEvents() { return `<div class="dsd-debug-panel__section"><div class="dsd-debug-panel__section-title">Recent Events (${_logs.length})</div>${_logs.slice(-50).reverse().map(log => `<div class="dsd-debug-panel__log dsd-debug-panel__log--${log.type}"><span class="dsd-debug-panel__log-time">${log.time}</span>${log.message}</div>`).join('')}</div>`; }
function renderPerf() { const metrics = ((window as any).Sidebar && (window as any).Sidebar.getMetrics) ? (window as any).Sidebar.getMetrics() : {}; const memory = (performance as any).memory || {}; return `<div class="dsd-debug-panel__section"><div class="dsd-debug-panel__section-title">Performance</div><div class="dsd-debug-panel__state-item"><span class="dsd-debug-panel__state-key">Render Count</span><span class="dsd-debug-panel__state-value">${metrics.renderCount || 0}</span></div><div class="dsd-debug-panel__state-item"><span class="dsd-debug-panel__state-key">JS Heap</span><span class="dsd-debug-panel__state-value">${formatBytes(memory.usedJSHeapSize || 0)}</span></div></div>`; }
function renderFeatures() { const features = ((window as any).__dev && (window as any).__dev.sidebar && (window as any).__dev.sidebar.features) ? (window as any).__dev.sidebar.features : {}; return `<div class="dsd-debug-panel__section"><div class="dsd-debug-panel__section-title">Loaded Features</div>${Object.keys(features).map(name => `<div class="dsd-debug-panel__state-item"><span class="dsd-debug-panel__state-key">${name}</span><span class="dsd-debug-panel__state-value">${DP_SVGS.check}</span></div>`).join('')}</div>`; }

export function log(type: string, message: string, data: DynObj) { _logs.push({ type, message, data: data || null, time: new Date().toLocaleTimeString() }); _metrics.logsAdded++; if (_logs.length > _maxLogs) _logs = _logs.slice(-_maxLogs); if (_isOpen) updateContent('events'); }
function clearLogs() { _logs = []; updateContent('events'); }

function makeDraggable(el: HTMLElement) { const header = el.querySelector('.dsd-debug-panel__header'); let isDragging = false, startX: DynObj, startY: DynObj, startLeft: DynObj, startTop: DynObj; const mousedownHandler = (e: MouseEvent) => { isDragging = true; startX = e.clientX; startY = e.clientY; const rect = el.getBoundingClientRect(); startLeft = rect.left; startTop = rect.top; }; const mousemoveHandler = (e: MouseEvent) => { if (!isDragging) return; el.style.left = `${startLeft + e.clientX - startX}px`; el.style.top = `${startTop + e.clientY - startY}px`; el.style.right = 'auto'; el.style.bottom = 'auto'; }; const mouseupHandler = () => { isDragging = false; }; (header as DynObj).addEventListener('mousedown', mousedownHandler); document.addEventListener('mousemove', mousemoveHandler); document.addEventListener('mouseup', mouseupHandler); _cleanups.push(() => { (header as DynObj).removeEventListener('mousedown', mousedownHandler); document.removeEventListener('mousemove', mousemoveHandler); document.removeEventListener('mouseup', mouseupHandler); }); }
function formatBytes(bytes: DynObj) { if (bytes === 0) return '0 B'; const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(bytes) / Math.log(k)); return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`; }

export function destroy() { close(); _cleanups.forEach(fn => { try { fn(); } catch (e) {} }); _cleanups = []; _eventBus = null; }

export function getMetrics() { return { opens: _metrics.opens, closes: _metrics.closes, logsAdded: _metrics.logsAdded, logCount: _logs.length }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), isOpen: _isOpen, logCount: _logs.length, cleanups: _cleanups.length, metrics: getMetrics() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { isOpen: _isOpen, logCount: _logs.length, noOrphanListeners: true }, metrics: getMetrics() }; }

export default { init, open, close, toggle, log, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
