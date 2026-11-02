// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: manifest-v3
// PURPOSE: Manifest V3
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   getApps
//   getAppById
//   getAppsByType
//   getPages
//   getDomains
//   getPanels
//   resolveAppByRoute
//   getPreloadApps
//   getAppsByRegion
//   info
//   VERSION
//   MODULE_ID
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

interface AppEntry {
  id: string;
  type: string;
  entry: string;
  routes?: string[];
  permissions?: string[];
  layout?: string;
  region?: string;
  priority?: number;
  preload?: boolean;
  panelFallback?: string;
  name?: string;
}

const VERSION = '3.3.0-P2-ENTERPRISE';
const MODULE_ID = 'manifest-v3';

const APPS: readonly AppEntry[] = Object.freeze([
  { id: 'login', type: 'page', entry: '/platform/pages/login-mfe/entry.js', routes: ['/login'], permissions: [], layout: 'minimal', region: 'main', priority: 1 },
  { id: 'logout', type: 'page', entry: '/platform/pages/logout-mfe/entry.js', routes: ['/logout'], permissions: [], layout: 'minimal', region: 'main', priority: 1 },
  { id: 'forbidden', type: 'page', entry: '/platform/pages/forbidden-mfe/entry.js', routes: ['/forbidden', '/403'], permissions: [], layout: 'minimal', region: 'main', priority: 1 },
  { id: 'notfound', type: 'page', entry: '/platform/pages/notfound-mfe/entry.js', routes: ['/404', '/notfound'], permissions: [], layout: 'minimal', region: 'main', priority: 1 },
  { id: 'maintenance', type: 'page', entry: '/platform/pages/maintenance-mfe/entry.js', routes: ['/maintenance'], permissions: [], layout: 'minimal', region: 'main', priority: 1 },
  { id: 'dashboard', type: 'domain', entry: '/platform/domains/dashboard-mfe/entry.js', routes: ['/', '/geral', '/dashboard', '/home', '/principal'], permissions: ['view-dashboard'], layout: 'default', region: 'main', priority: 1, preload: true, panelFallback: 'panel-01' },
  { id: 'rh', type: 'domain', entry: '/platform/domains/rh-mfe/entry.js', routes: ['/rh-pessoas', '/rh', '/colaboradores'], permissions: ['view-rh'], layout: 'full', region: 'main', priority: 2, panelFallback: 'panel-06' },
  { id: 'financeiro', type: 'domain', entry: '/platform/domains/financeiro-mfe/entry.js', routes: ['/financeiro'], permissions: ['view-financeiro'], layout: 'default', region: 'main', priority: 3, panelFallback: 'panel-10' },
  { id: 'clientes', type: 'domain', entry: '/platform/domains/clientes-mfe/entry.js', routes: ['/clientes'], permissions: ['view-clientes'], layout: 'default', region: 'main', priority: 4, panelFallback: 'panel-05' },
  { id: 'operacional', type: 'domain', entry: '/platform/domains/operacional-mfe/entry.js', routes: ['/operacional', '/servidores'], permissions: ['view-operacional'], layout: 'default', region: 'main', priority: 5, panelFallback: 'panel-03' },
  { id: 'comercial', type: 'domain', entry: '/platform/domains/comercial-mfe/entry.js', routes: ['/comercial', '/orcamento-clientes'], permissions: ['view-comercial'], layout: 'default', region: 'main', priority: 6, panelFallback: 'panel-07' },
  { id: 'compras', type: 'domain', entry: '/platform/domains/compras-mfe/entry.js', routes: ['/compras', '/fornecedores'], permissions: ['view-compras'], layout: 'default', region: 'main', priority: 7, panelFallback: 'panel-08' },
  { id: 'produtos', type: 'domain', entry: '/platform/domains/produtos-mfe/entry.js', routes: ['/produtos', '/bling'], permissions: ['view-produtos'], layout: 'default', region: 'main', priority: 8, panelFallback: 'panel-04' },
  { id: 'integracoes', type: 'domain', entry: '/platform/domains/integracoes-mfe/entry.js', routes: ['/google-drive', '/pipedrive'], permissions: ['view-integracoes'], layout: 'default', region: 'main', priority: 9, panelFallback: 'panel-12' },
  { id: 'marketing', type: 'domain', entry: '/platform/domains/marketing-mfe/entry.js', routes: ['/instagram', '/google-ads'], permissions: ['view-marketing'], layout: 'default', region: 'main', priority: 10, panelFallback: 'panel-12' },
  { id: 'automacoes', type: 'domain', entry: '/platform/domains/automacoes-mfe/entry.js', routes: ['/automacoes'], permissions: ['view-automacoes'], layout: 'default', region: 'main', priority: 11, panelFallback: 'panel-03' },
  { id: 'juridico', type: 'domain', entry: '/platform/domains/juridico-mfe/entry.js', routes: ['/contratos'], permissions: ['view-juridico'], layout: 'default', region: 'main', priority: 12, panelFallback: 'panel-01' },
  { id: 'panel-01', type: 'panel', entry: '/platform/panels/panel-01/entry.js', name: 'Dashboard Principal' },
  { id: 'panel-03', type: 'panel', entry: '/platform/panels/panel-03/entry.js', name: 'Operacional' },
  { id: 'panel-04', type: 'panel', entry: '/platform/panels/panel-04/entry.js', name: 'Produtos/Bling' },
  { id: 'panel-05', type: 'panel', entry: '/platform/panels/panel-05/entry.js', name: 'Clientes' },
  { id: 'panel-06', type: 'panel', entry: '/platform/panels/panel-06/entry.js', name: 'RH' },
  { id: 'panel-07', type: 'panel', entry: '/platform/panels/panel-07/entry.js', name: 'Comercial' },
  { id: 'panel-08', type: 'panel', entry: '/platform/panels/panel-08/entry.js', name: 'Compras' },
  { id: 'panel-10', type: 'panel', entry: '/platform/panels/panel-10/entry.js', name: 'Financeiro' },
  { id: 'panel-12', type: 'panel', entry: '/platform/panels/panel-12/entry.js', name: 'Integrações' }
]);

