import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { CARD_EVENTS } from "/core/runtime/events/catalog/card.events.js";
import { API } from "/assets/js/core/api-client/index.js";
import { CARD_ID, CARD_NAME, CONFIG, STATES, EVENTS } from "./core/constants.js";
import { createStore } from "./state/store.js";
import { renderSkeleton, renderCard, renderError } from "./ui/renderer.js";
import { formatPercent, parseApiData } from "./utils/formatters.js";
import { createTracker } from "./telemetry/tracker.js";
const VERSION = "8.5.0-P2-ENTERPRISE";
const MODULE_ID = "components.cards.card-10";
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _debug = () => _getPort("config")?.app?.debug ?? false;
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger || !_debug() && level === "debug") return;
  logger[level]?.(`[${MODULE_ID}]`, ...args);
};
let _instance = null;
class CardPerformanceScore {
  static VERSION = VERSION;
  static MODULE_ID = MODULE_ID;
  constructor(container) {
    if (!container || !(container instanceof HTMLElement)) {
      _log("error", "Container inv\xE1lido");
      return;
    }
    _initPorts();
    this.container = container;
    this.cardId = container.id || CARD_ID;
    this.state = createStore(this.cardId);
    this.tracker = createTracker(this.cardId);
    this.apiEndpoint = CONFIG.API_ENDPOINT;
    this.refreshInterval = CONFIG.REFRESH_INTERVAL;
    this.intervalId = null;
    this.isFirstRender = true;
    this.$ = null;
    this._onRefresh = () => this.handleRefresh();
    this._onVisibility = () => this.handleVisibility();
    this._metrics = { loadCount: 0, errorCount: 0, lastLoadAt: null, initAt: Date.now() };
    _instance = this;
    this.init();
  }
  loadCSS() {
    const linkId = "card-10-styles";
    if (document.getElementById(linkId)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "/components/cards/card-10/styles.css";
      link.onload = resolve;
      link.onerror = () => reject(new Error("Failed to load CSS"));
      document.head.appendChild(link);
    });
  }
  init() {
    this.tracker.init();
    return this.loadCSS().then(() => {
      _log("debug", "Inicializando card");
      if (this.isFirstRender) this.renderSkeletonView();
      else this.render();
      return this.loadData();
    }).then(() => {
      this.startAutoRefresh();
      this.setupEventListeners();
      _getPort("eventBus")?.emit(CARD_EVENTS.READY, { cardId: MODULE_ID, timestamp: Date.now() });
      _log("debug", `${VERSION} inicializado com sucesso`);
    }).catch((error) => {
      _log("error", "Erro na inicializa\xE7\xE3o", { error: error.message });
      this._metrics.errorCount++;
      this.tracker.trackError(error, "init");
      this.render();
      this.setStatus("Erro na inicializa\xE7\xE3o");
    });
  }
  renderSkeletonView() {
    this.container.classList.add("is-loading");
    this.container.setAttribute("aria-busy", "true");
    this.container.innerHTML = renderSkeleton();
  }
  render() {
    const wasLoading = this.container.classList.contains("is-loading");
    this.container.classList.remove("is-loading");
    this.container.removeAttribute("aria-busy");
    this.container.innerHTML = renderCard();
    this.$ = { score: this.container.querySelector('[data-el="score"]'), status: this.container.querySelector('[data-el="status"]') };
    if (wasLoading && this.isFirstRender) {
      this.container.classList.add("fade-in-up");
      setTimeout(() => this.container.classList.remove("fade-in-up"), 400);
      this.isFirstRender = false;
    }
  }
  setStatus(msg) {
    if (this.$?.status) this.$.status.textContent = msg || "";
  }
  // @ts-expect-error strict migration — TS2339
  loadData() {
    return this.state.withLock("loadData", () => {
      this.state.setState(STATES.LOADING);
      this.container.classList.add("is-loading");
      this.setStatus("Carregando...");
      this._metrics.loadCount++;
      const startTime = performance.now();
      return API.get(this.apiEndpoint, { timeout: CONFIG.API_TIMEOUT, retries: CONFIG.API_RETRIES, headers: { "Accept": "application/json" } }).then((response) => {
        const duration = Math.round(performance.now() - startTime);
        _log("debug", `API call completed in ${duration}ms`);
        if (!response.ok || !response.data) throw new Error("Resposta inv\xE1lida da API");
        const data = response.data;
        if (!(data.success === true || data.ok === true) || !data.data) throw new Error("Dados n\xE3o dispon\xEDveis");
        if (this.container.classList.contains("is-loading")) this.render();
        const parsed = parseApiData(data);
        if (this.$?.score) this.$.score.textContent = formatPercent(parsed.performanceScore);
        this.setStatus("");
        this.container.classList.remove("is-loading", "has-error");
        this._metrics.lastLoadAt = Date.now();
        this.state.setState(STATES.SUCCESS, { performanceScore: parsed.performanceScore });
        this.tracker.trackLoad(duration, true);
        _log("debug", "Dados atualizados", { performanceScore: parsed.performanceScore });
      }).catch((error) => {
        if (error.name === "AbortError" || error.code === "REQUEST_ABORTED") {
          _log("debug", "Request cancelado");
          return;
        }
        const duration = Math.round(performance.now() - startTime);
        _log("error", "Erro ao carregar dados", { error: error.message });
        this._metrics.errorCount++;
        this.tracker.trackLoad(duration, false);
        this.tracker.trackError(error, "loadData");
        if (this.container.classList.contains("is-loading")) this.render();
        this.container.innerHTML = renderError("Erro ao carregar performance");
        this.setStatus("Erro ao carregar");
        this.container.classList.remove("is-loading");
        this.container.classList.add("has-error");
        this.state.setState(STATES.ERROR, { error: error.message });
      });
    });
  }
  handleRefresh() {
    if (!this.state.isPaused()) {
      this.tracker.trackRefresh("event", true);
      return this.loadData();
    }
  }
  handleVisibility() {
    if (document.hidden) {
      this.state.setState(STATES.PAUSED);
    } else if (this.state.isPaused()) {
      this.tracker.trackRefresh("visibility", true);
      return this.loadData();
    }
  }
  setupEventListeners() {
    const eb = _getPort("eventBus");
    if (eb) {
      eb.on(EVENTS.REFRESH, this._onRefresh);
      eb.on(EVENTS.CARD_REFRESH, this._onRefresh);
    }
    document.addEventListener("visibilitychange", this._onVisibility);
  }
  startAutoRefresh() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      if (!this.state.isPaused() && !document.hidden) {
        this.tracker.trackRefresh("interval", true);
        this.loadData();
      }
    }, this.refreshInterval);
    _log("debug", "Auto-refresh iniciado", { interval: this.refreshInterval });
  }
  destroy() {
    _log("debug", "Destruindo card");
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    const eb = _getPort("eventBus");
    if (eb) {
      eb.off(EVENTS.REFRESH, this._onRefresh);
      eb.off(EVENTS.CARD_REFRESH, this._onRefresh);
    }
    document.removeEventListener("visibilitychange", this._onVisibility);
    this.tracker?.destroy();
    this.state?.reset();
    this.$ = null;
    _instance = null;
    _log("debug", "Card destru\xEDdo");
  }
  getVersion() {
    return VERSION;
  }
  healthCheck() {
    const portsSnapshot = Ports.snapshot();
    const checks = { containerExists: !!this.container, stateValid: !!this.state && !this.state.isError(), autoRefreshActive: !!this.intervalId, noErrors: this._metrics.errorCount === 0, dataLoaded: this.state.isSuccess(), trackerActive: !!this.tracker?.initialized, portsInitialized: portsSnapshot._initialized };
    const score = Object.values(checks).filter(Boolean).length;
    const maxScore = Object.keys(checks).length;
    return { status: score >= 5 ? "HEALTHY" : score >= 3 ? "DEGRADED" : "UNHEALTHY", score, maxScore, scoreDisplay: `${score}/${maxScore}`, checks, state: this.state.state, portsInitialized: portsSnapshot._initialized, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  }
  info() {
    const portsSnapshot = Ports.snapshot();
    return { moduleId: MODULE_ID, version: VERSION, cardId: this.cardId, cardName: CARD_NAME, state: this.state.state, data: this.state.data, metrics: { ...this._metrics }, telemetryMetrics: this.tracker?.getMetrics() ?? null, autoRefreshActive: !!this.intervalId, refreshInterval: this.refreshInterval, portsInitialized: portsSnapshot._initialized, healthCheck: this.healthCheck(), timestamp: Date.now() };
  }
}
const getVersion = () => VERSION;
const getStatus = () => ({ cardId: MODULE_ID, version: VERSION, state: _instance?.state?.state ?? "NOT_INITIALIZED", data: _instance?.state?.data ?? null });
const healthCheck = () => _instance ? _instance.healthCheck() : { status: "UNHEALTHY", mounted: false, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
const info = () => _instance ? _instance.info() : { moduleId: MODULE_ID, version: VERSION, mounted: false, timestamp: Date.now() };
var card_10_default = CardPerformanceScore;
export {
  CARD_ID,
  CARD_NAME,
  CardPerformanceScore,
  MODULE_ID,
  VERSION,
  card_10_default as default,
  getPorts,
  getStatus,
  getVersion,
  healthCheck,
  info,
  injectPorts
};
