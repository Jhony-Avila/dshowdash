// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.3.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: header.user-menu.core.actions
// PURPOSE: User Menu - Actions
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//   navigateToRoute as navAdapterNavigate from ../../_base/navigation-helper.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   ACTION_CONFIG — exported value
//   emitUIAction() — exported function
//   handleMenuAction() — exported function
//   navigateToRoute() — exported function
//   ACTION_ROUTES — exported value
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   UI_EVENTS.ACTION
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS: (none)
// @changelog v3.3.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v3.2.0-ES6 - ES6 conversion
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';
import { navigateToRoute as navAdapterNavigate } from '../../_base/navigation-helper.js';

const MODULE_ID = 'header.user-menu.core.actions';
const VERSION = '3.4.0-P2-ENTERPRISE';

const Ports = createUiPorts({ moduleId: MODULE_ID });
let _portsInitialized = false;

function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}

function _getPort(name: string) {
  _initPorts();
  return Ports.get(name);
}

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: EventBus
// ═══════════════════════════════════════════════════════════════
function _getEventBus() {
  _initPorts();

  // 1. Try Ports first
  const portEventBus = _getPort('eventBus');
  if (portEventBus) return portEventBus;

  // 2. Try Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core?.windowAdapter?.get) {
    const waEventBus = window.Core.windowAdapter.get('EventBus');
    if (waEventBus) return waEventBus;
  }

  return null;
}

function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

const _metrics = { actions: 0, navigations: 0 };

const ACTION_CONFIG = { id: 'user-menu', area: 'header', label: 'Menu do Usuário', icon: 'user', kind: 'ui' };

const ACTION_ROUTES = {
  'profile': '#/meu-perfil',
  'preferences': '#/preferencias',
  'security': '#/seguranca-conta',
  'notifications': '#/notificacoes',
  'sessions': '#/sessoes-ativas'
};

function navigateToRoute(route: string, source: string) {
  _metrics.navigations++;
  return navAdapterNavigate(route, source || MODULE_ID);
}

function emitUIAction(actionSuffix: string, data: Record<string,unknown>) {
  if (!data) data = {};
  _metrics.actions++;
  const eventBus = _getEventBus();
  if (!eventBus || !eventBus.emit) return;
  eventBus.emit(UI_EVENTS.ACTION, { actionId: `header:${ACTION_CONFIG.id}:${actionSuffix}`, source: MODULE_ID, timestamp: Date.now(), meta: Object.assign({ label: ACTION_CONFIG.label, icon: ACTION_CONFIG.icon, kind: ACTION_CONFIG.kind }, data) });
}

function handleMenuAction(action: string, context: Record<string,unknown>) {
  const logger = context.logger;
  const store = context.store;
  const onLogout = context.onLogout;
  
  // @ts-expect-error TS migration - TS2339
  store.setState({ isOpen: false });
  emitUIAction(action, { action });
  
  // @ts-expect-error TS migration - TS2339
  if (logger && logger.debug) logger.debug(`Action: ${action}`);
  
  if (action === 'logout' && onLogout) {
    // @ts-expect-error TS migration - TS2349
    onLogout();
    return;
  }
  
  const route = (ACTION_ROUTES as Record<string,unknown>)[action as string];
  if (route) {
    // @ts-expect-error TS migration - TS2345
    navigateToRoute(route, MODULE_ID);
  }
}

function getMetrics() { return Object.assign({}, _metrics); }

function info() {
  const ps = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    p03PortsOnly: true,
    strictMode: isStrict(),
    metrics: getMetrics(),
    routes: ACTION_ROUTES,
    portsInitialized: ps._initialized
  };
}

function healthCheck() {
  const ps = Ports.snapshot();
  const hasEventBus = !!_getEventBus();
  return {
    status: hasEventBus ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    p03PortsOnly: true,
    strictMode: isStrict(),
    checks: { actionsReady: true, hasEventBus, portsInitialized: ps._initialized },
    metrics: getMetrics(),
    portsInitialized: ps._initialized
  };
}

export { MODULE_ID, VERSION, ACTION_CONFIG, emitUIAction, handleMenuAction, navigateToRoute, ACTION_ROUTES, getMetrics, info, healthCheck, injectPorts, getPorts };
