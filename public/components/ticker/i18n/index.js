import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.3.0-P17WI";
const MODULE_ID = "ticker.i18n";
const hasWindow = typeof window !== "undefined";
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
function _log(level, ...args) {
  const logger = _getPort("logger");
  if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args);
}
const TRANSLATIONS = { "pt-BR": { loading: "Carregando dados...", offline: "Sem conex\xE3o", noData: "Nenhum dado dispon\xEDvel", error: "Erro ao carregar", retry: "Tentar novamente", refresh: "Atualizar", pause: "Pausar", play: "Reproduzir", settings: "Configura\xE7\xF5es", close: "Fechar", newItems: "{count} nova(s) not\xEDcia(s)", lastUpdate: "\xDAltima atualiza\xE7\xE3o: {time}", categories: { breaking: "URGENTE", economia: "ECONOMIA", politica: "POL\xCDTICA", tecnologia: "TECNOLOGIA", esportes: "ESPORTES", saude: "SA\xDADE", geral: "GERAL" }, accessibility: { tickerLabel: "Ticker de not\xEDcias", newNews: "Nova not\xEDcia dispon\xEDvel", pausedAnnounce: "Ticker pausado", resumedAnnounce: "Ticker em execu\xE7\xE3o", navigationHint: "Use as setas para navegar entre not\xEDcias" }, time: { justNow: "agora", minutesAgo: "h\xE1 {n} min", hoursAgo: "h\xE1 {n}h", yesterday: "ontem", daysAgo: "h\xE1 {n} dias" } }, "en-US": { loading: "Loading data...", offline: "No connection", noData: "No data available", error: "Error loading", retry: "Retry", refresh: "Refresh", pause: "Pause", play: "Play", settings: "Settings", close: "Close", newItems: "{count} new item(s)", lastUpdate: "Last update: {time}", categories: { breaking: "BREAKING", economia: "ECONOMY", politica: "POLITICS", tecnologia: "TECH", esportes: "SPORTS", saude: "HEALTH", geral: "GENERAL" }, accessibility: { tickerLabel: "News ticker", newNews: "New news available", pausedAnnounce: "Ticker paused", resumedAnnounce: "Ticker playing", navigationHint: "Use arrow keys to navigate between news" }, time: { justNow: "just now", minutesAgo: "{n} min ago", hoursAgo: "{n}h ago", yesterday: "yesterday", daysAgo: "{n} days ago" } }, "es-ES": { loading: "Cargando datos...", offline: "Sin conexi\xF3n", noData: "No hay datos disponibles", error: "Error al cargar", retry: "Reintentar", refresh: "Actualizar", pause: "Pausar", play: "Reproducir", settings: "Configuraci\xF3n", close: "Cerrar", newItems: "{count} noticia(s) nueva(s)", lastUpdate: "\xDAltima actualizaci\xF3n: {time}", categories: { breaking: "URGENTE", economia: "ECONOM\xCDA", politica: "POL\xCDTICA", tecnologia: "TECNOLOG\xCDA", esportes: "DEPORTES", saude: "SALUD", geral: "GENERAL" }, accessibility: { tickerLabel: "Ticker de noticias", newNews: "Nueva noticia disponible", pausedAnnounce: "Ticker pausado", resumedAnnounce: "Ticker en reproducci\xF3n", navigationHint: "Use las flechas para navegar entre noticias" }, time: { justNow: "ahora", minutesAgo: "hace {n} min", hoursAgo: "hace {n}h", yesterday: "ayer", daysAgo: "hace {n} d\xEDas" } } };
const DEFAULT_LOCALE = "pt-BR";
const SUPPORTED_LOCALES = Object.keys(TRANSLATIONS);
class I18nManager {
  constructor() {
    this._locale = DEFAULT_LOCALE;
    this._fallbackLocale = DEFAULT_LOCALE;
    this._subscribers = /* @__PURE__ */ new Set();
    this._customTranslations = {};
  }
  get locale() {
    return this._locale;
  }
  get supportedLocales() {
    return SUPPORTED_LOCALES;
  }
  setLocale(locale) {
    const normalized = this._normalizeLocale(locale);
    if (!SUPPORTED_LOCALES.includes(normalized)) {
      _log("warn", `Unsupported locale: ${locale}, using ${this._fallbackLocale}`);
      return false;
    }
    if (this._locale !== normalized) {
      const oldLocale = this._locale;
      this._locale = normalized;
      this._notifySubscribers({ oldLocale, newLocale: normalized });
      _log("info", `Locale changed: ${oldLocale} -> ${normalized}`);
    }
    return true;
  }
  _normalizeLocale(locale) {
    if (!locale) return DEFAULT_LOCALE;
    if (SUPPORTED_LOCALES.includes(locale)) return locale;
    const base = locale.split("-")[0].toLowerCase();
    const match = SUPPORTED_LOCALES.find((l) => l.toLowerCase().startsWith(base));
    return match || DEFAULT_LOCALE;
  }
  t(key, params = {}) {
    const keys = key.split(".");
    let value = this._customTranslations[this._locale];
    if (!value) value = TRANSLATIONS[this._locale];
    for (const k of keys) {
      value = value?.[k];
      if (value === void 0) break;
    }
    if (value === void 0) {
      let fallback = TRANSLATIONS[this._fallbackLocale];
      for (const k of keys) {
        fallback = fallback?.[k];
        if (fallback === void 0) break;
      }
      value = fallback ?? key;
    }
    if (typeof value === "string") {
      return value.replace(/\{(\w+)\}/g, (_, p) => String(params[p] ?? `{${p}}`));
    }
    return value;
  }
  addTranslations(locale, translations) {
    if (!this._customTranslations[locale]) {
      this._customTranslations[locale] = {};
    }
    Object.assign(this._customTranslations[locale], translations);
    _log("debug", `Added custom translations for ${locale}`);
  }
  // @ts-expect-error TS migration - TS2362, TS2363
  formatRelativeTime(date) {
    const now = /* @__PURE__ */ new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 6e4);
    const diffHours = Math.floor(diffMs / 36e5);
    const diffDays = Math.floor(diffMs / 864e5);
    if (diffMin < 1) return this.t("time.justNow");
    if (diffMin < 60) return this.t("time.minutesAgo", { n: diffMin });
    if (diffHours < 24) return this.t("time.hoursAgo", { n: diffHours });
    if (diffDays === 1) return this.t("time.yesterday");
    return this.t("time.daysAgo", { n: diffDays });
  }
  detectBrowserLocale() {
    if (typeof navigator === "undefined") return DEFAULT_LOCALE;
    const browserLocale = navigator.language || navigator.userLanguage;
    return this._normalizeLocale(browserLocale);
  }
  subscribe(callback) {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }
  _notifySubscribers(data) {
    this._subscribers.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
      }
    });
  }
  healthCheck() {
    const checks = { hasTranslations: Object.keys(TRANSLATIONS).length > 0, validLocale: SUPPORTED_LOCALES.includes(this._locale), portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/3`, locale: this._locale, supportedLocales: SUPPORTED_LOCALES, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, locale: this._locale, supportedLocales: SUPPORTED_LOCALES, hasCustomTranslations: Object.keys(this._customTranslations).length > 0, portsInitialized: Ports.isInitialized() };
  }
}
const i18n = new I18nManager();
const t = (key, params) => i18n.t(key, params);
const setLocale = (locale) => i18n.setLocale(locale);
const getLocale = () => i18n.locale;
function getVersion() {
  return VERSION;
}
var i18n_default = i18n;
export {
  MODULE_ID,
  VERSION,
  i18n_default as default,
  getLocale,
  getPorts,
  getVersion,
  i18n,
  injectPorts,
  setLocale,
  t
};
