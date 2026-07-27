// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cards.card-01
// PURPOSE: Taxa Diária - Success rate card with sparkline
// ───────────────────────────────────────────────────────────────
// @contract LIFECYCLE - constructor, init, destroy
// @contract DATA - loadData, render, auto-refresh
// @contract EVENTS - refresh, visibility handling
// @contract PORTS - Integration via createUiPorts
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   API from /assets/js/core/api-client/index.js
//   VERSION, MODULE_ID, etc from ./core/constants.js
//   createStore from ./state/store.js
//   renderSkeleton, renderCard, renderError from ./ui/renderer.js
//   formatNumber, formatPercent, etc from ./utils/formatters.js
//   createTracker from ./telemetry/tracker.js
// PROVIDES: CardSuccessRate class with init(), destroy(), loadData(),
//   healthCheck(), info(), injectPorts(), getPorts()
// @changelog v8.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v8.4.1-LOG-VERBOSITY: Plumbing logs info→debug
// @changelog v8.4.0-ENTERPRISE: ES6 modernization
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { API } from '/assets/js/core/api-client/index.js';
import { VERSION as CONSTANTS_VERSION, MODULE_ID as CONSTANTS_MODULE_ID, CARD_ID, CARD_NAME, CONFIG, STATES, EVENTS } from './core/constants.js';
import { createStore } from './state/store.js';
import { renderSkeleton, renderCard, renderError } from './ui/renderer.js';
import { formatNumber, formatPercent, parseApiData, parseSparklineData } from './utils/formatters.js';
import { createTracker } from './telemetry/tracker.js';

export const VERSION = '8.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.cards.card-01';

const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _debug = () => _getPort('config')?.app?.debug || false;
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; if (!_debug() && level === 'debug') return; const fn = logger[level] || logger.info; if (typeof fn === 'function') fn(`[${MODULE_ID}]`, ...args); };

export class CardSuccessRate {
  static VERSION = VERSION;
  static MODULE_ID = MODULE_ID;

  container!: HTMLElement;
  cardId!: string;
  state: ReturnType<typeof createStore>;
  tracker: ReturnType<typeof createTracker>;
  apiEndpoint!: string;
  refreshInterval!: number;
  intervalId!: ReturnType<typeof setInterval> | null;
  sparkline: any;
  isFirstRender!: boolean;
  // @ts-expect-error strict migration — TS2564
  $: Record<string, HTMLElement | null> | null;
  _onRefresh!: () => void;
  _onVisibility!: () => void;
  _metrics!: Record<string, number | null>;

  constructor(container: HTMLElement) {
    if (!container || !(container instanceof HTMLElement)) { _log('error', 'Container inválido'); return; }
    _initPorts();
    this.container = container;
    this.cardId = container.id || CARD_ID;
    this.state = createStore(this.cardId);
    this.tracker = createTracker(this.cardId);
    const cfg = _getPort('config');
    const baseUrl = cfg?.api?.cardsBaseUrl || '/api/modules/cards';
    this.apiEndpoint = `${baseUrl}/card-01/api.php`;
    this.refreshInterval = CONFIG.REFRESH_INTERVAL;
    this.intervalId = null;
    this.sparkline = null;
    this.isFirstRender = true;
    this.$ = null;
    this._onRefresh = () => this.handleRefresh();
    this._onVisibility = () => this.handleVisibility();
    this._metrics = { loadCount: 0, errorCount: 0, lastLoadAt: null, initAt: Date.now() };
    this.init();
  }

  loadCSS() {
    const linkId = 'card-01-styles';
    if (document.getElementById(linkId)) return Promise.resolve();
    return new Promise<void>((resolve, reject) => { const link = document.createElement('link'); link.id = linkId; link.rel = 'stylesheet'; link.href = '/components/cards/card-01/styles.css'; link.onload = () => resolve(); link.onerror = () => reject(new Error('Failed to load CSS')); document.head.appendChild(link); });
  }

  init() {
    this.tracker.init();
    // @ts-expect-error strict migration — TS2531
    return this.loadCSS().then(() => { _log('debug', 'Inicializando card'); if (this.isFirstRender) this.renderSkeletonView(); else this.render(); return this.loadData(); }).then(() => { this.startAutoRefresh(); this.setupEventListeners(); _log('debug', `${VERSION} inicializado com sucesso`); }).catch((error) => { _log('error', 'Erro na inicialização', { error: error.message }); this._metrics.errorCount++; this.tracker.trackError(error, 'init'); this.render(); this.setStatus('Erro na inicialização'); });
  }

  renderSkeletonView() { this.container.classList.add('is-loading'); this.container.setAttribute('aria-busy', 'true'); this.container.innerHTML = renderSkeleton(); }

  render() {
    const wasLoading = this.container.classList.contains('is-loading');
    this.container.classList.remove('is-loading');
    this.container.removeAttribute('aria-busy');
    this.container.innerHTML = renderCard();
    this.$ = { pct: this.container.querySelector('[data-el="percent"]'), ok: this.container.querySelector('[data-el="ok"]'), err: this.container.querySelector('[data-el="err"]'), status: this.container.querySelector('[data-el="status"]'), sparkline: this.container.querySelector('[data-el="sparkline"]') };
    if (wasLoading && this.isFirstRender) { this.container.classList.add('fade-in-up'); setTimeout(() => this.container.classList.remove('fade-in-up'), 400); this.isFirstRender = false; }
    if (this.$?.sparkline && typeof window !== 'undefined' && (window as any).Sparkline) { this.sparkline = new (window as any).Sparkline(this.$.sparkline, { width: 120, height: 30, color: '#22c55e', lineWidth: 2, showDots: true, dotRadius: 2, animate: true, gradient: true }); }
  }

