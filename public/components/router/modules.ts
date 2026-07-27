// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.modules
// PURPOSE: Router Modules Index v1.1.0-P17WI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   RouterModules — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   RouteCache — exported value
//   ResolutionDebounce — exported value
//   RouterHooks — exported value
//   HOOK_TYPES — exported value
//   RouterMiddleware — exported value
//   RouterMetrics — exported value
//   RouterAudit — exported value
//   DeadRouteDetector — exported value
//   RouterAnalytics — exported value
//   NavigationHistory — exported value
//   BreadcrumbGenerator — exported value
//   DeepLinkResolver — exported value
//   ScrollRestoration — exported value
//   RoutePreloader — exported value
//   RouteTransitions — exported value
//   TRANSITION_TYPES — exported value
//   RouterCSRF — exported value
//   CircularCheck — exported value
//   RouteSchemaValidator — exported value
//   RouterErrorTracker — exported value
//   ERROR_TYPES — exported value
//   SEVERITY — exported value
//   RealtimeMonitor — exported value
//   MockRouterMode — exported value
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
import { createCorePorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '1.1.0-P17WI';
export const MODULE_ID = 'router.modules';
const Ports = createCorePorts({ moduleId: MODULE_ID });
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export { RouteCache } from './cache/index.js';
export { ResolutionDebounce } from './cache/debounce.js';
export { RouterHooks, HOOK_TYPES } from './hooks/index.js';
export { RouterMiddleware } from './middleware/index.js';
export { RouterMetrics } from './analytics/metrics.js';
export { RouterAudit } from './analytics/audit.js';
export { DeadRouteDetector } from './analytics/dead-routes.js';
export { RouterAnalytics } from './analytics/dashboard.js';
export { NavigationHistory } from './navigation/history.js';

// @ts-expect-error TS migration - TS2614
export { BreadcrumbGenerator } from './navigation/breadcrumb.js';

// @ts-expect-error TS migration - TS2614
export { DeepLinkResolver } from './navigation/deep-link.js';

// @ts-expect-error TS migration - TS2614
export { ScrollRestoration } from './navigation/scroll.js';

// @ts-expect-error TS migration - TS2614
export { RoutePreloader } from './navigation/preload.js';

// @ts-expect-error TS migration - TS2614
export { RouteTransitions, TRANSITION_TYPES } from './navigation/transitions.js';

// @ts-expect-error TS migration - TS2614
export { RouterCSRF } from './security/csrf.js';

// @ts-expect-error TS migration - TS2614
export { CircularCheck } from './security/circular-check.js';

// @ts-expect-error TS migration - TS2614
export { RouteSchemaValidator } from './security/schema.js';

// @ts-expect-error TS migration - TS2614
export { RouterErrorTracker, ERROR_TYPES, SEVERITY } from './monitoring/error-tracker.js';

// @ts-expect-error TS migration - TS2614
export { RealtimeMonitor } from './monitoring/realtime.js';

// @ts-expect-error TS migration - TS2614
export { MockRouterMode } from './monitoring/mock-mode.js';
export const RouterModules = { VERSION, async getStatus() { const modules = await Promise.all([import('./cache/index.js').then(m => m.RouteCache.getStatus()).catch((): null => null), import('./cache/debounce.js').then(m => m.ResolutionDebounce.getStatus()).catch((): null => null), import('./hooks/index.js').then(m => m.RouterHooks.getStatus()).catch((): null => null), import('./middleware/index.js').then(m => m.RouterMiddleware.getStatus()).catch((): null => null), import('./analytics/metrics.js').then(m => m.RouterMetrics.getStatus()).catch((): null => null), import('./analytics/audit.js').then(m => m.RouterAudit.getStatus()).catch((): null => null), import('./analytics/dead-routes.js').then(m => m.DeadRouteDetector.getStatus()).catch((): null => null), import('./analytics/dashboard.js').then(m => m.RouterAnalytics.getStatus()).catch((): null => null), import('./navigation/history.js').then(m => m.NavigationHistory.getStatus()).catch((): null => null), import('./navigation/breadcrumb.js').then((m: Record<string, any>) => m.BreadcrumbGenerator.getStatus()).catch((): null => null), import('./navigation/deep-link.js').then((m: Record<string, any>) => m.DeepLinkResolver.getStatus()).catch((): null => null), import('./navigation/scroll.js').then((m: Record<string, any>) => m.ScrollRestoration.getStatus()).catch((): null => null), import('./navigation/preload.js').then((m: Record<string, any>) => m.RoutePreloader.getStatus()).catch((): null => null), import('./navigation/transitions.js').then((m: Record<string, any>) => m.RouteTransitions.getStatus()).catch((): null => null), import('./security/csrf.js').then((m: Record<string, any>) => m.RouterCSRF.getStatus()).catch((): null => null), import('./security/circular-check.js').then((m: Record<string, any>) => m.CircularCheck.getStatus()).catch((): null => null), import('./security/schema.js').then((m: Record<string, any>) => m.RouteSchemaValidator.getStatus()).catch((): null => null), import('./monitoring/error-tracker.js').then((m: Record<string, any>) => m.RouterErrorTracker.getStatus()).catch((): null => null), import('./monitoring/realtime.js').then((m: Record<string, any>) => m.RealtimeMonitor.getStatus()).catch((): null => null), import('./monitoring/mock-mode.js').then((m: Record<string, any>) => m.MockRouterMode.getStatus()).catch((): null => null)]); return { version: VERSION, timestamp: new Date().toISOString(), modules: modules.filter(Boolean), portsInitialized: Ports.isInitialized() }; }, async healthCheck() { const checks = await Promise.all([import('./cache/index.js').then(m => m.RouteCache.healthCheck()).catch((): { status: string } => ({ status: 'ERROR' })), import('./hooks/index.js').then(m => m.RouterHooks.healthCheck()).catch((): { status: string } => ({ status: 'ERROR' })), import('./middleware/index.js').then(m => m.RouterMiddleware.healthCheck()).catch((): { status: string } => ({ status: 'ERROR' })), import('./analytics/dashboard.js').then(m => m.RouterAnalytics.healthCheck()).catch((): { status: string } => ({ status: 'ERROR' })), import('./security/csrf.js').then((m: Record<string, any>) => m.RouterCSRF.healthCheck()).catch((): { status: string } => ({ status: 'ERROR' })), import('./monitoring/error-tracker.js').then((m: Record<string, any>) => m.RouterErrorTracker.healthCheck()).catch((): { status: string } => ({ status: 'ERROR' }))]); const statuses = checks.map(c => c.status); let overall = 'HEALTHY'; if (statuses.includes('ERROR') || statuses.includes('UNHEALTHY')) overall = 'UNHEALTHY'; else if (statuses.includes('DEGRADED') || statuses.includes('WARNING')) overall = 'DEGRADED'; return { status: overall, version: VERSION, timestamp: new Date().toISOString(), checks, portsInitialized: Ports.isInitialized() }; }, list() { return [{ name: 'RouteCache', path: './cache/index.js', category: 'cache' }, { name: 'ResolutionDebounce', path: './cache/debounce.js', category: 'cache' }, { name: 'RouterHooks', path: './hooks/index.js', category: 'hooks' }, { name: 'RouterMiddleware', path: './middleware/index.js', category: 'middleware' }, { name: 'RouterMetrics', path: './analytics/metrics.js', category: 'analytics' }, { name: 'RouterAudit', path: './analytics/audit.js', category: 'analytics' }, { name: 'DeadRouteDetector', path: './analytics/dead-routes.js', category: 'analytics' }, { name: 'RouterAnalytics', path: './analytics/dashboard.js', category: 'analytics' }, { name: 'NavigationHistory', path: './navigation/history.js', category: 'navigation' }, { name: 'BreadcrumbGenerator', path: './navigation/breadcrumb.js', category: 'navigation' }, { name: 'DeepLinkResolver', path: './navigation/deep-link.js', category: 'navigation' }, { name: 'ScrollRestoration', path: './navigation/scroll.js', category: 'navigation' }, { name: 'RoutePreloader', path: './navigation/preload.js', category: 'navigation' }, { name: 'RouteTransitions', path: './navigation/transitions.js', category: 'navigation' }, { name: 'RouterCSRF', path: './security/csrf.js', category: 'security' }, { name: 'CircularCheck', path: './security/circular-check.js', category: 'security' }, { name: 'RouteSchemaValidator', path: './security/schema.js', category: 'security' }, { name: 'RouterErrorTracker', path: './monitoring/error-tracker.js', category: 'monitoring' }, { name: 'RealtimeMonitor', path: './monitoring/realtime.js', category: 'monitoring' }, { name: 'MockRouterMode', path: './monitoring/mock-mode.js', category: 'monitoring' }]; } };
export default RouterModules;
