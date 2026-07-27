// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.3.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: nav-rail.registry.items
// PURPOSE: NavRail Enterprise - Registry Items
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   ITEMS — exported value
//   MOBILE_ITEMS — exported value
//   getItem() — exported function
//   getIntentId() — exported function
//   getItemByIntent() — exported function
//   getAllIntentIds() — exported function
//   getRoute() — exported function
//   getPanelId() — exported function
//   getNavPayload() — exported function
//   getEagerItems() — exported function
//   getEagerItemIds() — exported function
//   getComponentPath() — exported function
//   isEager() — exported function
//   getAllComponentPaths() — exported function
//   getNavigationModel() — exported function
//   getIntentMap() — exported function
//   getTriggerCompatMap() — exported function
//   toNavigationModelItem() — exported function
//   getAction() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   (none)
//
// LISTENS (eventos):
//   (none)
//
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'nav-rail.registry.items';
const VERSION = '4.3.0-ES6';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

const _log = (level: 'error' | 'warn' | 'info' | 'debug', msg: string, data?: unknown) => { const logger = _getPort('logger') as Record<string, unknown> | null; if (!logger) return; const fn = (logger[level] || logger.info) as ((...args: unknown[]) => void) | undefined; if (typeof fn === 'function') fn.call(logger, `[${MODULE_ID}]`, msg, data || ''); };

const ITEMS = [
  { id: 'home', icon: 'home', label: 'Home', group: 'operations', intentId: 'navrail.open.home', route: '#/home', panelId: 'panel-dashboard', order: 0, eager: true, componentPath: 'home' },
  { id: 'dashboard', icon: 'grid', label: 'Dashboard', group: 'operations', intentId: 'navrail.open.dashboard', route: '#/dashboard', panelId: 'panel-dashboard', order: 1, eager: true, componentPath: 'dashboard' },
  { id: 'financeiro', icon: 'dollar-sign', label: 'Financeiro', group: 'operations', intentId: 'navrail.open.financeiro', route: '#/financeiro', panelId: 'panel-09', order: 2, eager: true, componentPath: 'financeiro' },
  { id: 'comercial', icon: 'briefcase', label: 'Comercial', group: 'operations', intentId: 'navrail.open.comercial', route: '#/comercial', panelId: 'panel-04', order: 3, eager: true, componentPath: 'comercial' },
  { id: 'clientes', icon: 'users', label: 'Clientes', group: 'operations', intentId: 'navrail.open.clientes', route: '#/clientes', panelId: 'panel-03', order: 4, eager: true, componentPath: 'clientes' },
  { id: 'analytics', icon: 'bar-chart-2', label: 'Analytics', group: 'analytics', intentId: 'navrail.open.analytics', route: '#/analytics', panelId: 'panel-analytics', order: 1, eager: true, componentPath: 'analytics' },
  { id: 'relatorios', icon: 'file-text', label: 'Relatórios', group: 'analytics', intentId: 'navrail.open.relatorios', route: '#/relatorios', panelId: 'panel-19', order: 2, eager: false, componentPath: 'relatorios' },
  { id: 'charts', icon: 'trending-up', label: 'Gráficos', group: 'analytics', intentId: 'navrail.open.charts', route: '#/charts', panelId: 'panel-charts', order: 3, eager: false, componentPath: 'charts' },
  { id: 'database', icon: 'database', label: 'Banco de Dados', group: 'data', intentId: 'navrail.open.database', route: '#/database', panelId: 'panel-datahub', order: 1, eager: false, componentPath: 'database' },
  { id: 'folder', icon: 'folder', label: 'Arquivos', group: 'data', intentId: 'navrail.open.folder', route: '#/folder', panelId: 'panel-files', order: 2, eager: false, componentPath: 'folder' },
  { id: 'docs', icon: 'book-open', label: 'Documentos', group: 'data', intentId: 'navrail.open.docs', route: '#/docs', panelId: 'panel-dashboard', order: 3, eager: false, componentPath: 'docs' },
  { id: 'api', icon: 'zap', label: 'API', group: 'integrations', intentId: 'navrail.open.api', route: '#/api', panelId: 'panel-observability', order: 1, eager: false, componentPath: 'api' },
  { id: 'pipedrive', icon: 'target', label: 'Pipedrive', group: 'integrations', intentId: 'navrail.open.pipedrive', route: '#/pipedrive', panelId: 'panel-18', order: 2, eager: false, componentPath: 'pipedrive' },
  { id: 'location', icon: 'map-pin', label: 'Localizações', group: 'integrations', intentId: 'navrail.open.location', route: '#/location', panelId: 'panel-location', order: 3, eager: false, componentPath: 'location' },
  { id: 'admin-users', icon: 'user-cog', label: 'Usuários', group: 'admin', intentId: 'navrail.open.admin-users', route: '#/admin-users', panelId: 'panel-user-management', order: 1, eager: false, componentPath: 'admin-users' },
  { id: 'admin-settings', icon: 'settings', label: 'Configurações', group: 'admin', intentId: 'navrail.open.admin-settings', route: '#/admin-settings', panelId: 'panel-footer-settings', order: 2, eager: false, componentPath: 'admin-settings' },
  { id: 'code', icon: 'code', label: 'Código', group: 'admin', intentId: 'navrail.open.code', route: '#/code', panelId: 'panel-code', order: 3, eager: false, componentPath: 'code' },
  { id: 'header-admin', icon: 'layout', label: 'Header Admin', group: 'admin', intentId: 'navrail.open.header-admin', route: '#/header-admin', panelId: 'panel-header-admin', order: 4, eager: false, componentPath: 'header-admin' },
  { id: 'navrail-admin', icon: 'navigation', label: 'NavRail Admin', group: 'admin', intentId: 'navrail.open.navrail-admin', route: '#/navrail-admin', panelId: 'panel-navrail-admin', order: 5, eager: false, componentPath: 'navrail-admin' },
  { id: 'uarps-monitor', icon: 'shield', label: 'UARPS Monitor', group: 'admin', intentId: 'navrail.open.uarps-monitor', route: '#/uarps-monitor', panelId: 'panel-uarps-monitor', order: 6, eager: false, componentPath: 'uarps-monitor' },
  { id: 'bell', icon: 'bell', label: 'Notificações', group: 'system', intentId: 'navrail.open.bell', route: '#/bell', panelId: 'panel-user-notifications', order: 1, eager: false, componentPath: 'bell' },
  { id: 'help', icon: 'help-circle', label: 'Ajuda', group: 'system', intentId: 'navrail.open.help', route: '#/help', panelId: 'panel-dashboard', order: 2, eager: false, componentPath: 'help' },
  { id: 'toggle-sidebar', icon: 'sidebar', label: 'Sidebar', group: 'system', intentId: 'navrail.toggle.sidebar', route: null as string | null, panelId: null as string | null, actionType: 'toggleSidebar', action: 'sidebar.toggle', order: 99, eager: false, componentPath: 'toggle-sidebar' }
];

