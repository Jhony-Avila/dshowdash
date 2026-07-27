// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.ticker.core.features
// PURPOSE: Ticker Features Integrator - Enterprise feature aggregation
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract INJECT_PORTS - injectPorts() for dependency injection
// @contract GET_PORTS - getPorts() returns ports snapshot
// @contract GET_VERSION - getVersion() returns module version
// @contract TICKER_FEATURES - TickerFeatures class for feature management
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   CircuitBreaker from ./circuit-breaker.js
//   RequestCache from ./request-cache.js
//   DOMRecycler from ./dom-recycler.js
//   SkeletonLoader from ../ui/skeleton.js
//   LazyImageLoader from ../ui/lazy-images.js
//   NewsModal from ../ui/modal.js
//   NotificationBadge from ../ui/notification-badge.js
//   PullToRefresh from ../gestures/pull-refresh.js
//   SwipeNavigator from ../gestures/swipe-nav.js
//   ScrollSnap from ../gestures/scroll-snap.js
//   KeyboardNavigator from ../accessibility/keyboard-nav.js
//   FocusTrap from ../accessibility/focus-trap.js
//   ScreenReaderAnnouncer from ../accessibility/screen-reader.js
//   OfflineCacheManager from ../offline/cache-manager.js
//   FallbackSourceManager from ../api/fallback-sources.js
//   i18n, t from ../i18n/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ───────────────────────────────────────────────────────────────
// @changelog v1.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.2.1-LOG-VERBOSITY: Log verbosity adjustments
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { RequestCache } from './request-cache.js';
import { DOMRecycler } from './dom-recycler.js';
import { SkeletonLoader } from '../ui/skeleton.js';
import { LazyImageLoader } from '../ui/lazy-images.js';
import { NewsModal } from '../ui/modal.js';
import { NotificationBadge } from '../ui/notification-badge.js';
import { PullToRefresh } from '../gestures/pull-refresh.js';
import { SwipeNavigator } from '../gestures/swipe-nav.js';
import { ScrollSnap } from '../gestures/scroll-snap.js';
import { KeyboardNavigator } from '../accessibility/keyboard-nav.js';
import { FocusTrap } from '../accessibility/focus-trap.js';
import { ScreenReaderAnnouncer } from '../accessibility/screen-reader.js';
import { OfflineCacheManager } from '../offline/cache-manager.js';
import { FallbackSourceManager } from '../api/fallback-sources.js';
import { i18n, t } from '../i18n/index.js';
export const VERSION = '1.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'ticker.core.features';
const hasWindow = typeof window !== 'undefined';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args); };
export class TickerFeatures {
  [key: string]: any;
  constructor(ticker: Record<string, any>, options: Record<string, any> = {}) { this.ticker = ticker; this.options = options; this._features = {}; this._initialized = false; this._metrics = { featuresEnabled: 0, errors: 0 }; }
  // @ts-expect-error strict migration — TS2322
  async init(container: unknown, track: unknown) { if (this._initialized) return this; _log('debug', 'Initializing ticker features...'); try { this._features.circuitBreaker = new CircuitBreaker({ failureThreshold: this.options.circuitBreakerThreshold || 3, resetTimeout: this.options.circuitBreakerTimeout || 30000 }); this._features.requestCache = new RequestCache({ ttl: this.options.cacheTTL || 5000, maxSize: this.options.cacheMaxSize || 50 }); this._features.domRecycler = new DOMRecycler({ maxPoolSize: this.options.poolSize || 100 }); this._features.skeleton = new SkeletonLoader({ itemCount: this.options.skeletonItems || 5 }).init(track); this._features.lazyImages = new LazyImageLoader({ rootMargin: '100px' }).init(); this._features.modal = new NewsModal({ onClose: () => this.ticker?.resume?.(), onShare: (type: any, item: any) => _log('debug', `Shared via ${type}`, { title: item.title }) }).init(); this._features.badge = new NotificationBadge({ pulseOnUpdate: true }).init(container); this._features.pullRefresh = new PullToRefresh({ threshold: 60, onRefresh: () => this.ticker?.fetchNews?.() }).init(container); this._features.swipeNav = new SwipeNavigator({ onSwipeLeft: () => this._features.scrollSnap?.next?.(), onSwipeRight: () => this._features.scrollSnap?.previous?.() }).init(track); this._features.scrollSnap = new ScrollSnap({ alignment: 'start', itemSelector: '.ticker-item' }).init(track); this._features.keyboardNav = new KeyboardNavigator({ loop: true, onSelect: ({ item }: { item: unknown }) => this._onItemSelect(item as HTMLElement), onNavigate: ({ newIndex, item }: { newIndex: number; item: unknown }) => this._onNavigate(newIndex, item) }).init(track); this._features.focusTrap = new FocusTrap({ escapeDeactivates: true }).init(container); this._features.screenReader = new ScreenReaderAnnouncer({ politeness: 'polite' }).init(); this._features.offlineCache = new OfflineCacheManager({ maxItems: 100, maxAgeMs: 24 * 60 * 60 * 1000 }).init(); this._features.fallbackSources = new (FallbackSourceManager as any)(); const browserLocale = i18n.detectBrowserLocale(); i18n.setLocale(this.options.locale || browserLocale); this._metrics.featuresEnabled = Object.keys(this._features).length; this._initialized = true; _log('debug', `Features initialized: ${this._metrics.featuresEnabled} modules`); } catch (error) { this._metrics.errors++; _log('error', 'Failed to initialize features', { error: (error as Error).message }); } return this; }
  async fetchWithFeatures(fetchFn: (...args: unknown[]) => unknown) { const { circuitBreaker, requestCache, offlineCache, fallbackSources } = this._features; this._features.skeleton?.show(); try { const result = await circuitBreaker.execute(async () => await requestCache.dedupe('ticker-news', async () => { const response = await fallbackSources.fetch(); return response.data; })); await offlineCache.save(result as unknown[]); const newCount = this._features.badge?.update(result) || 0; if (newCount > 0) { this._features.screenReader?.announceNewItems(newCount); } return result; } catch (error) { _log('warn', 'Primary fetch failed, trying offline cache'); const cachedData = await offlineCache.load(); if (cachedData) { this._features.screenReader?.announceStatus('offline'); return cachedData; } throw error; } finally { this._features.skeleton?.hide(); } }
  _onItemSelect(item: unknown) { if (!item) return; const data = this._extractItemData(item as HTMLElement); if (data) { this._features.modal?.open(data); this._features.focusTrap?.activate(); } }
  _onNavigate(index: number, item: unknown) { const data = this._extractItemData(item as HTMLElement); if (data && this._features.screenReader) { const total = this._features.keyboardNav?.getItemCount?.() || 0; this._features.screenReader.announceNavigation(index, total, data.title); } }
  _extractItemData(element: HTMLElement | null) { if (!element) return null; const link = element.querySelector('a'); const title = link?.textContent || element.querySelector('.ticker-title')?.textContent; const url = link?.href || '#'; const source = (element.querySelector('.ticker-source-icon') as HTMLElement)?.title || ''; const category = element.className.match(/ticker-item--categoria-(\w+)/)?.[1] || 'geral'; return { title, url, source, category }; }
  showSkeleton() { this._features.skeleton?.show(); }
  hideSkeleton() { this._features.skeleton?.hide(); }
  openModal(item: unknown) { this._features.modal?.open(item); }
  closeModal() { this._features.modal?.close(); }
  updateBadge(items: unknown) { return this._features.badge?.update(items); }
  markAllSeen(items: unknown) { this._features.badge?.markAllSeen(items); }
  announceStatus(status: string) { this._features.screenReader?.announceStatus(status); }
  setLocale(locale: string) { i18n.setLocale(locale); }
  getLocale() { return i18n.locale; }
  translate(key: string, params?: Record<string, unknown>) { return t(key, params); }
  isOnline() { return this._features.offlineCache?.isOnline() ?? true; }
  get circuitBreaker() { return this._features.circuitBreaker; }
  get requestCache() { return this._features.requestCache; }
  get offlineCache() { return this._features.offlineCache; }
  get modal() { return this._features.modal; }
  get badge() { return this._features.badge; }
  get keyboardNav() { return this._features.keyboardNav; }
  get i18n() { return i18n; }
  pauseGestures() { this._features.pullRefresh?.disable(); this._features.swipeNav?.disable(); this._features.scrollSnap?.disable(); }
  resumeGestures() { this._features.pullRefresh?.enable(); this._features.swipeNav?.enable(); this._features.scrollSnap?.enable(); }
  refresh() { this._features.scrollSnap?.refresh(); this._features.keyboardNav?.refresh(); this._features.lazyImages?.observeAll(this.ticker?.element); }
  // @ts-expect-error strict migration — TS2345
  destroy() { Object.values(this._features).forEach((feature: { destroy?: () => void }) => { try { feature?.destroy?.(); } catch (e) {} }); this._features = {}; this._initialized = false; _log('debug', 'Features destroyed'); }
  healthCheck() { const featureChecks: Record<string, string> = {}; Object.entries(this._features).forEach(([name, feature]: [string, any]) => { try { const health = feature?.healthCheck?.(); featureChecks[name] = health?.status || 'UNKNOWN'; } catch (e) { featureChecks[name] = 'ERROR'; } }); const healthy = Object.values(featureChecks).filter(s => s === 'HEALTHY').length; const total = Object.keys(featureChecks).length; return { status: healthy === total ? 'HEALTHY' : healthy >= total * 0.7 ? 'DEGRADED' : 'UNHEALTHY', score: `${healthy}/${total}`, features: featureChecks, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, initialized: this._initialized, featuresEnabled: Object.keys(this._features).length, featureList: Object.keys(this._features), locale: i18n.locale, isOnline: this.isOnline(), metrics: { ...this._metrics }, portsInitialized: Ports.isInitialized() }; }
}
export function getVersion() { return VERSION; }
export default TickerFeatures;
