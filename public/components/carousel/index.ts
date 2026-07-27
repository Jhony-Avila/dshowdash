// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.8.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.carousel
// PURPOSE: Carousel component index with initialization and lifecycle
// ───────────────────────────────────────────────────────────────
// @contract INIT - init(options) initializes carousel module
// @contract CLEANUP - cleanup() cleans up carousel module
// @contract RESET - reset() resets carousel module
// @contract DESTROY - destroy() destroys carousel module
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: CAROUSEL_EVENTS from /core/runtime/events/index.js
// IMPORTS: isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
// IMPORTS: Carousel from ./carousel.js
// PROVIDES: init, getVersion, healthCheck, info, cleanup, reset, destroy,
//           Carousel, injectPorts, getPorts, VERSION, MODULE_ID
// @changelog v1.8.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.7.0-STRICT-MODE: Strict mode integration
// @changelog v1.6.0-ENTERPRISE: ES6 modernization
// @changelog v1.5.0-ENTERPRISE: Added destroy for complete lifecycle
// ═══════════════════════════════════════════════════════════════
'use strict';

import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { CAROUSEL_EVENTS } from '/core/runtime/events/catalog/carousel.events.js';

const MODULE_ID = 'carousel-index';
const VERSION = '1.8.0-P2-ENTERPRISE';

export * from './carousel.js';

import * as Carousel from './carousel.js';

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

let _initialized = false;
let _debug = false;

const _log = (level: 'error' | 'warn' | 'info' | 'debug', msg: string) => { if (!_debug && level !== 'error' && level !== 'warn') return; const logger = _getPort('logger'); logger?.[level]?.(`[${MODULE_ID}] ${msg}`); };

const init = (options: { debug?: boolean } & Record<string, unknown> = {}) => {
  if (_initialized) { _log('warn', 'Já inicializado'); return Carousel; }
  _initPorts();
  _debug = options.debug || false;
  _initialized = true;
  _log('info', `${VERSION} inicializado`);
  const eb = _getPort('eventBus');
  eb?.emit?.(CAROUSEL_EVENTS.READY, { version: VERSION });
  return Carousel;
};

const getVersion = () => VERSION;

const healthCheck = () => {
  const checks = { initialized: _initialized, carouselModuleLoaded: typeof Carousel.goTo === 'function', stateAvailable: typeof Carousel.getState === 'function', eventsAvailable: typeof Carousel.on === 'function', portsInitialized: Ports.isInitialized() };
  const score = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const status = score === total ? 'HEALTHY' : score > 2 ? 'DEGRADED' : 'UNHEALTHY';
  return { status, score, maxScore: total, scoreDisplay: `${score}/${total}`, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
};

const info = () => ({ moduleId: MODULE_ID, version: VERSION, initialized: _initialized, portsInitialized: Ports.isInitialized(), exports: Object.keys(Carousel), healthCheck: healthCheck(), timestamp: Date.now() });

const cleanup = () => { _initialized = false; _debug = false; return { success: true, moduleId: MODULE_ID }; };
const reset = () => cleanup();
const destroy = () => cleanup();

if (typeof window !== 'undefined') {
  const carouselApi = { init, getVersion, healthCheck, info, cleanup, reset, destroy, Carousel, injectPorts, getPorts };

  // DevTools sempre permitido
  (window as any).__dev = (window as any).__dev || {};
  (window as any).__dev.carouselIndex = carouselApi;

  // Em strict mode, registrar violação se acessado via window.__dev.carouselIndex diretamente fora de DevTools
  if (isStrict()) {
    const originalCarouselIndex = carouselApi;
    Object.defineProperty((window as any).__dev, 'carouselIndex', {
      get() {
        recordViolation('DIAGNOSTIC_WINDOW_ACCESS', { module: MODULE_ID, property: 'carouselIndex', access: 'devtools-access' });
        return originalCarouselIndex;
      },
      configurable: true
    });
  }
}

export { init, getVersion, healthCheck, info, cleanup, reset, destroy, VERSION, MODULE_ID };
export default Carousel;