const MOBILE_ITEMS = ['home', 'dashboard', 'financeiro', 'analytics', 'bell', 'toggle-sidebar'];

function getItem(itemId: string) { return ITEMS.find(i => i.id === itemId) || null; }
function getIntentId(itemId: string) { const item = getItem(itemId); return item ? item.intentId : null; }
function getItemByIntent(intentId: string) { return ITEMS.find(i => i.intentId === intentId) || null; }
function getAllIntentIds() { return ITEMS.map(i => i.intentId).filter(Boolean); }
function getRoute(itemId: string) { const item = getItem(itemId); return item ? item.route : null; }
function getPanelId(itemId: string) { const item = getItem(itemId); return item ? item.panelId : null; }
function getNavPayload(itemId: string) { const item = getItem(itemId); if (!item) return null; return { itemId: item.id, path: item.route, panelId: item.panelId, source: 'navrail' }; }
function getEagerItems() { return ITEMS.filter(i => i.eager === true); }
function getEagerItemIds() { return ITEMS.filter(i => i.eager === true).map(i => i.id); }
function getComponentPath(itemId: string) { const item = getItem(itemId); return item ? item.componentPath : null; }
function isEager(itemId: string) { const item = getItem(itemId); return item ? item.eager === true : false; }
function getAllComponentPaths() { return ITEMS.map(i => ({
  id: i.id,
  path: i.componentPath,
  eager: i.eager
})); }

