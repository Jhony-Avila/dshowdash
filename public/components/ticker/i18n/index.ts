// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker.i18n
// PURPOSE: i18n Manager - Ticker Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   i18n — exported value
//   t() — exported function
//   setLocale() — exported function
//   getLocale() — exported function
//   getVersion() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '1.3.0-P17WI';
export const MODULE_ID = 'ticker.i18n';
const hasWindow = typeof window !== 'undefined';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
function _log(level: string, ...args: unknown[]) { const logger = _getPort('logger'); if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args); }
const TRANSLATIONS = { 'pt-BR': { loading: 'Carregando dados...', offline: 'Sem conexão', noData: 'Nenhum dado disponível', error: 'Erro ao carregar', retry: 'Tentar novamente', refresh: 'Atualizar', pause: 'Pausar', play: 'Reproduzir', settings: 'Configurações', close: 'Fechar', newItems: '{count} nova(s) notícia(s)', lastUpdate: 'Última atualização: {time}', categories: { breaking: 'URGENTE', economia: 'ECONOMIA', politica: 'POLÍTICA', tecnologia: 'TECNOLOGIA', esportes: 'ESPORTES', saude: 'SAÚDE', geral: 'GERAL' }, accessibility: { tickerLabel: 'Ticker de notícias', newNews: 'Nova notícia disponível', pausedAnnounce: 'Ticker pausado', resumedAnnounce: 'Ticker em execução', navigationHint: 'Use as setas para navegar entre notícias' }, time: { justNow: 'agora', minutesAgo: 'há {n} min', hoursAgo: 'há {n}h', yesterday: 'ontem', daysAgo: 'há {n} dias' } }, 'en-US': { loading: 'Loading data...', offline: 'No connection', noData: 'No data available', error: 'Error loading', retry: 'Retry', refresh: 'Refresh', pause: 'Pause', play: 'Play', settings: 'Settings', close: 'Close', newItems: '{count} new item(s)', lastUpdate: 'Last update: {time}', categories: { breaking: 'BREAKING', economia: 'ECONOMY', politica: 'POLITICS', tecnologia: 'TECH', esportes: 'SPORTS', saude: 'HEALTH', geral: 'GENERAL' }, accessibility: { tickerLabel: 'News ticker', newNews: 'New news available', pausedAnnounce: 'Ticker paused', resumedAnnounce: 'Ticker playing', navigationHint: 'Use arrow keys to navigate between news' }, time: { justNow: 'just now', minutesAgo: '{n} min ago', hoursAgo: '{n}h ago', yesterday: 'yesterday', daysAgo: '{n} days ago' } }, 'es-ES': { loading: 'Cargando datos...', offline: 'Sin conexión', noData: 'No hay datos disponibles', error: 'Error al cargar', retry: 'Reintentar', refresh: 'Actualizar', pause: 'Pausar', play: 'Reproducir', settings: 'Configuración', close: 'Cerrar', newItems: '{count} noticia(s) nueva(s)', lastUpdate: 'Última actualización: {time}', categories: { breaking: 'URGENTE', economia: 'ECONOMÍA', politica: 'POLÍTICA', tecnologia: 'TECNOLOGÍA', esportes: 'DEPORTES', saude: 'SALUD', geral: 'GENERAL' }, accessibility: { tickerLabel: 'Ticker de noticias', newNews: 'Nueva noticia disponible', pausedAnnounce: 'Ticker pausado', resumedAnnounce: 'Ticker en reproducción', navigationHint: 'Use las flechas para navegar entre noticias' }, time: { justNow: 'ahora', minutesAgo: 'hace {n} min', hoursAgo: 'hace {n}h', yesterday: 'ayer', daysAgo: 'hace {n} días' } } };
const DEFAULT_LOCALE = 'pt-BR';
const SUPPORTED_LOCALES = Object.keys(TRANSLATIONS);
class I18nManager {
  [key: string]: any;
  constructor() { this._locale = DEFAULT_LOCALE; this._fallbackLocale = DEFAULT_LOCALE; this._subscribers = new Set(); this._customTranslations = {}; }
  get locale() { return this._locale; }
  get supportedLocales() { return SUPPORTED_LOCALES; }
  setLocale(locale: string) { const normalized = this._normalizeLocale(locale); if (!SUPPORTED_LOCALES.includes(normalized)) { _log('warn', `Unsupported locale: ${locale}, using ${this._fallbackLocale}`); return false; } if (this._locale !== normalized) { const oldLocale = this._locale; this._locale = normalized; this._notifySubscribers({ oldLocale, newLocale: normalized }); _log('info', `Locale changed: ${oldLocale} -> ${normalized}`); } return true; }
  _normalizeLocale(locale: string) { if (!locale) return DEFAULT_LOCALE; if (SUPPORTED_LOCALES.includes(locale)) return locale; const base = locale.split('-')[0].toLowerCase(); const match = SUPPORTED_LOCALES.find(l => l.toLowerCase().startsWith(base)); return match || DEFAULT_LOCALE; }
  t(key: string, params: Record<string, unknown> = {}) { const keys = key.split('.'); let value: any = (this._customTranslations as Record<string, unknown>)[this._locale]; if (!value) value = (TRANSLATIONS as Record<string, unknown>)[this._locale]; for (const k of keys) { value = value?.[k]; if (value === undefined) break; } if (value === undefined) { let fallback: any = (TRANSLATIONS as Record<string, unknown>)[this._fallbackLocale]; for (const k of keys) { fallback = fallback?.[k]; if (fallback === undefined) break; } value = fallback ?? key; } if (typeof value === 'string') { return value.replace(/\{(\w+)\}/g, (_: string, p: string) => String(params[p] ?? `{${p}}`)); } return value; }
  addTranslations(locale: string, translations: Record<string, unknown>) { if (!this._customTranslations[locale]) { this._customTranslations[locale] = {}; } Object.assign(this._customTranslations[locale], translations); _log('debug', `Added custom translations for ${locale}`); }