  setStatus(msg: string) { if (this.$?.status) this.$.status.textContent = msg || ''; }

  loadData() {
    return this.state.withLock('loadData', () => {
      this.state.setState(STATES.LOADING);
      this.container.classList.add('is-loading');
      this.setStatus('Carregando...');
      // @ts-expect-error strict migration — TS2531
      this._metrics.loadCount++;
      const startTime = performance.now();
      return API.get(this.apiEndpoint, { timeout: CONFIG.API_TIMEOUT, retries: CONFIG.API_RETRIES, headers: { 'Accept': 'application/json' } }).then((response: Record<string, any>) => {
        const duration = Math.round(performance.now() - startTime);
        _log('debug', `API call completed in ${duration}ms`, { traceId: response.meta?.traceId });
        if (!response.ok || !response.data) throw new Error('Resposta inválida da API');
        const data = response.data;
        if (!(data.success === true || data.ok === true) || !data.data) throw new Error('Dados não disponíveis');
        if (this.container.classList.contains('is-loading')) this.render();
        const parsed = parseApiData(data);
        if (this.$) { if (this.$.pct) this.$.pct.textContent = formatPercent(parsed.successRate); if (this.$.ok) this.$.ok.textContent = formatNumber(parsed.successCount); if (this.$.err) this.$.err.textContent = formatNumber(parsed.errorCount); }
        if (data.history && this.sparkline) this.sparkline.setData(parseSparklineData(data.history)); else this.sparkline?.setData?.([]);
        this.setStatus('');
        this.container.classList.remove('is-loading', 'has-error');
        this._metrics.lastLoadAt = Date.now();
        this.state.setState(STATES.SUCCESS, { successRate: parsed.successRate, successCount: parsed.successCount, errorCount: parsed.errorCount });
        this.tracker.trackLoad(duration, true);
        _log('debug', 'Dados atualizados com sucesso', { successRate: parsed.successRate });
      }).catch((error) => {
        const duration = Math.round(performance.now() - startTime);
        _log('error', 'Erro ao carregar dados', { endpoint: this.apiEndpoint, error: error.message });
        // @ts-expect-error strict migration — TS2531
        this._metrics.errorCount++;
        this.tracker.trackLoad(duration, false);
        this.tracker.trackError(error, 'loadData');
        if (this.container.classList.contains('is-loading')) this.render();
        this.container.innerHTML = renderError('Erro ao carregar taxa de sucesso');
        this.setStatus('Erro ao carregar');
        this.container.classList.remove('is-loading');
        this.container.classList.add('has-error');
        this.state.setState(STATES.ERROR, { error: error.message });
      });
    });
  }

  handleRefresh() { if (!this.state.isPaused()) { this.tracker.trackRefresh('event', true); return this.loadData(); } }
  handleVisibility() { if (document.hidden) this.state.setState(STATES.PAUSED); else if (this.state.isPaused()) { this.tracker.trackRefresh('visibility', true); return this.loadData(); } }
  setupEventListeners() { const eb = _getPort('eventBus'); eb?.on?.(EVENTS.REFRESH, this._onRefresh); document.addEventListener('visibilitychange', this._onVisibility); }
  startAutoRefresh() { if (this.intervalId) clearInterval(this.intervalId); this.intervalId = setInterval(() => { if (!this.state.isPaused() && !document.hidden) { this.tracker.trackRefresh('interval', true); this.loadData(); } }, this.refreshInterval); _log('debug', 'Auto-refresh iniciado', { interval: this.refreshInterval }); }

  destroy() {
    _log('debug', 'Destruindo card');
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    const eb = _getPort('eventBus');
    eb?.off?.(EVENTS.REFRESH, this._onRefresh);
    document.removeEventListener('visibilitychange', this._onVisibility);
    this.tracker?.destroy?.();
    this.state?.reset?.();
    this.$ = null;
    _log('debug', 'Card destruído');
  }

  getVersion() { return VERSION; }

  healthCheck() {
    const portsSnapshot = Ports.snapshot();
    const checks = { containerExists: !!this.container, stateValid: !!this.state && !this.state.isError(), autoRefreshActive: !!this.intervalId, noErrors: this._metrics.errorCount === 0, dataLoaded: this.state.isSuccess(), trackerActive: !!this.tracker?.initialized, portsInitialized: portsSnapshot._initialized };
    const score = Object.values(checks).filter(Boolean).length;
    const maxScore = Object.keys(checks).length;
    return { status: score >= 5 ? 'HEALTHY' : score >= 3 ? 'DEGRADED' : 'UNHEALTHY', score, maxScore, scoreDisplay: `${score}/${maxScore}`, checks, state: this.state.state, portsInitialized: portsSnapshot._initialized, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  }

  info() {
    const portsSnapshot = Ports.snapshot();
    return { moduleId: MODULE_ID, version: VERSION, cardId: this.cardId, cardName: CARD_NAME, state: this.state.state, data: this.state.data, metrics: { ...this._metrics }, telemetryMetrics: this.tracker?.getMetrics?.() || null, autoRefreshActive: !!this.intervalId, refreshInterval: this.refreshInterval, portsInitialized: portsSnapshot._initialized, healthCheck: this.healthCheck(), timestamp: Date.now() };
  }
}

export function healthCheck() {
  return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { moduleReady: true }, timestamp: Date.now() };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, cardId: CARD_ID, cardName: CARD_NAME, timestamp: Date.now() };
}

export { CARD_ID, CARD_NAME };
export default CardSuccessRate;
