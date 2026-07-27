import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { AUTH_INTENTS } from "/core/runtime/events/catalog/auth.events.js";
import { CARD_EVENTS } from "/core/runtime/events/catalog/card.events.js";
import { PANEL_EVENTS } from "/core/runtime/events/catalog/panels.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-cards";
const getVersion = () => VERSION;
const CARD_COUNT = 12;
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _debug = () => {
  const cfg = _getPort("config");
  return cfg?.app?.debug ? true : false;
};
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    logger.error?.(`[${MODULE_ID}]`, ...args);
    return;
  }
  if (level === "warn") {
    logger.warn?.(`[${MODULE_ID}]`, ...args);
    return;
  }
  if (!_debug() && level === "debug") return;
  const fn = logger[level] || logger.info;
  fn?.(`[${MODULE_ID}]`, ...args);
};
const _isAuthenticated = () => {
  const auth = _getPort("auth");
  return auth?.isAuthenticated?.() ?? false;
};
const _emit = (eventName, data = {}) => {
  const eventBus = _getPort("eventBus");
  eventBus?.emit?.(eventName, { ...data, source: MODULE_ID, timestamp: Date.now() });
};
const _on = (eventName, handler) => {
  const eventBus = _getPort("eventBus");
  eventBus?.on?.(eventName, handler);
};
const _off = (eventName, handler) => {
  const eventBus = _getPort("eventBus");
  eventBus?.off?.(eventName, handler);
};
const _trackTelemetry = (action, data = {}) => {
  const tracker = _getPort("telemetryTracker");
  tracker?.track?.(`${MODULE_ID}:${action}`, { moduleId: MODULE_ID, action, ...data, timestamp: Date.now() });
};
const _metrics = { mountCount: 0, unmountCount: 0, refreshCount: 0, cardLoadSuccess: 0, cardLoadFail: 0, authFailCount: 0, lastActivity: null };
class CardsPanel {
  constructor() {
    this.container = null;
    this.config = null;
    this.cardInstances = /* @__PURE__ */ new Map();
    this.mounted = false;
    this.refreshing = false;
    this.abortController = new AbortController();
    this._onRefresh = this.refresh.bind(this);
    this._onVisibility = this.handleVisibility.bind(this);
  }
  async mount(container, config = {}) {
    _initPorts();
    if (!container || !(container instanceof HTMLElement)) return Promise.reject(new Error("Container invalido"));
    if (!_isAuthenticated()) {
      _metrics.authFailCount++;
      _trackTelemetry("mount_blocked_no_auth");
      container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #F59E0B;">Faca login para acessar este painel</div>';
      _emit(AUTH_INTENTS.LOGIN, { reason: "panel-mount-no-auth" });
      return false;
    }
    if (this.mounted) {
      _log("warn", "Ja montado, destruindo instancia anterior");
      await this.unmount();
    }
    this.container = container;
    this.config = { apiBaseUrl: "/api/modules/cards", autoRefresh: true, refreshInterval: 6e4, cardsToLoad: Array.from({ length: CARD_COUNT }, (_, i) => i + 1), ...config };
    if (config.autoRefresh === false) this.config.autoRefresh = false;
    _log("debug", "Montando com configuracao:", this.config);
    this.createCardContainers();
    await this.loadCards(this.config.cardsToLoad);
    this.setupEventListeners();
    this.mounted = true;
    _metrics.mountCount++;
    _metrics.lastActivity = Date.now();
    _emit(CARD_EVENTS.COMPONENT_READY, { component: MODULE_ID, type: "orchestrator", totalCards: this.cardInstances.size });
    _trackTelemetry("mounted", { cardsLoaded: this.cardInstances.size });
    _log("debug", `Montado com sucesso (${this.cardInstances.size} cards)`);
    return true;
  }
  createCardContainers() {
    const grid = document.createElement("div");
    grid.className = "cards-grid";
    grid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; padding: 2rem; max-width: 1400px; margin: 0 auto;";
    this.config.cardsToLoad.forEach((cardNum) => {
      const cardId = `card-${String(cardNum).padStart(2, "0")}`;
      const cardContainer = document.createElement("div");
      cardContainer.id = cardId;
      cardContainer.className = "card-container";
      grid.appendChild(cardContainer);
    });
    this.container.appendChild(grid);
    _log("debug", `${this.config.cardsToLoad.length} containers criados`);
  }
  async loadCards(cardNumbers) {
    const loadPromises = cardNumbers.map((num) => {
      const cardId = `card-${String(num).padStart(2, "0")}`;
      return this.loadSingleCard(cardId);
    });
    const results = await Promise.allSettled(loadPromises);
    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    _metrics.cardLoadSuccess += successful;
    _metrics.cardLoadFail += failed;
    _log("debug", `Carregamento: ${successful} sucesso, ${failed} falhas`);
  }
  async loadSingleCard(cardId) {
    const container = this.container.querySelector(`#${cardId}`);
    if (!container) throw new Error(`Container #${cardId} nao encontrado`);
    const cardNumber = cardId.replace("card-", "");
    const modulePath = `/components/cards/card-${cardNumber}/index.js`;
    try {
      const module = await import(modulePath);
      const CardClass = module.default || module[this.getCardClassName(cardId)];
      if (!CardClass) throw new Error(`Modulo ${cardId} nao expoe classe valida`);
      const cardInstance = new CardClass(container);
      this.cardInstances.set(cardId, cardInstance);
      _log("debug", `${cardId} carregado`);
    } catch (error) {
      _log("error", `Erro ao carregar ${cardId}:`, error);
      container.innerHTML = `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 180px; padding: 20px; text-align: center; color: rgba(255,255,255,0.6); background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px;"><div style="font-size: 14px;">Erro ao carregar ${cardId}</div></div>`;
      throw error;
    }
  }
  getCardClassName(cardId) {
    const classMap = { "card-01": "CardSuccessRate", "card-02": "CardGlobalSuccessRate", "card-03": "CardPerformanceScore", "card-04": "CardPeakHour", "card-05": "CardCompletados", "card-06": "Card06", "card-07": "Card07", "card-08": "Card08", "card-09": "Card09", "card-10": "Card10", "card-11": "Card11", "card-12": "CardMemoryUsage" };
    return classMap[cardId] || `Card${cardId.replace("card-", "")}`;
  }
  setupEventListeners() {
    _on(CARD_EVENTS.REFRESH_ALL_REQUEST, this._onRefresh);
    _on(PANEL_EVENTS.DATA_REFRESH, this._onRefresh);
    document.addEventListener("visibilitychange", this._onVisibility, { signal: this.abortController.signal });
  }
  handleVisibility() {
    if (!document.hidden && this.mounted) {
      _log("debug", "Pagina visivel, forcando refresh");
      this.refresh();
    }
  }
  async refresh() {
    if (!_isAuthenticated()) {
      _metrics.authFailCount++;
      _log("warn", "Refresh bloqueado - nao autenticado");
      return;
    }
    if (this.refreshing || document.hidden) return;
    this.refreshing = true;
    _metrics.refreshCount++;
    _metrics.lastActivity = Date.now();
    const startTime = Date.now();
    _emit(CARD_EVENTS.REFRESH_START, { timestamp: startTime });
    const refreshPromises = [];
    this.cardInstances.forEach((instance, cardId) => {
      refreshPromises.push(this.refreshSingleCard(cardId, instance));
    });
    try {
      const results = await Promise.allSettled(refreshPromises);
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;
      const duration = Date.now() - startTime;
      _emit(CARD_EVENTS.REFRESH_END, { duration, success: successful, failed });
      _trackTelemetry("refresh_complete", { duration, successful, failed });
    } catch (error) {
      _log("error", "Erro no refresh:", error);
    }
    this.refreshing = false;
  }
  refreshSingleCard(cardId, instance) {
    if (!instance || typeof instance.loadData !== "function") return Promise.resolve();
    return instance.loadData();
  }
  async unmount() {
    if (!this.mounted) return;
    this.abortController.abort();
    this.abortController = new AbortController();
    _off(CARD_EVENTS.REFRESH_ALL_REQUEST, this._onRefresh);
    _off(PANEL_EVENTS.DATA_REFRESH, this._onRefresh);
    this.cardInstances.forEach((instance, cardId) => {
      try {
        instance?.destroy?.();
      } catch (error) {
        _log("error", `Erro ao destruir ${cardId}:`, error);
      }
    });
    this.cardInstances.clear();
    if (this.container) this.container.innerHTML = "";
    this.container = null;
    this.config = null;
    this.mounted = false;
    _metrics.unmountCount++;
    _trackTelemetry("unmounted");
  }
  healthCheck() {
    const checks = { mounted: this.mounted, containerPresent: !!this.container, authenticated: _isAuthenticated(), hasCards: this.cardInstances.size > 0, abortControllerActive: !!this.abortController && !this.abortController.signal.aborted, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${total}`, checks, metrics: { ..._metrics }, version: VERSION, moduleId: MODULE_ID, p18Compliant: true, timestamp: Date.now() };
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION, mounted: this.mounted, cardsCount: this.cardInstances.size, cardIds: Array.from(this.cardInstances.keys()), authenticated: _isAuthenticated(), refreshing: this.refreshing, config: this.config ? { autoRefresh: this.config.autoRefresh, refreshInterval: this.config.refreshInterval, cardsToLoad: this.config.cardsToLoad } : null, metrics: { ..._metrics }, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck(), p18Compliant: true, timestamp: Date.now() };
  }
  getStatus() {
    return { version: VERSION, moduleId: MODULE_ID, mounted: this.mounted, cardsCount: this.cardInstances.size, authenticated: _isAuthenticated(), metrics: { ..._metrics }, portsInitialized: Ports.isInitialized(), p18Compliant: true, timestamp: Date.now() };
  }
}
let panelInstance = null;
const mount = async (container, config) => {
  _initPorts();
  if (panelInstance?.mounted && panelInstance.container === container) {
    _log("debug", "Ja montado no container correto");
    return panelInstance;
  }
  await unmount();
  panelInstance = new CardsPanel();
  await panelInstance.mount(container, config);
  return panelInstance;
};
const unmount = async () => {
  if (panelInstance) {
    await panelInstance.unmount();
    panelInstance = null;
  }
};
const refresh = () => panelInstance?.mounted ? panelInstance.refresh() : Promise.resolve();
const healthCheck = () => panelInstance?.healthCheck?.() ?? { status: "UNHEALTHY", mounted: false, p18Compliant: true, timestamp: Date.now() };
const info = () => panelInstance?.info?.() ?? { moduleId: MODULE_ID, version: VERSION, mounted: false, p18Compliant: true, timestamp: Date.now() };
const getStatus = () => panelInstance?.getStatus?.() ?? { mounted: false, p18Compliant: true, timestamp: Date.now() };
const destroy = () => unmount();
var panel_cards_default = { mount, unmount, destroy, refresh, healthCheck, info, getStatus, getVersion, injectPorts, getPorts, MODULE_ID, VERSION };
export {
  CardsPanel,
  MODULE_ID,
  VERSION,
  panel_cards_default as default,
  destroy,
  getPorts,
  getStatus,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  mount,
  refresh,
  unmount
};
