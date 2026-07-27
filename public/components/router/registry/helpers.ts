// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-AUTO-INIT)
// ═══════════════════════════════════════════════════════════════
// MODULE: router:registry:helpers
// PURPOSE: Router Registry Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   routes as definedRoutes from ./definitions/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getRoutesByMinLevel() — exported function
//   getRoutesByUARPS() — exported function
//   setRoutesRegistry() — exported function
//   getAllRoutes() — exported function
//   getRouteByPath() — exported function
//   getRouteById() — exported function
//   getRouteByIdOrPath() — exported function
//   getRouteByPage() — exported function
//   getRouteByPanel() — exported function
//   getRouteByView() — exported function
//   getRoutesByTag() — exported function
//   getRoutesByDomain() — exported function
//   getPublicRoutes() — exported function
//   getProtectedRoutes() — exported function
//   getEnterpriseRoutes() — exported function
//   getDefaultRoute() — exported function
//   getLoginRoute() — exported function
//   getNotFoundRoute() — exported function
//   getForbiddenRoute() — exported function
//   shouldMountMain() — exported function
//   getNoMountMainRoutes() — exported function
//   getUniqueDomains() — exported function
//   matchRoute() — exported function
//   buildRoutePath() — exported function
//   getRoutesBySection() — exported function
//   healthCheck() — exported function
//   getVersion() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { routes as definedRoutes } from './definitions/index.js';

export const VERSION = '2.4.0-AUTO-INIT';
export const MODULE_ID = 'router:registry:helpers';

// v2.4.0: Auto-inicializa com as rotas de definitions
// setRoutesRegistry() pode sobrescrever a qualquer momento
let _routesRegistry: any = definedRoutes || null;

export function setRoutesRegistry(registry: unknown) {
    _routesRegistry = registry;
}

export function getAllRoutes() {
    if (!_routesRegistry) return [];
    if (typeof _routesRegistry.getAll === 'function') return _routesRegistry.getAll();
    if (Array.isArray(_routesRegistry)) return _routesRegistry;
    if (typeof _routesRegistry === 'object') return Object.entries(_routesRegistry).map(([path, config]: any) => ({ path, ...(config as any) }));
    return [];
}

export function getRouteByPath(path: string) {
    const routes = getAllRoutes();
    return routes.find((route: Record<string, unknown>) => route.path === path) || null;
}

export function getRouteById(id: string) {
    const routes = getAllRoutes();
    return routes.find((route: Record<string, unknown>) => route.id === id) || null;
}

export function getRouteByIdOrPath(idOrPath: string) {
    return getRouteById(idOrPath) || getRouteByPath(idOrPath) || null;
}

export function getRouteByPage(page: string) {
    const routes = getAllRoutes();
    return routes.find((route: Record<string, unknown>) => route.page === page) || null;
}

export function getRouteByPanel(panel: string) {
    const routes = getAllRoutes();
    return routes.find((route: Record<string, unknown>) => route.panel === panel) || null;
}

export function getRouteByView(view: string) {
    const routes = getAllRoutes();
    return routes.find((route: Record<string, unknown>) => route.view === view || route.defaultView === view) || null;
}

export function getRoutesByTag(tag: string) {
    const routes = getAllRoutes();
    return routes.filter((route: Record<string, unknown>) => (route.tags as string[])?.includes(tag));
}

export function getRoutesByDomain(domain: string) {
    const routes = getAllRoutes();
    return routes.filter((route: Record<string, unknown>) => route.domain === domain);
}

export const getRoutesByMinLevel = (userLevel: number, userTriggers: string[] = []) => {
    const routes = getAllRoutes();
    return routes.filter((route: Record<string, unknown>) => {
        if (route.public) return true;
        if (route.uarps_trigger && userTriggers.length > 0) {
            return userTriggers.includes(route.uarps_trigger as string);
        }
        const minLevel = (route.minLevel || 0) as number;
        return userLevel >= minLevel;
    });
};

export const getRoutesByUARPS = (userTriggers: string[] = []) => {
    const routes = getAllRoutes();
    return routes.filter((route: Record<string, unknown>) => {
        if (route.public) return true;
        if (!route.uarps_trigger) return true;
        return userTriggers.includes(route.uarps_trigger as string);
    });
};

export function getPublicRoutes() {
    const routes = getAllRoutes();
    return routes.filter((route: Record<string, unknown>) => route.public === true);
}