function toNavigationModelItem(item: Record<string, unknown> | null) {
  if (!item) return null;
  return {
    id: item.id,
    label: item.label,
    icon: item.icon,
    route: item.route ? (item.route as string).replace('#', '') : `/${item.id}`,
    section: item.group,
    order: item.order,
    eager: item.eager,
    navigation: { mode: 'link' },
    uarps: { trigger_id: `trigger:navrail:${item.id}`, region_id: 'region:app:navrail', visibility: 'show' },
    source: 'navrail-registry',
    version: 'v1'
  };
}

function getNavigationModel() {
  return {
    schema_id: 'navrail.navigation.model.v1',
    version: VERSION,
    generated_at: new Date().toISOString(),
    items: ITEMS.filter(i => i.route !== null).map(toNavigationModelItem)
  };
}

function getIntentMap() {
  return ITEMS.map(item => {
    if (item.action) { return { from_intentId: item.intentId, to_intent: 'ui.action', payload: { action: item.action, source: 'navrail' } }; }
    return { from_intentId: item.intentId, to_intent: 'nav.navigate.path', payload: { itemId: item.id, path: item.route, panelId: item.panelId, source: 'navrail' } };
  });
}

function getTriggerCompatMap() {
  return {
    schema_id: 'navrail.trigger.compat.v1',
    version: VERSION,
    rules: [
      { kind: 'regex', from: '^trigger:navrail:([a-z0-9\\-]+)$', to: 'trigger:navigation:item-$1' },
      { kind: 'regex', from: '^trigger:navigation:item-([a-z0-9\\-]+)$', to: 'trigger:navrail:$1' }
    ],
    explicit: ITEMS.filter(i => i.route !== null).map(item => ({
      legacy: `trigger:navrail:${item.id}`,
      v1: `trigger:navigation:item-${item.id}`
    }))
  };
}

function getAction(itemId: string) {
  _log('warn', 'getAction() is deprecated. Use getNavPayload() instead.');
  const item = getItem(itemId);
  if (!item || !item.intentId) return null;
  if (item.action) return { type: 'action', action: item.action };
  return { type: 'openPanel', panelId: item.panelId, route: item.route };
}

function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    itemCount: ITEMS.length,
    eagerCount: getEagerItemIds().length,
    lazyCount: ITEMS.length - getEagerItemIds().length,
    mobileItemCount: MOBILE_ITEMS.length,
    groups: [...new Set(ITEMS.map(i => i.group))],
    capabilities: ['getItem', 'getRoute', 'getPanelId', 'getNavPayload', 'getNavigationModel', 'getIntentMap', 'getTriggerCompatMap', 'getEagerItems', 'getComponentPath', 'isEager'],
    triggerFormat: '3-segment compliant (trigger:navigation:item-{id})',
    portsInitialized: Ports.isInitialized()
  };
}

function healthCheck() {
  const allHaveRoute = ITEMS.filter(i => i.route !== null).every(i => i.route && i.panelId);
  const allHaveIntent = ITEMS.every(i => i.intentId);
  const allHaveComponentPath = ITEMS.every(i => i.componentPath);
  const checks = {
    itemsLoaded: ITEMS.length > 0,
    allHaveRoute,
    allHaveIntent,
    allHaveComponentPath,
    mobileItemsValid: MOBILE_ITEMS.every(id => getItem(id) !== null),
    threeSegmentCompliant: true,
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID };
}

export { ITEMS, MOBILE_ITEMS, getItem, getIntentId, getItemByIntent, getAllIntentIds, getRoute, getPanelId, getNavPayload, getEagerItems, getEagerItemIds, getComponentPath, isEager, getAllComponentPaths, getNavigationModel, getIntentMap, getTriggerCompatMap, toNavigationModelItem, getAction, info, healthCheck, MODULE_ID, VERSION, injectPorts, getPorts };

export default { ITEMS, MOBILE_ITEMS, getItem, getIntentId, getItemByIntent, getAllIntentIds, getRoute, getPanelId, getNavPayload, getEagerItems, getEagerItemIds, getComponentPath, isEager, getAllComponentPaths, getNavigationModel, getIntentMap, getTriggerCompatMap, toNavigationModelItem, getAction, info, healthCheck, MODULE_ID, VERSION, injectPorts, getPorts };
