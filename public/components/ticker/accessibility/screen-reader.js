import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "ticker.accessibility.screen-reader";
const hasWindow = typeof window !== "undefined";
const hasDocument = typeof document !== "undefined";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args);
};
const STYLES = `.ticker-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; } .ticker-live-region { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }`;
class ScreenReaderAnnouncer {
  constructor(options = {}) {
    this.politeness = options.politeness || "polite";
    this.debounceMs = options.debounceMs || 500;
    this.maxQueueSize = options.maxQueueSize || 5;
    this._liveRegion = null;
    this._queue = [];
    this._processing = false;
    this._debounceTimer = null;
    this._metrics = { announcements: 0, queued: 0, dropped: 0 };
  }
  init() {
    this._injectStyles();
    this._createLiveRegion();
    _log("debug", "ScreenReaderAnnouncer initialized");
    return this;
  }
  _injectStyles() {
    if (!hasDocument || document.getElementById("ticker-sr-styles")) return;
    const style = document.createElement("style");
    style.id = "ticker-sr-styles";
    style.textContent = STYLES;
    document.head.appendChild(style);
  }
  _createLiveRegion() {
    if (!hasDocument) return;
    this._liveRegion = document.createElement("div");
    this._liveRegion.className = "ticker-live-region";
    this._liveRegion.setAttribute("role", "status");
    this._liveRegion.setAttribute("aria-live", this.politeness);
    this._liveRegion.setAttribute("aria-atomic", "true");
    document.body.appendChild(this._liveRegion);
  }
  announce(message, options = {}) {
    if (!message) return;
    const priority = options.priority || "normal";
    const immediate = options.immediate || false;
    if (this._queue.length >= this.maxQueueSize) {
      if (priority === "high") {
        this._queue.shift();
        this._metrics.dropped++;
      } else {
        this._metrics.dropped++;
        return;
      }
    }
    this._queue.push({ message, priority, timestamp: Date.now() });
    this._metrics.queued++;
    if (immediate) {
      this._processQueue();
    } else {
      this._scheduleProcess();
    }
  }
  announceNewItems(count) {
    if (count <= 0) return;
    const message = count === 1 ? "Uma nova noticia disponivel" : `${count} novas noticias disponiveis`;
    this.announce(message, { priority: "normal" });
  }
  announceStatus(status) {
    const messages = { loading: "Carregando noticias", loaded: "Noticias carregadas", offline: "Sem conexao. Mostrando noticias em cache.", error: "Erro ao carregar noticias", paused: "Ticker pausado", playing: "Ticker em reproducao" };
    const message = messages[status];
    if (message) this.announce(message);
  }
  announceNavigation(index, total, title) {
    const message = `Noticia ${index + 1} de ${total}: ${title}`;
    this.announce(message, { immediate: true });
  }
  _scheduleProcess() {
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => this._processQueue(), this.debounceMs);
  }
  _processQueue() {
    if (this._processing || this._queue.length === 0) return;
    this._processing = true;
    const highPriority = this._queue.filter((item2) => item2.priority === "high");
    const item = highPriority.length > 0 ? highPriority.shift() : this._queue.shift();
    this._queue = this._queue.filter((q) => q !== item);
    if (this._liveRegion && item) {
      this._liveRegion.textContent = "";
      requestAnimationFrame(() => {
        this._liveRegion.textContent = item.message;
        this._metrics.announcements++;
        _log("debug", `Announced: ${item.message}`);
      });
    }
    setTimeout(() => {
      this._processing = false;
      if (this._queue.length > 0) this._processQueue();
    }, 1e3);
  }
  clear() {
    this._queue = [];
    if (this._liveRegion) this._liveRegion.textContent = "";
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
  }
  setPoliteness(level) {
    this.politeness = level;
    if (this._liveRegion) {
      this._liveRegion.setAttribute("aria-live", level);
    }
  }
  destroy() {
    this.clear();
    if (this._liveRegion && this._liveRegion.parentNode) {
      this._liveRegion.parentNode.removeChild(this._liveRegion);
    }
    this._liveRegion = null;
  }
  healthCheck() {
    const logger = _getPort("logger");
    const checks = { hasLiveRegion: !!this._liveRegion, regionInDOM: !!this._liveRegion?.parentNode, loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 4 ? "HEALTHY" : "DEGRADED", score: `${passed}/4`, queueSize: this._queue.length, checks, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, politeness: this.politeness, queueSize: this._queue.length, metrics: { ...this._metrics }, portsInitialized: Ports.isInitialized() };
  }
}
function getVersion() {
  return VERSION;
}
var screen_reader_default = ScreenReaderAnnouncer;
export {
  MODULE_ID,
  ScreenReaderAnnouncer,
  VERSION,
  screen_reader_default as default,
  getPorts,
  getVersion,
  injectPorts
};