const _routeCache: Record<string, AppEntry> = {};

function _buildRouteCache() {
  if (Object.keys(_routeCache).length > 0) return;
  APPS.forEach(app => {
    if (app.routes) {
      app.routes.forEach(route => {
        const n = route.replace(/^\/+/, '').toLowerCase() || '/';
        _routeCache[n] = app;
        _routeCache[`/${n}`] = app;
      });
    }
  });
}

function getApps() { return APPS.slice(); }
function getAppById(id: string) { for (let i = 0; i < APPS.length; i++) { if (APPS[i].id === id) return APPS[i]; } return null; }
function getAppsByType(type: string) { return APPS.filter(app => app.type === type); }
function getPages() { return getAppsByType('page'); }
function getDomains() { return getAppsByType('domain'); }
function getPanels() { return getAppsByType('panel'); }

function resolveAppByRoute(route: string) {
  _buildRouteCache();
  const n = (route || '/').replace(/^\/+/, '').toLowerCase() || '/';
  if (_routeCache[n]) return _routeCache[n];
  if (_routeCache[`/${n}`]) return _routeCache[`/${n}`];
  for (let i = 0; i < APPS.length; i++) {
    const app = APPS[i];
    if (app.routes) {
      for (let j = 0; j < app.routes.length; j++) {
        const r = app.routes[j];
        if (r.indexOf('*') !== -1 && n.indexOf(r.replace('*', '')) === 0) return app;
      }
    }
  }
  return getAppById('notfound');
}

function getPreloadApps() { return APPS.filter(app => app.preload === true); }
function getAppsByRegion(region: string) { return APPS.filter(app => app.region === region); }
function info() { return { version: VERSION, moduleId: MODULE_ID, totalApps: APPS.length, pages: getPages().length, domains: getDomains().length, panels: getPanels().length }; }

export { getApps, getAppById, getAppsByType, getPages, getDomains, getPanels, resolveAppByRoute, getPreloadApps, getAppsByRegion, info, VERSION, MODULE_ID };
export default { getApps, getAppById, getAppsByType, getPages, getDomains, getPanels, resolveAppByRoute, getPreloadApps, getAppsByRegion, info, VERSION, MODULE_ID };
