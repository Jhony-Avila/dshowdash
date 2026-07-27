import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { CAROUSEL_EVENTS } from "/core/runtime/events/catalog/carousel.events.js";
const MODULE_ID = "carousel-index";
const VERSION = "1.8.0-P2-ENTERPRISE";
export * from "./carousel.js";
import * as Carousel from "./carousel.js";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
let _initialized = false;
let _debug = false;
const _log = (level, msg) => {
  if (!_debug && level !== "error" && level !== "warn") return;
  const logger = _getPort("logger");
  logger?.[level]?.(`[${MODULE_ID}] ${msg}`);
};
const init = (options = {}) => {
  if (_initialized) {
    _log("warn", "J\xE1 inicializado");
    return Carousel;
  }
  _initPorts();
  _debug = options.debug || false;
  _initialized = true;
  _log("info", `${VERSION} inicializado`);
  const eb = _getPort("eventBus");
  eb?.emit?.(CAROUSEL_EVENTS.READY, { version: VERSION });
  return Carousel;
};
const getVersion = () => VERSION;
const healthCheck = () => {
  const checks = { initialized: _initialized, carouselModuleLoaded: typeof Carousel.goTo === "function", stateAvailable: typeof Carousel.getState === "function", eventsAvailable: typeof Carousel.on === "function", portsInitialized: Ports.isInitialized() };
  const score = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const status = score === total ? "HEALTHY" : score > 2 ? "DEGRADED" : "UNHEALTHY";
  return { status, score, maxScore: total, scoreDisplay: `${score}/${total}`, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION, initialized: _initialized, portsInitialized: Ports.isInitialized(), exports: Object.keys(Carousel), healthCheck: healthCheck(), timestamp: Date.now() });
const cleanup = () => {
  _initialized = false;
  _debug = false;
  return { success: true, moduleId: MODULE_ID };
};
const reset = () => cleanup();
const destroy = () => cleanup();
if (typeof window !== "undefined") {
  const carouselApi = { init, getVersion, healthCheck, info, cleanup, reset, destroy, Carousel, injectPorts, getPorts };
  window.__dev = window.__dev || {};
  window.__dev.carouselIndex = carouselApi;
  if (isStrict()) {
    const originalCarouselIndex = carouselApi;
    Object.defineProperty(window.__dev, "carouselIndex", {
      get() {
        recordViolation("DIAGNOSTIC_WINDOW_ACCESS", { module: MODULE_ID, property: "carouselIndex", access: "devtools-access" });
        return originalCarouselIndex;
      },
      configurable: true
    });
  }
}
var carousel_default = Carousel;
export {
  MODULE_ID,
  VERSION,
  cleanup,
  carousel_default as default,
  destroy,
  getPorts,
  getVersion,
  healthCheck,
  info,
  init,
  injectPorts,
  reset
};
