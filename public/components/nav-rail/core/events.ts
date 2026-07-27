// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail/core/events
// PURPOSE: NavRail Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//   LOCAL_EVENTS, createEventPayload from ./contracts.js
//   NAVRAIL_INTENTS from /core/runtime/events/catalog/navrail.events.js
//   NAV_EVENTS from /core/runtime/events/catalog/nav.events.js
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   NavRailEvents — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   eventName — event emission
//   intentType — event emission
//
// LISTENS (eventos):
//   NAVRAIL_INTENTS.HIDE — event listener
//   NAVRAIL_INTENTS.REORDER — event listener
//   NAVRAIL_INTENTS.SHOW — event listener
//   NAVRAIL_INTENTS.TOGGLE — event listener
//   UI_EVENTS.ACTION — event listener
//
// WINDOW ACCESS:
//   window.NavRailTracker — runtime access
// ═══════════════════════════════════════════════════════════════
'use strict';

import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';
import { LOCAL_EVENTS, createEventPayload } from './contracts.js';
import { NAVRAIL_INTENTS } from '/core/runtime/events/catalog/navrail.events.js';
import { NAV_EVENTS } from '/core/runtime/events/catalog/nav.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '5.1.0-ES6';
const MODULE_ID = 'navrail/core/events';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

const NavRailEvents = {
  _root: null as HTMLElement | null,
  _uiActionHandler: null as ((payload: Record<string, unknown>) => void) | null,
  _intentHandlers: {} as Record<string, (payload: Record<string, unknown>) => void>,
  _initialized: false,

  init(root: HTMLElement) {
    if (this._initialized) return this;
    this._root = root;
    this._bindUIActionListener();
    this._bindIntentListeners();
    this._initialized = true;
    return this;
  },

  _bindUIActionListener() {
    const self = this;
    const eb = _getPort('eventBus');
    if (!eb || !eb.on) return;
    this._uiActionHandler = (payload: Record<string, unknown>) => {
      const actionId = payload && payload.actionId ? String(payload.actionId) : null;
      const meta = (payload && payload.meta ? payload.meta : {}) as Record<string, unknown>;
      if (!actionId || actionId.indexOf('navrail:') !== 0) return;
      const itemId = actionId.replace('navrail:', '');
      const panelId = meta.panelId as string | undefined;
      const route = meta.route as string | undefined;
      const group = meta.group as string | undefined;
      if (itemId === 'toggle-sidebar') {
        self._emit(LOCAL_EVENTS.TOGGLE_SIDEBAR, { itemId });
        self._emitNavIntent('ui.action', { action: 'sidebar.toggle', source: 'navrail' });
        return;
      }
      self._emitNavIntent(NAV_EVENTS.NAVIGATE_PATH, {
        itemId,
        path: route || `#/${itemId}`,
        panelId: panelId || `panel-${itemId}`,
        source: 'navrail'
      });
      self._emit(LOCAL_EVENTS.ITEM_CLICK, { itemId, panelId, group, route });
    };
    eb.on(UI_EVENTS.ACTION, this._uiActionHandler);
  },

  _bindIntentListeners() {
    const self = this;
    const eb = _getPort('eventBus');
    if (!eb || !eb.on) return;
    this._intentHandlers.show = (payload: Record<string, unknown>) => {
      if (self._root) {
        self._root.classList.remove('nav-rail--hidden');
        self._root.setAttribute('aria-hidden', 'false');
      }
      self._emit(LOCAL_EVENTS.READY, { action: 'show', source: payload && payload.source });
    };
    eb.on(NAVRAIL_INTENTS.SHOW, this._intentHandlers.show);
    this._intentHandlers.hide = (payload: Record<string, unknown>) => {
      if (self._root) {
        self._root.classList.add('nav-rail--hidden');
        self._root.setAttribute('aria-hidden', 'true');
      }
      self._emit(LOCAL_EVENTS.READY, { action: 'hide', source: payload && payload.source });
    };
    eb.on(NAVRAIL_INTENTS.HIDE, this._intentHandlers.hide);
    this._intentHandlers.toggle = (payload: Record<string, unknown>) => {
      if (self._root) {
        const isHidden = self._root.classList.contains('nav-rail--hidden');
        if (isHidden) {
          self._root.classList.remove('nav-rail--hidden');
          self._root.setAttribute('aria-hidden', 'false');
        } else {
          self._root.classList.add('nav-rail--hidden');
          self._root.setAttribute('aria-hidden', 'true');
        }
      }
      self._emit(LOCAL_EVENTS.READY, { action: 'toggle', source: payload && payload.source });
    };
    eb.on(NAVRAIL_INTENTS.TOGGLE, this._intentHandlers.toggle);
    this._intentHandlers.reorder = (payload: Record<string, unknown>) => {
      const order = payload && payload.order ? payload.order : [];
      self._emit(LOCAL_EVENTS.READY, { action: 'reorder', order, source: payload && payload.source });
    };
    eb.on(NAVRAIL_INTENTS.REORDER, this._intentHandlers.reorder);
  },

  _emitNavIntent(intentType: string, data: Record<string, unknown>) {
    const eb = _getPort('eventBus');
    if (!eb || !eb.emit) return;
    const payload = {
      type: intentType,
      timestamp: Date.now(),
      source: 'navrail',
      data
    };
    eb.emit(intentType, payload);
  },

  _emit(eventName: string, data?: Record<string, unknown>) {
    if (!data) data = {};
    const payload = createEventPayload(eventName, data);
    const eb = _getPort('eventBus');
    if (eb && eb.emit) eb.emit(eventName, payload);
    if (this._root) this._root.dispatchEvent(new CustomEvent(eventName, { detail: payload, bubbles: true }));
    if (typeof window !== 'undefined' && (window as any).NavRailTracker && (window as any).NavRailTracker.track) (window as any).NavRailTracker.track(eventName, data);
  },

  emit(eventName: string, data?: Record<string, unknown>) { this._emit(eventName, data); },

  destroy() {
    const eb = _getPort('eventBus');
    if (eb && eb.off) {
      if (this._uiActionHandler) eb.off(UI_EVENTS.ACTION, this._uiActionHandler);
      if (this._intentHandlers.show) eb.off(NAVRAIL_INTENTS.SHOW, this._intentHandlers.show);
      if (this._intentHandlers.hide) eb.off(NAVRAIL_INTENTS.HIDE, this._intentHandlers.hide);
      if (this._intentHandlers.toggle) eb.off(NAVRAIL_INTENTS.TOGGLE, this._intentHandlers.toggle);
      if (this._intentHandlers.reorder) eb.off(NAVRAIL_INTENTS.REORDER, this._intentHandlers.reorder);
    }
    this._root = null;
    this._uiActionHandler = null;
    this._intentHandlers = {};
    this._initialized = false;
  },

  healthCheck() {
    return {
      status: this._initialized ? 'HEALTHY' : 'NOT_INITIALIZED',
      hasEventBus: !!_getPort('eventBus'),
      hasRoot: !!this._root,
      intentListenersActive: Object.keys(this._intentHandlers).length,
      portsInitialized: Ports.isInitialized(),
      version: VERSION,
      moduleId: MODULE_ID
    };
  },

  info() {
    return {
      version: VERSION,
      moduleId: MODULE_ID,
      initialized: this._initialized,
      listeningTo: [UI_EVENTS.ACTION, NAVRAIL_INTENTS.SHOW, NAVRAIL_INTENTS.HIDE, NAVRAIL_INTENTS.TOGGLE, NAVRAIL_INTENTS.REORDER],
      // @ts-expect-error strict migration — TS2769
      emits: [].concat(Object.values(LOCAL_EVENTS), [NAV_EVENTS.NAVIGATE_PATH]),
      portsInitialized: Ports.isInitialized()
    };
  }
};

export { NavRailEvents, VERSION, MODULE_ID, injectPorts, getPorts };
export default NavRailEvents;
