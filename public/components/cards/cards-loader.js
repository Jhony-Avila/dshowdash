import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { CARD_EVENTS } from "/core/runtime/events/catalog/card.events.js";
const VERSION = "3.8.0-P2-ENTERPRISE";
const MODULE_ID = "cards-loader";
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _debug = () => _getPort("config")?.app?.debug ?? false;
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    logger.error?.("[CardsLoader]", ...args);
    return;
  }
  if (level === "warn") {
    logger.warn?.("[CardsLoader]", ...args);
    return;
  }
  if (level === "info") {
    logger.info?.("[CardsLoader]", ...args);
    return;
  }
  if (_debug()) logger.debug?.("[CardsLoader]", ...args);
};
const cardIds = ["card-01", "card-02", "card-03", "card-04", "card-05", "card-06", "card-07", "card-08", "card-09", "card-10", "card-11", "card-12"];
const _metrics = { bootCount: 0, successCount: 0, errorCount: 0, lastBootAt: null, cardsLoaded: [], readyFlagsUsed: false };
const bootCards = async () => {
  _initPorts();
  const eb = _getPort("eventBus");
  if (!eb) {
    _log("error", "EventBus global nao encontrado");
    return { success: false, reason: "no-eventbus" };
  }
  _log("info", "Iniciando boot dos cards...");
  let successCount = 0;
  let errorCount = 0;
  _metrics.bootCount++;
  _metrics.lastBootAt = Date.now();
  _metrics.cardsLoaded = [];
  for (const id of cardIds) {
    const root = document.getElementById(`${id}-root`);
    if (!root) {
      _log("debug", `Slot #${id}-root nao encontrado (ignorando)`);
      continue;
    }
    if (root.dataset.initialized === "true") {
      _log("debug", `Card ${id} ja inicializado (ignorando)`);
      continue;
    }
    try {
      _log("debug", `Carregando ${id}...`);
      const module = await import(`/components/cards/${id}/index.js`);
      if (typeof module.init === "function") {
        await module.init(`#${id}-root`);
        root.dataset.initialized = "true";
        successCount++;
        _metrics.cardsLoaded.push(id);
        _log("debug", `${id} inicializado com sucesso`);
      } else {
        throw new Error("Modulo nao exporta funcao init()");
      }
    } catch (error) {
      errorCount++;
      _log("error", `Falha ao inicializar ${id}:`, error.message);
      const eb2 = _getPort("eventBus");
      eb2?.emit?.(CARD_EVENTS.ERROR, { cardId: id, error: error.message, timestamp: Date.now() });
    }
  }
  _metrics.successCount = successCount;
  _metrics.errorCount = errorCount;
  _log("info", `Boot finalizado: ${successCount} sucesso, ${errorCount} erros`);
  const eb3 = _getPort("eventBus");
  eb3?.emit?.(CARD_EVENTS.BOOT_COMPLETE, { total: cardIds.length, success: successCount, errors: errorCount, timestamp: Date.now() });
  return { success: true, total: cardIds.length, loaded: successCount, errors: errorCount };
};
const getMetrics = () => ({ ..._metrics });
const getCardIds = () => [...cardIds];
const healthCheck = () => {
  const portsSnapshot = Ports.snapshot();
  const eb = _getPort("eventBus");
  const checks = { hasEventBus: !!eb, hasBooted: _metrics.bootCount > 0, lowErrorRate: _metrics.successCount === 0 || _metrics.errorCount / _metrics.successCount < 0.2, cardsConfigured: cardIds.length > 0, portsInitialized: portsSnapshot._initialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${total}`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, readyFlagsUsed: _metrics.readyFlagsUsed, timestamp: Date.now() };
};
const info = () => {
  const portsSnapshot = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, cardIds: [...cardIds], totalCards: cardIds.length, metrics: getMetrics(), portsInitialized: portsSnapshot._initialized, readyFlagsUsed: _metrics.readyFlagsUsed, timestamp: Date.now() };
};
const autoInit = async () => {
  _initPorts();
  const rf = _getPort("readyFlags");
  if (rf?.waitFor) {
    _metrics.readyFlagsUsed = true;
    _log("debug", "Usando ReadyFlags.waitFor(eventbus) para aguardar EventBus");
    const ready = await rf.waitFor("eventbus", 8e3);
    if (ready) {
      bootCards();
      return;
    }
    _log("debug", "ReadyFlags.waitFor(eventbus) timeout, tentando boot direto...");
  }
  const eb = _getPort("eventBus");
  if (eb) {
    bootCards();
  } else {
    _log("debug", "EventBus nao disponivel, aguardando DOMContentLoaded...");
    setTimeout(bootCards, 100);
  }
};
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoInit);
} else {
  setTimeout(autoInit, 100);
}
var cards_loader_default = { bootCards, getMetrics, getCardIds, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  bootCards,
  cards_loader_default as default,
  getCardIds,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
