import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { CircuitBreaker } from "./circuit-breaker.js";
import { RequestCache } from "./request-cache.js";
import { DOMRecycler } from "./dom-recycler.js";
import { SkeletonLoader } from "../ui/skeleton.js";
import { LazyImageLoader } from "../ui/lazy-images.js";
import { NewsModal } from "../ui/modal.js";
import { NotificationBadge } from "../ui/notification-badge.js";
import { PullToRefresh } from "../gestures/pull-refresh.js";
import { SwipeNavigator } from "../gestures/swipe-nav.js";
import { ScrollSnap } from "../gestures/scroll-snap.js";
import { KeyboardNavigator } from "../accessibility/keyboard-nav.js";
import { FocusTrap } from "../accessibility/focus-trap.js";
import { ScreenReaderAnnouncer } from "../accessibility/screen-reader.js";
import { OfflineCacheManager } from "../offline/cache-manager.js";
import { FallbackSourceManager } from "../api/fallback-sources.js";
import { i18n, t } from "../i18n/index.js";
const VERSION = "1.3.0-P2-ENTERPRISE";
const MODULE_ID = "ticker.core.features";
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
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args);
};
class TickerFeatures {
  constructor(ticker, options = {}) {
    this.ticker = ticker;
    this.options = options;
    this._features = {};
    this._initialized = false;
    this._metrics = { featuresEnabled: 0, errors: 0 };
  }
  // @ts-expect-error strict migration — TS2322
  async init(container, track) {
    if (this._initialized) return this;
    _log("debug", "Initializing ticker features...");
    try {
      this._features.circuitBreaker = new CircuitBreaker({ failureThreshold: this.options.circuitBreakerThreshold || 3, resetTimeout: this.options.circuitBreakerTimeout || 3e4 });
      this._features.requestCache = new RequestCache({ ttl: this.options.cacheTTL || 5e3, maxSize: this.options.cacheMaxSize || 50 });
      this._features.domRecycler = new DOMRecycler({ maxPoolSize: this.options.poolSize || 100 });
      this._features.skeleton = new SkeletonLoader({ itemCount: this.options.skeletonItems || 5 }).init(track);
      this._features.lazyImages = new LazyImageLoader({ rootMargin: "100px" }).init();
      this._features.modal = new NewsModal({ onClose: () => this.ticker?.resume?.(), onShare: (type, item) => _log("debug", `Shared via ${type}`, { title: item.title }) }).init();
      this._features.badge = new NotificationBadge({ pulseOnUpdate: true }).init(container);
      this._features.pullRefresh = new PullToRefresh({ threshold: 60, onRefresh: () => this.ticker?.fetchNews?.() }).init(container);
      this._features.swipeNav = new SwipeNavigator({ onSwipeLeft: () => this._features.scrollSnap?.next?.(), onSwipeRight: () => this._features.scrollSnap?.previous?.() }).init(track);
      this._features.scrollSnap = new ScrollSnap({ alignment: "start", itemSelector: ".ticker-item" }).init(track);
      this._features.keyboardNav = new KeyboardNavigator({ loop: true, onSelect: ({ item }) => this._onItemSelect(item), onNavigate: ({ newIndex, item }) => this._onNavigate(newIndex, item) }).init(track);
      this._features.focusTrap = new FocusTrap({ escapeDeactivates: true }).init(container);
      this._features.screenReader = new ScreenReaderAnnouncer({ politeness: "polite" }).init();
      this._features.offlineCache = new OfflineCacheManager({ maxItems: 100, maxAgeMs: 24 * 60 * 60 * 1e3 }).init();
      this._features.fallbackSources = new FallbackSourceManager();
      const browserLocale = i18n.detectBrowserLocale();
      i18n.setLocale(this.options.locale || browserLocale);
      this._metrics.featuresEnabled = Object.keys(this._features).length;
      this._initialized = true;
      _log("debug", `Features initialized: ${this._metrics.featuresEnabled} modules`);
    } catch (error) {
      this._metrics.errors++;
      _log("error", "Failed to initialize features", { error: error.message });
    }
    return this;
  }
  async fetchWithFeatures(fetchFn) {
    const { circuitBreaker, requestCache, offlineCache, fallbackSources } = this._features;
    this._features.skeleton?.show();
    try {
      const result = await circuitBreaker.execute(async () => await requestCache.dedupe("ticker-news", async () => {
        const response = await fallbackSources.fetch();
        return response.data;
      }));
      await offlineCache.save(result);
      const newCount = this._features.badge?.update(result) || 0;
      if (newCount > 0) {
        this._features.screenReader?.announceNewItems(newCount);
      }
      return result;
    } catch (error) {
      _log("warn", "Primary fetch failed, trying offline cache");
      const cachedData = await offlineCache.load();
      if (cachedData) {
        this._features.screenReader?.announceStatus("offline");
        return cachedData;
      }
      throw error;
    } finally {
      this._features.skeleton?.hide();
    }
  }
  _onItemSelect(item) {
    if (!item) return;
    const data = this._extractItemData(item);
    if (data) {
      this._features.modal?.open(data);
      this._features.focusTrap?.activate();
    }
  }
  _onNavigate(index, item) {
    const data = this._extractItemData(item);
    if (data && this._features.screenReader) {
      const total = this._features.keyboardNav?.getItemCount?.() || 0;
      this._features.screenReader.announceNavigation(index, total, data.title);
    }
  }
  _extractItemData(element) {
    if (!element) return null;
    const link = element.querySelector("a");
    const title = link?.textContent || element.querySelector(".ticker-title")?.textContent;
    const url = link?.href || "#";
    const source = element.querySelector(".ticker-source-icon")?.title || "";
    const category = element.className.match(/ticker-item--categoria-(\w+)/)?.[1] || "geral";
    return { title, url, source, category };
  }
  showSkeleton() {
    this._features.skeleton?.show();
  }
  hideSkeleton() {
    this._features.skeleton?.hide();
  }
  openModal(item) {
    this._features.modal?.open(item);
  }
  closeModal() {
    this._features.modal?.close();
  }
  updateBadge(items) {
    return this._features.badge?.update(items);
  }
  markAllSeen(items) {
    this._features.badge?.markAllSeen(items);
  }
  announceStatus(status) {
    this._features.screenReader?.announceStatus(status);
  }
  setLocale(locale) {
    i18n.setLocale(locale);
  }
  getLocale() {
    return i18n.locale;
  }
  translate(key, params) {
    return t(key, params);
  }
  isOnline() {
    return this._features.offlineCache?.isOnline() ?? true;
  }
  get circuitBreaker() {
    return this._features.circuitBreaker;
  }
  get requestCache() {
    return this._features.requestCache;
  }
  get offlineCache() {
    return this._features.offlineCache;
  }
  get modal() {
    return this._features.modal;
  }
  get badge() {
    return this._features.badge;
  }
  get keyboardNav() {
    return this._features.keyboardNav;
  }
  get i18n() {
    return i18n;
  }
  pauseGestures() {
    this._features.pullRefresh?.disable();
    this._features.swipeNav?.disable();
    this._features.scrollSnap?.disable();
  }
  resumeGestures() {
    this._features.pullRefresh?.enable();
    this._features.swipeNav?.enable();
    this._features.scrollSnap?.enable();
  }
  refresh() {
    this._features.scrollSnap?.refresh();
    this._features.keyboardNav?.refresh();
    this._features.lazyImages?.observeAll(this.ticker?.element);
  }
  // @ts-expect-error strict migration — TS2345
  destroy() {
    Object.values(this._features).forEach((feature) => {
      try {
        feature?.destroy?.();
      } catch (e) {
      }
    });
    this._features = {};
    this._initialized = false;
    _log("debug", "Features destroyed");
  }
  healthCheck() {
    const featureChecks = {};
    Object.entries(this._features).forEach(([name, feature]) => {
      try {
        const health = feature?.healthCheck?.();
        featureChecks[name] = health?.status || "UNKNOWN";
      } catch (e) {
        featureChecks[name] = "ERROR";
      }
    });
    const healthy = Object.values(featureChecks).filter((s) => s === "HEALTHY").length;
    const total = Object.keys(featureChecks).length;
    return { status: healthy === total ? "HEALTHY" : healthy >= total * 0.7 ? "DEGRADED" : "UNHEALTHY", score: `${healthy}/${total}`, features: featureChecks, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, initialized: this._initialized, featuresEnabled: Object.keys(this._features).length, featureList: Object.keys(this._features), locale: i18n.locale, isOnline: this.isOnline(), metrics: { ...this._metrics }, portsInitialized: Ports.isInitialized() };
  }
}
function getVersion() {
  return VERSION;
}
var features_default = TickerFeatures;
export {
  MODULE_ID,
  TickerFeatures,
  VERSION,
  features_default as default,
  getPorts,
  getVersion,
  injectPorts
};
