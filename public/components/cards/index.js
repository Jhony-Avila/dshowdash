import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.5.0-P2-ENTERPRISE";
const MODULE_ID = "cards-container";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
import { default as default2 } from "./cards-loader.js";
const CARDS = ["card-01", "card-02", "card-03", "card-04", "card-05", "card-06", "card-07", "card-08", "card-09", "card-10", "card-11", "card-12"];
const info = () => ({ version: VERSION, moduleId: MODULE_ID, cards: CARDS, totalCards: CARDS.length, portsInitialized: Ports.isInitialized(), timestamp: Date.now() });
const healthCheck = () => {
  const checks = { portsInitialized: Ports.isInitialized(), cardsAvailable: CARDS.length > 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
};
const cleanup = () => ({ success: true, moduleId: MODULE_ID });
const reset = () => cleanup();
const destroy = () => cleanup();
var cards_default = { VERSION, MODULE_ID, info, healthCheck, cleanup, reset, destroy, injectPorts, getPorts };
export {
  default2 as CardsLoader,
  MODULE_ID,
  VERSION,
  cleanup,
  cards_default as default,
  destroy,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  reset
};
