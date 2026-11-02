// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: system-pages
// PURPOSE: System Pages Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   isSystemRoute() — exported function
//   getSystemRoutes() — exported function
//   renderSystemPage() — exported function
//   getMetrics() — exported function
//   getSystemPagesInfo() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Telemetry
// ═══════════════════════════════════════════════════════════════
'use strict';

const VERSION = '2.2.0-ENTERPRISE';
const MODULE_ID = 'system-pages';

const SYSTEM_ROUTES = Object.freeze(['/forbidden', '/404', '/maintenance', '/login']);

const FALLBACK_HTML = Object.freeze({
  forbidden: '<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#fff;font-size:1.5rem;flex-direction:column;gap:1rem;"><span style="font-size:3rem;">🚫</span><span>Acesso Negado</span></div>',
  '404': '<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#fff;font-size:1.5rem;flex-direction:column;gap:1rem;"><span style="font-size:3rem;">🔍</span><span>Página Não Encontrada</span></div>',
  maintenance: '<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#fff;font-size:1.5rem;flex-direction:column;gap:1rem;"><span style="font-size:3rem;">🔧</span><span>Sistema em Manutenção</span></div>',
  login: '<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#fff;font-size:1.5rem;flex-direction:column;gap:1rem;"><span style="font-size:3rem;">🔐</span><span>Carregando...</span></div>'
});

const _metrics = { renders: 0, fallbacks: 0, errors: 0 };

function _trackEvent(event: string, data: Record<string, unknown>) {
  try { if (window.Telemetry && window.Telemetry.event) window.Telemetry.event(`${MODULE_ID}:${event}`, data || {}); } catch (e) {}
}

function isSystemRoute(route: string) { return SYSTEM_ROUTES.indexOf(route) !== -1; }
function getSystemRoutes() { return SYSTEM_ROUTES.slice(); }

function _normalizePageId(route: string) { return route.replace('/', '') || 'forbidden'; }

function renderSystemPage(route: string, mainRegion: HTMLElement | null) {
  if (!mainRegion) { _metrics.errors++; return Promise.resolve(false); }
  if (!isSystemRoute(route)) { _metrics.errors++; return Promise.resolve(false); }
  const pageId = _normalizePageId(route);
  return import(`/components/pages/${pageId}/index.js`).then(module => {
    if (module && module.mount) {
      mainRegion.innerHTML = '';
      return Promise.resolve(module.mount(mainRegion)).then(() => {
        _metrics.renders++;
        _trackEvent('mounted', { page: pageId });
        return true;
      });
    }
    throw new Error(`Module ${pageId} has no mount function`);
  }).catch(error => {
    _metrics.fallbacks++;
    _trackEvent('fallback', { page: pageId, error: error.message });
    mainRegion.innerHTML = (FALLBACK_HTML as Record<string, string>)[pageId] || FALLBACK_HTML.forbidden;
    return false;
  });
}

function getMetrics() { return { renders: _metrics.renders, fallbacks: _metrics.fallbacks, errors: _metrics.errors }; }

function getSystemPagesInfo() {
  return { moduleId: MODULE_ID, version: VERSION, supportedRoutes: SYSTEM_ROUTES.slice(), metrics: getMetrics(), timestamp: Date.now() };
}

function healthCheck() {
  const checks = { routesValid: SYSTEM_ROUTES.length > 0, lowFallbackRate: _metrics.renders === 0 || (_metrics.fallbacks / _metrics.renders) < 0.3 };
  let passed = 0;
  for (const k in checks) { if (checks.hasOwnProperty(k) && checks[k as keyof typeof checks]) passed++; }
  return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

function info() { return getSystemPagesInfo(); }

export { VERSION, MODULE_ID, isSystemRoute, getSystemRoutes, renderSystemPage, getMetrics, getSystemPagesInfo, healthCheck, info };
export default { isSystemRoute, getSystemRoutes, renderSystemPage, getMetrics, getSystemPagesInfo, healthCheck, info, VERSION, MODULE_ID };
