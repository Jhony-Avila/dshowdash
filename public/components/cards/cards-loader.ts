// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.8.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cards-loader
// PURPOSE: Cards loader with dynamic import and boot orchestration
// ───────────────────────────────────────────────────────────────
// @contract BOOT_CARDS - bootCards() boots all cards
// @contract GET_METRICS - getMetrics() returns loader metrics
// @contract GET_CARD_IDS - getCardIds() returns card ID list
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createUiPorts from /core/runtime/ports-profiles.js
// IMPORTS: CARD_EVENTS from /core/runtime/events/index.js
// PROVIDES: bootCards, getMetrics, getCardIds, healthCheck, info,
//           injectPorts, getPorts, VERSION, MODULE_ID
// @changelog v3.8.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v3.7.0-LOG-VERBOSITY: Plumbing logs info→debug (inicializado sucesso, ReadyFlags, EventBus)
// @changelog v3.6.0-ENTERPRISE: ES6 modernization (const/let, arrow functions, template literals)
// @changelog v3.5.0-P18EC: P18EC Events Contracts Migration
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { CARD_EVENTS } from '/core/runtime/events/catalog/card.events.js';

export const VERSION = '3.8.0-P2-ENTERPRISE';
export const MODULE_ID = 'cards-loader';

const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _debug = () => _getPort('config')?.app?.debug ?? false;
const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger');
  if (!logger) return;
  if (level === 'error') { logger.error?.('[CardsLoader]', ...args); return; }
  if (level === 'warn') { logger.warn?.('[CardsLoader]', ...args); return; }
  if (level === 'info') { logger.info?.('[CardsLoader]', ...args); return; }
  if (_debug()) logger.debug?.('[CardsLoader]', ...args);
};

const cardIds = ['card-01', 'card-02', 'card-03', 'card-04', 'card-05', 'card-06', 'card-07', 'card-08', 'card-09', 'card-10', 'card-11', 'card-12'];

const _metrics: { bootCount: number; successCount: number; errorCount: number; lastBootAt: number | null; cardsLoaded: string[]; readyFlagsUsed: boolean } = { bootCount: 0, successCount: 0, errorCount: 0, lastBootAt: null, cardsLoaded: [], readyFlagsUsed: false };

export const bootCards = async () => {
  _initPorts();
  const eb = _getPort('eventBus');
  if (!eb) { _log('error', 'EventBus global nao encontrado'); return { success: false, reason: 'no-eventbus' }; }
  _log('info', 'Iniciando boot dos cards...');
  let successCount = 0;
  let errorCount = 0;
  _metrics.bootCount++;
  _metrics.lastBootAt = Date.now();
  _metrics.cardsLoaded = [];
  for (const id of cardIds) {
    const root = document.getElementById(`${id}-root`);
    if (!root) { _log('debug', `Slot #${id}-root nao encontrado (ignorando)`); continue; }
    if (root.dataset.initialized === 'true') { _log('debug', `Card ${id} ja inicializado (ignorando)`); continue; }
    try {
      _log('debug', `Carregando ${id}...`);
      const module = await import(`/components/cards/${id}/index.js`);
      if (typeof module.init === 'function') {
        await module.init(`#${id}-root`);
        root.dataset.initialized = 'true';
        successCount++;
        _metrics.cardsLoaded.push(id);
        _log('debug', `${id} inicializado com sucesso`);
      } else {
        throw new Error('Modulo nao exporta funcao init()');
      }
    } catch (error: any) {
      errorCount++;
      _log('error', `Falha ao inicializar ${id}:`, error.message);
      const eb2 = _getPort('eventBus');
      eb2?.emit?.(CARD_EVENTS.ERROR, { cardId: id, error: error.message, timestamp: Date.now() });
    }
  }
  _metrics.successCount = successCount;
  _metrics.errorCount = errorCount;
  _log('info', `Boot finalizado: ${successCount} sucesso, ${errorCount} erros`);
  const eb3 = _getPort('eventBus');
  eb3?.emit?.(CARD_EVENTS.BOOT_COMPLETE, { total: cardIds.length, success: successCount, errors: errorCount, timestamp: Date.now() });
  return { success: true, total: cardIds.length, loaded: successCount, errors: errorCount };
};

export const getMetrics = () => ({ ..._metrics });
export const getCardIds = () => [...cardIds];

export const healthCheck = () => {
  const portsSnapshot = Ports.snapshot();
  const eb = _getPort('eventBus');
  const checks = { hasEventBus: !!eb, hasBooted: _metrics.bootCount > 0, lowErrorRate: _metrics.successCount === 0 || (_metrics.errorCount / _metrics.successCount) < 0.2, cardsConfigured: cardIds.length > 0, portsInitialized: portsSnapshot._initialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/${total}`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, readyFlagsUsed: _metrics.readyFlagsUsed, timestamp: Date.now() };
};

export const info = () => {
  const portsSnapshot = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, cardIds: [...cardIds], totalCards: cardIds.length, metrics: getMetrics(), portsInitialized: portsSnapshot._initialized, readyFlagsUsed: _metrics.readyFlagsUsed, timestamp: Date.now() };
};

const autoInit = async () => {
  _initPorts();
  const rf = _getPort('readyFlags');
  if (rf?.waitFor) {
    _metrics.readyFlagsUsed = true;
    _log('debug', 'Usando ReadyFlags.waitFor(eventbus) para aguardar EventBus');
    const ready = await rf.waitFor('eventbus', 8000);
    if (ready) { bootCards(); return; }
    _log('debug', 'ReadyFlags.waitFor(eventbus) timeout, tentando boot direto...');
  }
  const eb = _getPort('eventBus');
  if (eb) { bootCards(); }
  else { _log('debug', 'EventBus nao disponivel, aguardando DOMContentLoaded...'); setTimeout(bootCards, 100); }
};

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', autoInit); }
else { setTimeout(autoInit, 100); }

export default { bootCards, getMetrics, getCardIds, healthCheck, info, VERSION, MODULE_ID };
