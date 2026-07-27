// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader-i18n
// PURPOSE: utils   i18n
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   TRANSLATIONS — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   setLocale() — exported function
//   getLocale() — exported function
//   setFallbackLocale() — exported function
//   getAvailableLocales() — exported function
//   t() — exported function
//   translate() — exported function
//   registerLocale() — exported function
//   extendLocale() — exported function
//   detectLocale() — exported function
//   useDetectedLocale() — exported function
//   subscribe() — exported function
//   getStatus() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
// Preloader i18n
// @version 1.2.0-P17WI-ES6
// P17WI: PortsFactory/PortsProfiles migration

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.2.0-P17WI';
export const MODULE_ID = 'preloader-i18n';

const hasWindow = typeof window !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _log(level: string, msg: string, ctx?: Record<string, unknown>) {
  const logger = _getPort('logger');
  if (!logger) return;
  ctx = ctx || {};
  ctx.component = MODULE_ID;
  if (typeof logger[level] === 'function') {
    logger[level](msg, ctx);
  }
}

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  'en': { loading: 'Loading...', loadingApp: 'Loading application...', authenticating: 'Authenticating...', loadingComponents: 'Loading components...', almostReady: 'Almost ready...', ready: 'Ready!', error: 'An error occurred', retry: 'Retry', slowConnection: 'Connection is slow, please wait...', degradedMode: 'Running in degraded mode', offlineMode: 'You are offline', reconnecting: 'Reconnecting...', sessionExpired: 'Session expired', accessDenied: 'Access denied', timeout: 'Request timed out', networkError: 'Network error', serverError: 'Server error', maintenance: 'System under maintenance', pleaseWait: 'Please wait...', progress: '{percent}% complete', step: 'Step {current} of {total}', retrying: 'Retrying... ({attempt}/{max})', loadingResource: 'Loading {resource}...', initializingModule: 'Initializing {module}...' },
  'pt-BR': { loading: 'Carregando...', loadingApp: 'Carregando aplicação...', authenticating: 'Autenticando...', loadingComponents: 'Carregando componentes...', almostReady: 'Quase pronto...', ready: 'Pronto!', error: 'Ocorreu um erro', retry: 'Tentar novamente', slowConnection: 'Conexão lenta, por favor aguarde...', degradedMode: 'Executando em modo degradado', offlineMode: 'Você está offline', reconnecting: 'Reconectando...', sessionExpired: 'Sessão expirada', accessDenied: 'Acesso negado', timeout: 'Tempo limite excedido', networkError: 'Erro de rede', serverError: 'Erro no servidor', maintenance: 'Sistema em manutenção', pleaseWait: 'Por favor, aguarde...', progress: '{percent}% concluído', step: 'Etapa {current} de {total}', retrying: 'Tentando novamente... ({attempt}/{max})', loadingResource: 'Carregando {resource}...', initializingModule: 'Inicializando {module}...' },
  'es': { loading: 'Cargando...', loadingApp: 'Cargando aplicación...', authenticating: 'Autenticando...', loadingComponents: 'Cargando componentes...', almostReady: 'Casi listo...', ready: '¡Listo!', error: 'Ocurrió un error', retry: 'Reintentar', slowConnection: 'Conexión lenta, por favor espere...', degradedMode: 'Ejecutando en modo degradado', offlineMode: 'Estás sin conexión', reconnecting: 'Reconectando...', sessionExpired: 'Sesión expirada', accessDenied: 'Acceso denegado', timeout: 'Tiempo de espera agotado', networkError: 'Error de red', serverError: 'Error del servidor', maintenance: 'Sistema en mantenimiento', pleaseWait: 'Por favor, espere...', progress: '{percent}% completado', step: 'Paso {current} de {total}', retrying: 'Reintentando... ({attempt}/{max})', loadingResource: 'Cargando {resource}...', initializingModule: 'Inicializando {module}...' },
  'fr': { loading: 'Chargement...', loadingApp: 'Chargement de l\'application...', authenticating: 'Authentification...', loadingComponents: 'Chargement des composants...', almostReady: 'Presque prêt...', ready: 'Prêt !', error: 'Une erreur s\'est produite', retry: 'Réessayer', slowConnection: 'Connexion lente, veuillez patienter...', degradedMode: 'Fonctionnement en mode dégradé', offlineMode: 'Vous êtes hors ligne', reconnecting: 'Reconnexion...', sessionExpired: 'Session expirée', accessDenied: 'Accès refusé', timeout: 'Délai d\'attente dépassé', networkError: 'Erreur réseau', serverError: 'Erreur serveur', maintenance: 'Système en maintenance', pleaseWait: 'Veuillez patienter...', progress: '{percent}% terminé', step: 'Étape {current} sur {total}', retrying: 'Nouvelle tentative... ({attempt}/{max})', loadingResource: 'Chargement de {resource}...', initializingModule: 'Initialisation de {module}...' },
  'de': { loading: 'Laden...', loadingApp: 'Anwendung wird geladen...', authenticating: 'Authentifizierung...', loadingComponents: 'Komponenten werden geladen...', almostReady: 'Fast fertig...', ready: 'Bereit!', error: 'Ein Fehler ist aufgetreten', retry: 'Erneut versuchen', slowConnection: 'Langsame Verbindung, bitte warten...', degradedMode: 'Eingeschränkter Modus aktiv', offlineMode: 'Sie sind offline', reconnecting: 'Verbindung wird wiederhergestellt...', sessionExpired: 'Sitzung abgelaufen', accessDenied: 'Zugriff verweigert', timeout: 'Zeitüberschreitung', networkError: 'Netzwerkfehler', serverError: 'Serverfehler', maintenance: 'System wird gewartet', pleaseWait: 'Bitte warten...', progress: '{percent}% abgeschlossen', step: 'Schritt {current} von {total}', retrying: 'Erneuter Versuch... ({attempt}/{max})', loadingResource: '{resource} wird geladen...', initializingModule: '{module} wird initialisiert...' }
};

