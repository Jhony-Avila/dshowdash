// Migrado para TypeScript: 2026-02-25
// System Pages Handler v2.0.0-ENTERPRISE-AAA
// Localizacao correta: /app/pages/
'use strict';

// ---------- Interfaces ----------

type SystemRoute = '/forbidden' | '/404' | '/maintenance' | '/login';
type PageId = 'forbidden' | '404' | 'maintenance' | 'login';

interface FallbackHtmlMap {
  readonly forbidden: string;
  readonly '404': string;
  readonly maintenance: string;
  readonly login: string;
}

interface SystemPagesMetrics {
  renders: number;
  fallbacks: number;
  errors: number;
}

interface HealthCheckResult {
  routesValid: boolean;
  lowFallbackRate: boolean;
}

type HealthStatus = 'HEALTHY' | 'DEGRADED';

interface HealthCheckResponse {
  status: HealthStatus;
  score: string;
  checks: HealthCheckResult;
  metrics: SystemPagesMetrics;
  version: string;
  moduleId: string;
  timestamp: number;
}

interface SystemPagesInfo {
  moduleId: string;
  version: string;
  supportedRoutes: string[];
  metrics: SystemPagesMetrics;
  timestamp: number;
}

interface DynamicPageModule {
  mount?: (container: HTMLElement) => void | Promise<void>;
  [key: string]: unknown;
}

interface SystemPagesExport {
  isSystemRoute: typeof isSystemRoute;
  getSystemRoutes: typeof getSystemRoutes;
  renderSystemPage: typeof renderSystemPage;
  getMetrics: typeof getMetrics;
  getSystemPagesInfo: typeof getSystemPagesInfo;
  healthCheck: typeof healthCheck;
  info: typeof info;
  VERSION: typeof VERSION;
  MODULE_ID: typeof MODULE_ID;
}

// ---------- Constants ----------

export const VERSION: string = '2.0.0-ENTERPRISE-AAA';
export const MODULE_ID: string = 'system-pages';

const SYSTEM_ROUTES = Object.freeze(['/forbidden', '/404', '/maintenance', '/login'] as const);

const FALLBACK_HTML: FallbackHtmlMap = Object.freeze({
    forbidden: '<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#fff;font-size:1.5rem;flex-direction:column;gap:1rem;"><span style="font-size:3rem;">&#x1F6AB;</span><span>Acesso Negado</span></div>',
    '404': '<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#fff;font-size:1.5rem;flex-direction:column;gap:1rem;"><span style="font-size:3rem;">&#x1F50D;</span><span>Pagina Nao Encontrada</span></div>',
    maintenance: '<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#fff;font-size:1.5rem;flex-direction:column;gap:1rem;"><span style="font-size:3rem;">&#x1F527;</span><span>Sistema em Manutencao</span></div>',
    login: '<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#fff;font-size:1.5rem;flex-direction:column;gap:1rem;"><span style="font-size:3rem;">&#x1F510;</span><span>Carregando...</span></div>'
} as const);

// ---------- State ----------

let _metrics: SystemPagesMetrics = { renders: 0, fallbacks: 0, errors: 0 };

// ---------- Internal ----------

function _trackEvent(event: string, data: Record<string, unknown> = {}): void {
    try { const t = window.Telemetry as Record<string, unknown> | undefined; if (t?.event && typeof t.event === 'function') (t.event as (name: string, data: Record<string, unknown>) => void)(`${MODULE_ID}:${event}`, data); } catch (_e: unknown) { /* silenced */ }
}

function _normalizePageId(route: string): PageId {
    return (route.replace('/', '') || 'forbidden') as PageId;
}

// ---------- Public API ----------

export function isSystemRoute(route: string): route is SystemRoute {
    return (SYSTEM_ROUTES as readonly string[]).includes(route);
}

export function getSystemRoutes(): string[] {
    return [...SYSTEM_ROUTES];
}

export async function renderSystemPage(route: string, mainRegion: HTMLElement | null): Promise<boolean> {
    if (!mainRegion) { _metrics.errors++; return false; }
    if (!isSystemRoute(route)) { _metrics.errors++; return false; }
    const pageId: PageId = _normalizePageId(route);
    try {
        const module: DynamicPageModule = await import(`/components/pages/${pageId}/index.js`);
        if (module?.mount) {
            mainRegion.innerHTML = '';
            await module.mount(mainRegion);
            _metrics.renders++;
            _trackEvent('mounted', { page: pageId });
            return true;
        }
        throw new Error(`Module ${pageId} has no mount function`);
    } catch (error: unknown) {
        _metrics.fallbacks++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        _trackEvent('fallback', { page: pageId, error: errorMessage });
        mainRegion.innerHTML = FALLBACK_HTML[pageId] || FALLBACK_HTML.forbidden;
        return false;
    }
}

export function getMetrics(): SystemPagesMetrics {
    return { ..._metrics };
}

export function getSystemPagesInfo(): SystemPagesInfo {
    return { moduleId: MODULE_ID, version: VERSION, supportedRoutes: [...SYSTEM_ROUTES], metrics: getMetrics(), timestamp: Date.now() };
}

export function healthCheck(): HealthCheckResponse {
    const checks: HealthCheckResult = { routesValid: SYSTEM_ROUTES.length > 0, lowFallbackRate: _metrics.renders === 0 || (_metrics.fallbacks / _metrics.renders) < 0.3 };
    const passed: number = Object.values(checks).filter(Boolean).length;
    const total: number = Object.keys(checks).length;
    return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info(): SystemPagesInfo { return getSystemPagesInfo(); }

// ---------- Default Export ----------

const systemPages: SystemPagesExport = { isSystemRoute, getSystemRoutes, renderSystemPage, getMetrics, getSystemPagesInfo, healthCheck, info, VERSION, MODULE_ID };
export default systemPages;
