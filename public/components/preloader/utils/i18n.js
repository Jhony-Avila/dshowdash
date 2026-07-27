import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "preloader-i18n";
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
function _log(level, msg, ctx) {
  const logger = _getPort("logger");
  if (!logger) return;
  ctx = ctx || {};
  ctx.component = MODULE_ID;
  if (typeof logger[level] === "function") {
    logger[level](msg, ctx);
  }
}
const TRANSLATIONS = {
  "en": { loading: "Loading...", loadingApp: "Loading application...", authenticating: "Authenticating...", loadingComponents: "Loading components...", almostReady: "Almost ready...", ready: "Ready!", error: "An error occurred", retry: "Retry", slowConnection: "Connection is slow, please wait...", degradedMode: "Running in degraded mode", offlineMode: "You are offline", reconnecting: "Reconnecting...", sessionExpired: "Session expired", accessDenied: "Access denied", timeout: "Request timed out", networkError: "Network error", serverError: "Server error", maintenance: "System under maintenance", pleaseWait: "Please wait...", progress: "{percent}% complete", step: "Step {current} of {total}", retrying: "Retrying... ({attempt}/{max})", loadingResource: "Loading {resource}...", initializingModule: "Initializing {module}..." },
  "pt-BR": { loading: "Carregando...", loadingApp: "Carregando aplica\xE7\xE3o...", authenticating: "Autenticando...", loadingComponents: "Carregando componentes...", almostReady: "Quase pronto...", ready: "Pronto!", error: "Ocorreu um erro", retry: "Tentar novamente", slowConnection: "Conex\xE3o lenta, por favor aguarde...", degradedMode: "Executando em modo degradado", offlineMode: "Voc\xEA est\xE1 offline", reconnecting: "Reconectando...", sessionExpired: "Sess\xE3o expirada", accessDenied: "Acesso negado", timeout: "Tempo limite excedido", networkError: "Erro de rede", serverError: "Erro no servidor", maintenance: "Sistema em manuten\xE7\xE3o", pleaseWait: "Por favor, aguarde...", progress: "{percent}% conclu\xEDdo", step: "Etapa {current} de {total}", retrying: "Tentando novamente... ({attempt}/{max})", loadingResource: "Carregando {resource}...", initializingModule: "Inicializando {module}..." },
  "es": { loading: "Cargando...", loadingApp: "Cargando aplicaci\xF3n...", authenticating: "Autenticando...", loadingComponents: "Cargando componentes...", almostReady: "Casi listo...", ready: "\xA1Listo!", error: "Ocurri\xF3 un error", retry: "Reintentar", slowConnection: "Conexi\xF3n lenta, por favor espere...", degradedMode: "Ejecutando en modo degradado", offlineMode: "Est\xE1s sin conexi\xF3n", reconnecting: "Reconectando...", sessionExpired: "Sesi\xF3n expirada", accessDenied: "Acceso denegado", timeout: "Tiempo de espera agotado", networkError: "Error de red", serverError: "Error del servidor", maintenance: "Sistema en mantenimiento", pleaseWait: "Por favor, espere...", progress: "{percent}% completado", step: "Paso {current} de {total}", retrying: "Reintentando... ({attempt}/{max})", loadingResource: "Cargando {resource}...", initializingModule: "Inicializando {module}..." },
  "fr": { loading: "Chargement...", loadingApp: "Chargement de l'application...", authenticating: "Authentification...", loadingComponents: "Chargement des composants...", almostReady: "Presque pr\xEAt...", ready: "Pr\xEAt !", error: "Une erreur s'est produite", retry: "R\xE9essayer", slowConnection: "Connexion lente, veuillez patienter...", degradedMode: "Fonctionnement en mode d\xE9grad\xE9", offlineMode: "Vous \xEAtes hors ligne", reconnecting: "Reconnexion...", sessionExpired: "Session expir\xE9e", accessDenied: "Acc\xE8s refus\xE9", timeout: "D\xE9lai d'attente d\xE9pass\xE9", networkError: "Erreur r\xE9seau", serverError: "Erreur serveur", maintenance: "Syst\xE8me en maintenance", pleaseWait: "Veuillez patienter...", progress: "{percent}% termin\xE9", step: "\xC9tape {current} sur {total}", retrying: "Nouvelle tentative... ({attempt}/{max})", loadingResource: "Chargement de {resource}...", initializingModule: "Initialisation de {module}..." },
  "de": { loading: "Laden...", loadingApp: "Anwendung wird geladen...", authenticating: "Authentifizierung...", loadingComponents: "Komponenten werden geladen...", almostReady: "Fast fertig...", ready: "Bereit!", error: "Ein Fehler ist aufgetreten", retry: "Erneut versuchen", slowConnection: "Langsame Verbindung, bitte warten...", degradedMode: "Eingeschr\xE4nkter Modus aktiv", offlineMode: "Sie sind offline", reconnecting: "Verbindung wird wiederhergestellt...", sessionExpired: "Sitzung abgelaufen", accessDenied: "Zugriff verweigert", timeout: "Zeit\xFCberschreitung", networkError: "Netzwerkfehler", serverError: "Serverfehler", maintenance: "System wird gewartet", pleaseWait: "Bitte warten...", progress: "{percent}% abgeschlossen", step: "Schritt {current} von {total}", retrying: "Erneuter Versuch... ({attempt}/{max})", loadingResource: "{resource} wird geladen...", initializingModule: "{module} wird initialisiert..." }
};
let _currentLocale = "en";
let _fallbackLocale = "en";
const _customTranslations = /* @__PURE__ */ new Map();
const _subscribers = /* @__PURE__ */ new Set();
function setLocale(locale) {
  _initPorts();
  const normalizedLocale = _normalizeLocale(locale);
  if (!TRANSLATIONS[normalizedLocale] && !_customTranslations.has(normalizedLocale)) {
    _log("warn", "Locale not found, using fallback", { locale: normalizedLocale, fallback: _fallbackLocale });
    _currentLocale = _fallbackLocale;
  } else {
    _currentLocale = normalizedLocale;
  }
  _notifySubscribers();
  _log("info", "Locale set", { locale: _currentLocale });
  return _currentLocale;
}
function getLocale() {
  return _currentLocale;
}
function setFallbackLocale(locale) {
  _fallbackLocale = _normalizeLocale(locale);
}
function getAvailableLocales() {
  return Object.keys(TRANSLATIONS).concat(Array.from(_customTranslations.keys()));
}
function t(key, params) {
  if (!params) params = {};
  let translation = _getTranslation(key, _currentLocale);
  if (!translation && _currentLocale !== _fallbackLocale) {
    translation = _getTranslation(key, _fallbackLocale);
  }
  if (!translation) {
    _log("warn", "Translation not found", { key, locale: _currentLocale });
    return key;
  }
  return _interpolate(translation, params);
}
function translate(key, params) {
  return t(key, params);
}
function _getTranslation(key, locale) {
  const customLocale = _customTranslations.get(locale);
  if (customLocale && customLocale[key]) return customLocale[key];
  return TRANSLATIONS[locale] ? TRANSLATIONS[locale][key] : null;
}
function _interpolate(template, params) {
  return template.replace(/\{(\w+)\}/g, (match, key) => params[key] !== void 0 ? String(params[key]) : match);
}
function _normalizeLocale(locale) {
  if (!locale) return "en";
  locale = locale.replace("_", "-");
  if (TRANSLATIONS[locale] || _customTranslations.has(locale)) {
    return locale;
  }
  const lang = locale.split("-")[0].toLowerCase();
  if (TRANSLATIONS[lang] || _customTranslations.has(lang)) {
    return lang;
  }
  return locale.toLowerCase();
}
function registerLocale(locale, translations) {
  const normalized = _normalizeLocale(locale);
  const existing = _customTranslations.get(normalized) || {};
  _customTranslations.set(normalized, Object.assign({}, existing, translations));
  _log("info", "Locale registered", { locale: normalized, keys: Object.keys(translations).length });
}
function extendLocale(locale, translations) {
  registerLocale(locale, translations);
}
function detectLocale() {
  if (typeof navigator === "undefined") return "en";
  const browserLocale = navigator.language || (navigator.languages ? navigator.languages[0] : null) || "en";
  return _normalizeLocale(browserLocale);
}
function useDetectedLocale() {
  const detected = detectLocale();
  return setLocale(detected);
}
function subscribe(callback) {
  _subscribers.add(callback);
  return () => {
    _subscribers.delete(callback);
  };
}
function _notifySubscribers() {
  _subscribers.forEach((callback) => {
    try {
      callback(_currentLocale);
    } catch (e) {
    }
  });
}
function getStatus() {
  return { version: VERSION, moduleId: MODULE_ID, currentLocale: _currentLocale, fallbackLocale: _fallbackLocale, builtInLocales: Object.keys(TRANSLATIONS).length, customLocales: _customTranslations.size, subscribers: _subscribers.size, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  const checks = { translationsLoaded: Object.keys(TRANSLATIONS).length > 0, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: `${passed}/2`, moduleId: MODULE_ID, version: VERSION, checks, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, locales: getAvailableLocales(), features: ["5-built-in-locales", "interpolation", "auto-detect", "custom-locales", "subscribers"], portsInitialized: Ports.isInitialized() };
}
var i18n_default = { VERSION, MODULE_ID, TRANSLATIONS, setLocale, getLocale, setFallbackLocale, getAvailableLocales, t, translate, registerLocale, extendLocale, detectLocale, useDetectedLocale, subscribe, getStatus, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  TRANSLATIONS,
  VERSION,
  i18n_default as default,
  detectLocale,
  extendLocale,
  getAvailableLocales,
  getLocale,
  getPorts,
  getStatus,
  healthCheck,
  info,
  injectPorts,
  registerLocale,
  setFallbackLocale,
  setLocale,
  subscribe,
  t,
  translate,
  useDetectedLocale
};