  // @ts-expect-error TS migration - TS2362, TS2363
  formatRelativeTime(date) { const now = new Date(); const then = new Date(date); const diffMs = now - then; const diffMin = Math.floor(diffMs / 60000); const diffHours = Math.floor(diffMs / 3600000); const diffDays = Math.floor(diffMs / 86400000); if (diffMin < 1) return this.t('time.justNow'); if (diffMin < 60) return this.t('time.minutesAgo', { n: diffMin }); if (diffHours < 24) return this.t('time.hoursAgo', { n: diffHours }); if (diffDays === 1) return this.t('time.yesterday'); return this.t('time.daysAgo', { n: diffDays }); }
  detectBrowserLocale() { if (typeof navigator === 'undefined') return DEFAULT_LOCALE; const browserLocale = navigator.language || (navigator as any).userLanguage; return this._normalizeLocale(browserLocale); }
  subscribe(callback: (...args: unknown[]) => void) { this._subscribers.add(callback); return () => this._subscribers.delete(callback); }
  _notifySubscribers(data: unknown) { this._subscribers.forEach((cb: (...args: unknown[]) => void) => { try { cb(data); } catch (e) {} }); }
  healthCheck() { const checks = { hasTranslations: Object.keys(TRANSLATIONS).length > 0, validLocale: SUPPORTED_LOCALES.includes(this._locale), portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/3`, locale: this._locale, supportedLocales: SUPPORTED_LOCALES, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, locale: this._locale, supportedLocales: SUPPORTED_LOCALES, hasCustomTranslations: Object.keys(this._customTranslations).length > 0, portsInitialized: Ports.isInitialized() }; }
}
export const i18n = new I18nManager();
export const t = (key: string, params?: Record<string, unknown>) => i18n.t(key, params);
export const setLocale = (locale: string) => i18n.setLocale(locale);
export const getLocale = () => i18n.locale;
export function getVersion() { return VERSION; }
export default i18n;