let _currentLocale = 'en';
let _fallbackLocale = 'en';
const _customTranslations = new Map();
const _subscribers = new Set();

export function setLocale(locale: string) {
  _initPorts();
  const normalizedLocale = _normalizeLocale(locale);
  if (!TRANSLATIONS[normalizedLocale] && !_customTranslations.has(normalizedLocale)) {
    _log('warn', 'Locale not found, using fallback', { locale: normalizedLocale, fallback: _fallbackLocale });
    _currentLocale = _fallbackLocale;
  } else {
    _currentLocale = normalizedLocale;
  }
  _notifySubscribers();
  _log('info', 'Locale set', { locale: _currentLocale });
  return _currentLocale;
}

export function getLocale() { return _currentLocale; }
export function setFallbackLocale(locale: string) { _fallbackLocale = _normalizeLocale(locale); }
export function getAvailableLocales() { return Object.keys(TRANSLATIONS).concat(Array.from(_customTranslations.keys())); }

export function t(key: string, params?: Record<string, unknown>) {
  if (!params) params = {};
  let translation = _getTranslation(key, _currentLocale);
  if (!translation && _currentLocale !== _fallbackLocale) {
    translation = _getTranslation(key, _fallbackLocale);
  }
  if (!translation) {
    _log('warn', 'Translation not found', { key, locale: _currentLocale });
    return key;
  }
  return _interpolate(translation, params);
}

export function translate(key: string, params?: Record<string, unknown>) { return t(key, params); }

function _getTranslation(key: string, locale: string) {
  const customLocale = _customTranslations.get(locale);
  if (customLocale && customLocale[key]) return customLocale[key];
  return TRANSLATIONS[locale] ? TRANSLATIONS[locale][key] : null;
}

function _interpolate(template: string, params: Record<string, unknown>) {
  return template.replace(/\{(\w+)\}/g, (match: string, key: string) => (params as Record<string, unknown>)[key] !== undefined ? String((params as Record<string, unknown>)[key]) : match);
}

function _normalizeLocale(locale: string) {
  if (!locale) return 'en';
  locale = locale.replace('_', '-');
  if (TRANSLATIONS[locale] || _customTranslations.has(locale)) {
    return locale;
  }
  const lang = locale.split('-')[0].toLowerCase();
  if (TRANSLATIONS[lang] || _customTranslations.has(lang)) {
    return lang;
  }
  return locale.toLowerCase();
}

export function registerLocale(locale: string, translations: Record<string, string>) {
  const normalized = _normalizeLocale(locale);
  const existing = _customTranslations.get(normalized) || {};
  _customTranslations.set(normalized, Object.assign({}, existing, translations));
  _log('info', 'Locale registered', { locale: normalized, keys: Object.keys(translations).length });
}

export function extendLocale(locale: string, translations: Record<string, string>) { registerLocale(locale, translations); }

export function detectLocale() {
  if (typeof navigator === 'undefined') return 'en';
  const browserLocale = navigator.language || (navigator.languages ? navigator.languages[0] : null) || 'en';
  return _normalizeLocale(browserLocale);
}

export function useDetectedLocale() {
  const detected = detectLocale();
  return setLocale(detected);
}

export function subscribe(callback: (locale: string) => void) {
  _subscribers.add(callback);
  return () => { _subscribers.delete(callback); };
}

function _notifySubscribers() {
  // @ts-expect-error strict migration — TS2345
  _subscribers.forEach((callback: (locale: string) => void) => {
    try { callback(_currentLocale); } catch (e) {}
  });
}

export function getStatus() {
  return { version: VERSION, moduleId: MODULE_ID, currentLocale: _currentLocale, fallbackLocale: _fallbackLocale, builtInLocales: Object.keys(TRANSLATIONS).length, customLocales: _customTranslations.size, subscribers: _subscribers.size, portsInitialized: Ports.isInitialized() };
}

export function healthCheck() {
  const checks = { translationsLoaded: Object.keys(TRANSLATIONS).length > 0, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, moduleId: MODULE_ID, version: VERSION, checks, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}

export function info() {
  return { version: VERSION, moduleId: MODULE_ID, locales: getAvailableLocales(), features: ['5-built-in-locales', 'interpolation', 'auto-detect', 'custom-locales', 'subscribers'], portsInitialized: Ports.isInitialized() };
}

export default { VERSION, MODULE_ID, TRANSLATIONS, setLocale, getLocale, setFallbackLocale, getAvailableLocales, t, translate, registerLocale, extendLocale, detectLocale, useDetectedLocale, subscribe, getStatus, healthCheck, info, injectPorts, getPorts };
