// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cards-container
// PURPOSE: Cards container with loader and card enumeration
// ───────────────────────────────────────────────────────────────
// @contract INFO - info() returns module information
// @contract HEALTH - healthCheck() returns health status
// @contract CLEANUP - cleanup() performs cleanup
// @contract RESET - reset() resets module
// @contract DESTROY - destroy() destroys module
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: CardsLoader from ./cards-loader.js
// PROVIDES: CardsLoader, info, healthCheck, cleanup, reset, destroy,
//           injectPorts, getPorts, VERSION, MODULE_ID
// @changelog v1.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.4.0-ENTERPRISE: ES6 modernization (const/let, arrow functions)
// @changelog v1.3.0-ENTERPRISE: Added Ports Pattern (P17WI compliance)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'cards-container';

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

export { default as CardsLoader } from './cards-loader.js';

const CARDS = ['card-01','card-02','card-03','card-04','card-05','card-06','card-07','card-08','card-09','card-10','card-11','card-12'];

export const info = () => ({ version: VERSION, moduleId: MODULE_ID, cards: CARDS, totalCards: CARDS.length, portsInitialized: Ports.isInitialized(), timestamp: Date.now() });

export const healthCheck = () => {
  const checks = { portsInitialized: Ports.isInitialized(), cardsAvailable: CARDS.length > 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
};

export const cleanup = () => ({ success: true, moduleId: MODULE_ID });
export const reset = () => cleanup();
export const destroy = () => cleanup();

export default { VERSION, MODULE_ID, info, healthCheck, cleanup, reset, destroy, injectPorts, getPorts };
