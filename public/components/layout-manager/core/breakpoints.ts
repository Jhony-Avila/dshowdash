// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: layout-manager.core.breakpoints
// PURPOSE: Layout Breakpoints v2.4.0-P17WI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   BreakpointManager — exported value
//   defaultBreakpoints — exported value
//   breakpointOrder — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
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

const VERSION = '2.4.0-P17WI';
const MODULE_ID = 'layout-manager.core.breakpoints';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts(this: any) { return Ports.snapshot(); }

const defaultBreakpoints = { xs: { min: 0, max: 575, name: 'xs', label: 'Extra Small' }, sm: { min: 576, max: 767, name: 'sm', label: 'Small' }, md: { min: 768, max: 991, name: 'md', label: 'Medium' }, lg: { min: 992, max: 1199, name: 'lg', label: 'Large' }, xl: { min: 1200, max: 1399, name: 'xl', label: 'Extra Large' }, xxl: { min: 1400, max: Infinity, name: 'xxl', label: 'Extra Extra Large' } };
const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
const MOBILE_BREAKPOINTS = ['xs', 'sm'];
const TABLET_BREAKPOINTS = ['md'];
const DESKTOP_BREAKPOINTS = ['lg', 'xl', 'xxl'];

let _debug = false;
let _metrics = { detectCount: 0, configureCount: 0, resetCount: 0 };

const _log = (level: string, msg: string) => { const logger = _getPort('logger'); if (!logger) return; if (level === 'error') { if (logger.error) logger.error(`[${MODULE_ID}]`, msg); return; } if (level === 'warn') { if (logger.warn) logger.warn(`[${MODULE_ID}]`, msg); return; } if (_debug && logger.debug) logger.debug(`[${MODULE_ID}]`, msg); };

const BreakpointManager = {
  breakpoints: Object.assign({}, defaultBreakpoints),
  setDebug(debug: boolean) { _debug = debug; },
  configure(customBreakpoints: Record<string, unknown>) { this.breakpoints = Object.assign({}, defaultBreakpoints, customBreakpoints); _metrics.configureCount++; _log('info', 'Breakpoints configured'); },
  reset() { this.breakpoints = Object.assign({}, defaultBreakpoints); _metrics.resetCount++; _log('info', 'Breakpoints reset to defaults'); },
  // @ts-expect-error strict migration — TS7053
  get(name: string) { return this.breakpoints[name] || null; },
  list() { return Object.keys(this.breakpoints); },
  getAll() { return Object.assign({}, this.breakpoints); },
  // @ts-expect-error strict migration — TS7053
  detect(width: number) { _metrics.detectCount++; for (let i = 0; i < breakpointOrder.length; i++) { const name = breakpointOrder[i]; const bp = this.breakpoints[name]; if (bp && width >= bp.min && width <= bp.max) return name; } return 'xl'; },
  isMobile(breakpoint: string) { return MOBILE_BREAKPOINTS.indexOf(breakpoint) !== -1; },
  isTablet(breakpoint: string) { return TABLET_BREAKPOINTS.indexOf(breakpoint) !== -1; },
  isDesktop(breakpoint: string) { return DESKTOP_BREAKPOINTS.indexOf(breakpoint) !== -1; },
  isAtLeast(current: string, target: string) { const currentIndex = breakpointOrder.indexOf(current); const targetIndex = breakpointOrder.indexOf(target); return currentIndex >= targetIndex; },
  isAtMost(current: string, target: string) { const currentIndex = breakpointOrder.indexOf(current); const targetIndex = breakpointOrder.indexOf(target); return currentIndex <= targetIndex; },
  // @ts-expect-error strict migration — TS7053
  getMediaQuery(breakpointName: string) { const bp = this.breakpoints[breakpointName]; if (!bp) return ''; if (bp.max === Infinity) return `(min-width: ${bp.min}px)`; return `(min-width: ${bp.min}px) and (max-width: ${bp.max}px)`; },
  // @ts-expect-error strict migration — TS2683
  healthCheck() { const logger = _getPort('logger'); const checks: Record<string, boolean> = { hasBreakpoints: Object.keys(this.breakpoints).length > 0, hasAllDefaults: breakpointOrder.every(function(bp) { return !!this.breakpoints[bp]; }, this), validOrder: breakpointOrder.length === 6, loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() }; let passed = 0; for (const k in checks) { if (checks[k]) passed++; } return { status: passed === Object.keys(checks).length ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${Object.keys(checks).length}`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; },
  info() { return { version: VERSION, moduleId: MODULE_ID, debug: _debug, portsInitialized: Ports.isInitialized(), breakpointCount: Object.keys(this.breakpoints).length, breakpointOrder, breakpoints: Object.assign({}, this.breakpoints), ranges: { mobile: MOBILE_BREAKPOINTS, tablet: TABLET_BREAKPOINTS, desktop: DESKTOP_BREAKPOINTS }, metrics: Object.assign({}, _metrics), healthCheck: this.healthCheck() }; },
  resetMetrics() { _metrics = { detectCount: 0, configureCount: 0, resetCount: 0 }; },
  getVersion() { return VERSION; }
};

export { BreakpointManager, defaultBreakpoints, breakpointOrder, VERSION, MODULE_ID, injectPorts, getPorts };
export default BreakpointManager;