export function getProtectedRoutes() {
    const routes = getAllRoutes();
    return routes.filter((route: Record<string, unknown>) => !route.public);
}

export function getEnterpriseRoutes() {
    const routes = getAllRoutes();
    return routes.filter((route: Record<string, unknown>) => route.panel || route.enterprise || (route.minLevel as number) >= 50);
}

export function getDefaultRoute() {
    const routes = getAllRoutes();
    return routes.find((route: Record<string, unknown>) => route.path === '/' || route.isDefault) || routes[0] || null;
}

export function getLoginRoute() {
    const routes = getAllRoutes();
    return routes.find((route: Record<string, unknown>) => route.path === '/login' || route.id === 'login') || null;
}

export function getNotFoundRoute() {
    const routes = getAllRoutes();
    return routes.find((route: Record<string, unknown>) => route.path === '/404' || route.id === '404' || route.id === 'not-found') || null;
}

export function getForbiddenRoute() {
    const routes = getAllRoutes();
    return routes.find((route: Record<string, unknown>) => route.path === '/forbidden' || route.path === '/403' || route.id === 'forbidden') || null;
}

export function shouldMountMain(path: string) {
    const route = getRouteByPath(path);
    if (!route) return true;
    return route.mountMain !== false;
}

export function getNoMountMainRoutes() {
    const routes = getAllRoutes();
    return routes.filter((route: Record<string, unknown>) => route.mountMain === false).map((route: Record<string, unknown>) => route.path || route.id);
}

export function getUniqueDomains() {
    const routes = getAllRoutes();
    const domains = new Set();
    routes.forEach((route: Record<string, unknown>) => { if (route.domain) domains.add(route.domain as string); });
    return [...domains];
}

export function matchRoute(path: string) {
    const routes = getAllRoutes();
    const exact = routes.find((route: Record<string, unknown>) => route.path === path);
    if (exact) return { route: exact, params: {} };
    for (const route of routes as Record<string, unknown>[]) {
        const params = matchPathParams(route.path as string, path);
        if (params) return { route, params };
    }
    return null;
}

function matchPathParams(routePath: string, actualPath: string) {
    if (!routePath || !actualPath) return null;
    const routeParts = routePath.split('/').filter(Boolean);
    const actualParts = actualPath.split('/').filter(Boolean);
    if (routeParts.length !== actualParts.length) return null;
    const params: Record<string, string> = {};
    for (let i = 0; i < routeParts.length; i++) {
        const routePart = routeParts[i];
        const actualPart = actualParts[i];
        if (routePart.startsWith(':')) {
            params[routePart.slice(1)] = actualPart;
        } else if (routePart !== actualPart) {
            return null;
        }
    }
    return params;
}

export function buildRoutePath(routeId: string, params: Record<string, string> = {}) {
    const route = getRouteById(routeId);
    if (!route) return null;
    let path = route.path;
    for (const [key, value] of Object.entries(params)) {
        path = path.replace(`:${key}`, value as string);
    }
    return path;
}

export function getRoutesBySection(section: string) {
    const routes = getAllRoutes();
    return routes.filter((route: Record<string, unknown>) => route.section === section);
}

export function healthCheck() {
    return {
        status: _routesRegistry !== null ? 'HEALTHY' : 'UNHEALTHY',
        registrySet: _routesRegistry !== null,
        autoInitialized: _routesRegistry === definedRoutes,
        totalRoutes: getAllRoutes().length,
        publicRoutes: getPublicRoutes().length,
        protectedRoutes: getProtectedRoutes().length,
        enterpriseRoutes: getEnterpriseRoutes().length,
        version: VERSION,
        moduleId: MODULE_ID
    };
}

export function getVersion() { return VERSION; }

export default {
    VERSION, MODULE_ID, setRoutesRegistry, getAllRoutes, getRouteByPath, getRouteById, getRouteByIdOrPath,
    getRouteByPage, getRouteByPanel, getRouteByView, getRoutesByTag, getRoutesByDomain,
    getRoutesByMinLevel, getRoutesByUARPS, getPublicRoutes, getProtectedRoutes, getEnterpriseRoutes,
    getDefaultRoute, getLoginRoute, getNotFoundRoute, getForbiddenRoute,
    shouldMountMain, getNoMountMainRoutes, getUniqueDomains,
    matchRoute, buildRoutePath, getRoutesBySection, healthCheck, getVersion
};
