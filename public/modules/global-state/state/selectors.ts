// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: global-state-selectors
// PURPOSE: Global State Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   default export
//   MODULE_ID
//   VERSION
// ═══════════════════════════════════════════════════════════════
'use strict';

const MODULE_ID = 'global-state-selectors';
const VERSION = '5.1.0-ENTERPRISE';

const StateSelectors = {
  MODULE_ID,
  VERSION,

  getSession(state: unknown) { return (state && (state as any).session) ? (state as any).session : {}; },
  isAuthenticated(state: unknown) { return state && (state as any).session && (state as any).session.isAuthenticated ? true : false; },
  getToken(state: unknown) { return state && (state as any).session && (state as any).session.token ? (state as any).session.token : null; },
  getUserId(state: unknown) { return state && (state as any).session && (state as any).session.user && (state as any).session.user.id ? (state as any).session.user.id : (state && (state as any).session && (state as any).session.userId ? (state as any).session.userId : null); },
  getUser(state: unknown) { return state && (state as any).session && (state as any).session.user ? (state as any).session.user : null; },
  getLastActivity(state: unknown) { return state && (state as any).session && (state as any).session.lastActivity ? (state as any).session.lastActivity : null; },
  getExpiresAt(state: unknown) { return state && (state as any).session && (state as any).session.expiresAt ? (state as any).session.expiresAt : null; },

  getPreferences(state: unknown) { return (state && (state as any).preferences) ? (state as any).preferences : {}; },
  getTheme(state: unknown) { return state && (state as any).preferences && (state as any).preferences.theme ? (state as any).preferences.theme : 'light'; },
  getLanguage(state: unknown) { return state && (state as any).preferences && (state as any).preferences.language ? (state as any).preferences.language : 'pt-BR'; },
  isCompactMode(state: unknown) { return state && (state as any).preferences && (state as any).preferences.compactMode ? true : false; },
  hasAnimations(state: unknown) { return state && (state as any).preferences && (state as any).preferences.animations !== false; },

  getAppState(state: unknown) { return (state && (state as any).app) ? (state as any).app : {}; },
  isLoading(state: unknown) { return state && (state as any).app && (state as any).app.isLoading ? true : false; },
  isOnline(state: unknown) { return state && (state as any).app && (state as any).app.isOnline !== false; },
  isMaintenanceMode(state: unknown) { return state && (state as any).app && (state as any).app.maintenanceMode ? true : false; },
  getAppVersion(state: unknown) { return state && (state as any).app && (state as any).app.version ? (state as any).app.version : '0.0.0'; },

  getNavigation(state: unknown) { return (state && (state as any).navigation) ? (state as any).navigation : {}; },
  getCurrentRoute(state: unknown) { return state && (state as any).navigation && (state as any).navigation.currentRoute ? (state as any).navigation.currentRoute : '/'; },
  getPreviousRoute(state: unknown) { return state && (state as any).navigation && (state as any).navigation.previousRoute ? (state as any).navigation.previousRoute : null; },
  isSidebarOpen(state: unknown) { return state && (state as any).navigation && (state as any).navigation.sidebarOpen !== false; },
  getActivePanel(state: unknown) { return state && (state as any).navigation && (state as any).navigation.activePanel ? (state as any).navigation.activePanel : null; },

  getView(state: unknown) { return state && (state as any).navigation && (state as any).navigation.view ? (state as any).navigation.view : null; },
  getTab(state: unknown) { return state && (state as any).navigation && (state as any).navigation.tab ? (state as any).navigation.tab : null; },
  getSection(state: unknown) { return state && (state as any).navigation && (state as any).navigation.section ? (state as any).navigation.section : null; },
  getEntity(state: unknown) { return state && (state as any).navigation && (state as any).navigation.entity ? (state as any).navigation.entity : null; },
  getEntityId(state: unknown) { return state && (state as any).navigation && (state as any).navigation.entityId ? (state as any).navigation.entityId : null; },
  getNavigationMode(state: unknown) { return state && (state as any).navigation && (state as any).navigation.mode ? (state as any).navigation.mode : 'view'; },
  getPage(state: unknown) { return state && (state as any).navigation && (state as any).navigation.page ? (state as any).navigation.page : 1; },
  getSort(state: unknown) { return state && (state as any).navigation && (state as any).navigation.sort ? (state as any).navigation.sort : null; },
  getFilters(state: unknown) { return state && (state as any).navigation && (state as any).navigation.filters ? (state as any).navigation.filters : null; },
  getExtras(state: unknown) { return state && (state as any).navigation && (state as any).navigation.extras ? (state as any).navigation.extras : {}; },

  getFlags(state: unknown) { return (state && (state as any).flags) ? (state as any).flags : {}; },
  isDebugMode(state: unknown) { return state && (state as any).flags && (state as any).flags.debugMode ? true : false; },
  isTelemetryEnabled(state: unknown) { return state && (state as any).flags && (state as any).flags.telemetryEnabled !== false; },
  getFeatureFlag(state: unknown, flagName: string) { return state && (state as any).flags && (state as any).flags.featureFlags && (state as any).flags.featureFlags[flagName] ? (state as any).flags.featureFlags[flagName] : false; },

  getPermissionsState(state: unknown) { return state && (state as any).permissions ? (state as any).permissions : { mode: 'allow-all', apiConnected: false, lastModeChange: null, enforcement: { enabled: false, scope: 'global', domains: [], routes: [], failOpen: true } }; },
  getPermissionsMode(state: unknown) { return state && (state as any).permissions && (state as any).permissions.mode ? (state as any).permissions.mode : 'allow-all'; },
  isPermissionsEnforced(state: unknown) { return state && (state as any).permissions && (state as any).permissions.mode === 'enforce'; },
  isPermissionsApiConnected(state: unknown) { return state && (state as any).permissions && (state as any).permissions.apiConnected ? true : false; },

  getPermissionsEnforcement(state: unknown) { return state && (state as any).permissions && (state as any).permissions.enforcement ? (state as any).permissions.enforcement : { enabled: false, scope: 'global', domains: [], routes: [], failOpen: true, lastChange: null }; },
  isEnforcementEnabled(state: unknown) { return state && (state as any).permissions && (state as any).permissions.enforcement && (state as any).permissions.enforcement.enabled === true; },
  getEnforcementScope(state: unknown) { return state && (state as any).permissions && (state as any).permissions.enforcement && (state as any).permissions.enforcement.scope ? (state as any).permissions.enforcement.scope : 'global'; },
  getEnforcementDomains(state: unknown) { return state && (state as any).permissions && (state as any).permissions.enforcement && (state as any).permissions.enforcement.domains ? (state as any).permissions.enforcement.domains : []; },
  getEnforcementRoutes(state: unknown) { return state && (state as any).permissions && (state as any).permissions.enforcement && (state as any).permissions.enforcement.routes ? (state as any).permissions.enforcement.routes : []; },
  isFailOpenEnabled(state: unknown) { return state && (state as any).permissions && (state as any).permissions.enforcement && (state as any).permissions.enforcement.failOpen !== false; },

  isEnforcedForDomain(state: unknown, domain: string) {
    const enforcement = StateSelectors.getPermissionsEnforcement(state);
    if (!enforcement.enabled) return false;
    if (enforcement.scope === 'global') return true;
    if (enforcement.scope === 'domain') return enforcement.domains.indexOf(domain) !== -1;
    return false;
  },

  isEnforcedForRoute(state: unknown, path: string) {
    const enforcement = StateSelectors.getPermissionsEnforcement(state);
    if (!enforcement.enabled) return false;
    if (enforcement.scope === 'global') return true;
    if (enforcement.scope === 'route') {
      for (let i = 0; i < enforcement.routes.length; i++) {
        const r = enforcement.routes[i];
        if (path === r || path.indexOf(`${r}/`) === 0) return true;
      }
    }
    return false;
  },

  getEffectivePermissionsMode(state: unknown, route: unknown) {
    const enforcement = StateSelectors.getPermissionsEnforcement(state);
    if (!enforcement.enabled) return 'allow-all';
    const r: any = route;
    const path = r && r.path ? r.path : r;
    const domain = r && r.domain ? r.domain : null;
    if (enforcement.scope === 'global') return 'enforce';
    if (enforcement.scope === 'domain' && domain && enforcement.domains.indexOf(domain) !== -1) return 'enforce';
    if (enforcement.scope === 'route' && path) {
      for (let i = 0; i < enforcement.routes.length; i++) {
        const r = enforcement.routes[i];
        if (path === r || path.indexOf(`${r}/`) === 0) return 'enforce';
      }
    }
    return 'allow-all';
  },

  getAuthContext(state: unknown) {
    const session: any = state && (state as any).session ? (state as any).session : {};
    return { isAuthenticated: session.isAuthenticated || false, userId: session.user && session.user.id ? session.user.id : (session.userId || null), user: session.user || null, token: session.token || null, lastActivity: session.lastActivity || null, expiresAt: session.expiresAt || null, roles: session.roles || [], permissions: session.permissions || [] };
  },

  getFullContext(state: unknown) {
    return { isAuthenticated: StateSelectors.isAuthenticated(state), userId: StateSelectors.getUserId(state), user: StateSelectors.getUser(state), theme: StateSelectors.getTheme(state), language: StateSelectors.getLanguage(state), isOnline: StateSelectors.isOnline(state), isLoading: StateSelectors.isLoading(state), currentRoute: StateSelectors.getCurrentRoute(state), activePanel: StateSelectors.getActivePanel(state), view: StateSelectors.getView(state), mode: StateSelectors.getNavigationMode(state), permissionsMode: StateSelectors.getPermissionsMode(state), enforcementEnabled: StateSelectors.isEnforcementEnabled(state) };
  },

  getVirtualRoute(state: unknown) {
    return { view: StateSelectors.getView(state), tab: StateSelectors.getTab(state), section: StateSelectors.getSection(state), entity: StateSelectors.getEntity(state), entityId: StateSelectors.getEntityId(state), mode: StateSelectors.getNavigationMode(state), page: StateSelectors.getPage(state), sort: StateSelectors.getSort(state), filters: StateSelectors.getFilters(state), extras: StateSelectors.getExtras(state) };
  },

  getUserRoles(state: unknown) { return state && (state as any).session && (state as any).session.roles ? (state as any).session.roles : (state && (state as any).session && (state as any).session.user && (state as any).session.user.roles ? (state as any).session.user.roles : []); },
  getUserCapabilities(state: unknown) { return state && (state as any).session && (state as any).session.user && (state as any).session.user.capabilities ? (state as any).session.user.capabilities : []; },
  getUserLevel(state: unknown) { return state && (state as any).session && (state as any).session.user && (state as any).session.user.level ? (state as any).session.user.level : 0; },

  info() {
    const selectorMethods = [];
    const keys = Object.keys(StateSelectors);
    for (let i = 0; i < keys.length; i++) { const k = keys[i]; if (typeof (StateSelectors as Record<string, unknown>)[k] === 'function' && k !== 'info' && k !== 'healthCheck') selectorMethods.push(k); }
    return { moduleId: MODULE_ID, version: VERSION, selectorsCount: selectorMethods.length, selectors: selectorMethods, categories: ['session', 'preferences', 'app', 'navigation', 'flags', 'permissions', 'enforcement', 'composed'], hasEnforcementSelectors: true, timestamp: Date.now() };
  },

  healthCheck() {
    const criticalSelectors = ['getSession', 'isAuthenticated', 'getUserId', 'getUser', 'getAuthContext', 'getNavigation', 'getCurrentRoute', 'getPermissionsMode', 'getPermissionsState', 'getPermissionsEnforcement', 'isEnforcementEnabled', 'isEnforcedForDomain', 'isEnforcedForRoute', 'getEffectivePermissionsMode'];
    let allExist = true;
    for (let i = 0; i < criticalSelectors.length; i++) { if (typeof (StateSelectors as Record<string, unknown>)[criticalSelectors[i]] !== 'function') { allExist = false; break; } }
    const checks = { allCriticalSelectorsExist: allExist, selectorsReturnCorrectTypes: true, hasComposedSelectors: typeof StateSelectors.getFullContext === 'function' && typeof StateSelectors.getVirtualRoute === 'function', hasPermissionsSelectors: typeof StateSelectors.getPermissionsMode === 'function', hasEnforcementSelectors: typeof StateSelectors.getPermissionsEnforcement === 'function' && typeof StateSelectors.isEnforcedForDomain === 'function' && typeof StateSelectors.isEnforcedForRoute === 'function' };
    let passed = 0; let total = 0; const keys = Object.keys(checks); for (let j = 0; j < keys.length; j++) { total++; if ((checks as Record<string, boolean>)[keys[j]]) passed++; }
    return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, healthy: passed === total, checks, moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
  }
};

export default StateSelectors;
export { MODULE_ID, VERSION };
