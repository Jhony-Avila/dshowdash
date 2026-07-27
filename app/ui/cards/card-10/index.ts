// Migrado para TypeScript: 2026-02-25
// Card 10 - Performance Score
// @version 12.0.0-ENTERPRISE
// v12.0.0: healthCheck padronizado (HEALTHY/DEGRADED/UNHEALTHY), info() completo
'use strict';

import { API } from '/assets/js/core/api-client/index.js';

// ── Tipos e Interfaces ──────────────────────────────────────────────

type CardState = 'IDLE' | 'LOADING' | 'SUCCESS' | 'REFRESHING' | 'PAUSED' | 'ERROR';
type LogLevel = 'info' | 'warn' | 'error';
type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';

interface CardDOMRefs {
  score: HTMLElement | null;
  status: HTMLElement | null;
}

interface CardStatusResult {
  mounted: boolean;
  version?: string;
  moduleId?: string;
  state?: CardState;
}

interface CardInfoResult {
  name: string;
  version: string;
  cardId: string;
  title?: string;
  mounted: boolean;
  state?: CardState;
  uptime?: number;
  timestamp?: number;
}

interface HealthCheckResult {
  status: HealthStatus;
  score?: number;
  maxScore?: number;
  scoreDisplay?: string;
  checks?: Record<string, boolean>;
  issues?: string[] | null;
  mounted: boolean;
  version: string;
  moduleId: string;
  timestamp?: number;
}

interface StateData {
  performanceScore?: number;
}

interface ErrorData {
  error?: string;
  endpoint?: string;
}

interface APIResponse {
  ok: boolean;
  data: {
    success: boolean;
    data: {
      value?: string | number;
    } | null;
  } | null;
  meta?: { traceId?: string; timestamp?: number; [key: string]: unknown };
}

interface APIRequestOptions {
  timeout: number;
  retries: number;
  headers: Record<string, string>;
}

interface CardEventPayload {
  cardId: string;
  name?: string;
  error?: string;
  timestamp: number;
}

interface CardFacade {
  mount: (container: HTMLElement) => CardPerformanceScore;
  unmount: (instance: CardPerformanceScore | null | undefined) => void;
  refresh: (instance: CardPerformanceScore | null | undefined) => Promise<void> | undefined;
  getStatus: (instance: CardPerformanceScore | null | undefined) => CardStatusResult;
  isReady: (instance: CardPerformanceScore | null | undefined) => boolean;
  info: (instance: CardPerformanceScore | null | undefined) => CardInfoResult;
  healthCheck: (instance: CardPerformanceScore | null | undefined) => HealthCheckResult;
}

interface HTMLElementWithCardInstance extends HTMLElement {
  __cardInstance?: CardPerformanceScore;
}

// ── Constantes ──────────────────────────────────────────────────────

export const VERSION: string = '12.0.0-ENTERPRISE';
export const MODULE_ID: string = 'card-10';
export const CARD_ID: string = 'card-10';

// ── Helpers ─────────────────────────────────────────────────────────

const _debug = (): boolean => window.APP_CONFIG?.app?.debug ?? false;
const _log = (level: LogLevel, ...args: unknown[]): void => {
  if (level === 'error') { console.error('[Card-10]', ...args); return; }
  if (level === 'warn') { console.warn('[Card-10]', ...args); return; }
  if (_debug()) console.log('[Card-10]', ...args);
};

// ── InternalState ───────────────────────────────────────────────────

class InternalState {
  cardId: string;
  state: CardState;
  data: StateData | null;
  error: ErrorData | null;
  locked: boolean;

  constructor(cardId: string) { this.cardId = cardId; this.state = 'IDLE'; this.data = null; this.error = null; this.locked = false; }
  async withLock<T>(operation: string, callback: () => Promise<T>): Promise<T | undefined> { if (this.locked) { _log('warn', `Operation ${operation} blocked - already locked`); return; } this.locked = true; try { return await callback(); } finally { this.locked = false; } }
  setState(newState: CardState, data: StateData | ErrorData | null = null): void { const oldState: CardState = this.state; this.state = newState; if (newState === 'SUCCESS') { this.data = data as StateData; this.error = null; } else if (newState === 'ERROR') { this.error = data as ErrorData; } _log('info', `State: ${oldState} → ${newState}`); }
  getState(): CardState { return this.state; } is(state: CardState): boolean { return this.state === state; } isLoading(): boolean { return this.state === 'LOADING'; } isSuccess(): boolean { return this.state === 'SUCCESS'; } isError(): boolean { return this.state === 'ERROR'; } isPaused(): boolean { return this.state === 'PAUSED'; }
}

// ── InternalErrorHandler ────────────────────────────────────────────

class InternalErrorHandler {
  cardId: string;
  constructor(cardId: string) { this.cardId = cardId; }
  showCardError(container: HTMLElement, message: string): void { container.innerHTML = `<div class="card-error-state"><svg viewBox="0 0 24 24" class="error-icon-small"><circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2"/><path d="M12 8v4m0 4h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span class="error-text">${message}</span></div>`; }
  showToast(message: string, type: LogLevel = 'error', _duration: number = 5000): void { _log(type, message); }
  logError(context: string, error: unknown, data: Record<string, unknown> = {}): void { _log('error', `Error in ${context}:`, error, data); }
}

// ── CardPerformanceScore ────────────────────────────────────────────

export class CardPerformanceScore {
  container!: HTMLElement;
  cardId!: string;
  state!: InternalState;
  errorHandler!: InternalErrorHandler;
  apiEndpoint!: string;
  refreshInterval!: number;
  intervalId!: ReturnType<typeof setInterval> | null;
  $!: CardDOMRefs | null;
  _mountedAt!: number | null;
  _onRefresh!: () => void;
  _onVisibility!: () => void;

  constructor(container: HTMLElement) {
    if (!container || !(container instanceof HTMLElement)) { _log('error', 'Container invalido'); return; }
    this.container = container; this.cardId = container.id || 'card-10';
    this.state = new InternalState(this.cardId); this.errorHandler = new InternalErrorHandler(this.cardId);
    this.apiEndpoint = '/api/modules/cards/card-10/api.php';
    this.refreshInterval = 60000; this.intervalId = null; this.$ = null; this._mountedAt = null;
    this._onRefresh = (): void => { this.handleRefresh(); }; this._onVisibility = (): void => { this.handleVisibility(); };
    this.init();
  }

  async loadCSS(): Promise<void> { const cssPath: string = '/components/cards/card-10/styles.css'; const linkId: string = 'card-10-styles'; if (document.getElementById(linkId)) return; return new Promise<void>((resolve: () => void, reject: (reason: Error) => void) => { const link: HTMLLinkElement = document.createElement('link'); link.id = linkId; link.rel = 'stylesheet'; link.href = cssPath; link.onload = (): void => resolve(); link.onerror = (): void => reject(new Error('Failed to load CSS')); document.head.appendChild(link); }); }

  async init(): Promise<void> {
    try {
      await this.loadCSS(); _log('info', 'Inicializando card'); this.render(); await this.loadData(); this.startAutoRefresh(); this.setupEventListeners(); this._mountedAt = Date.now();
      if (window.EventBus) window.EventBus.emit('card:ready', { cardId: 'card-10', name: 'Performance Score', timestamp: Date.now() });
      _log('info', 'Card inicializado com sucesso');
    } catch (error) { _log('error', 'Erro na inicializacao', { error: (error as Error).message }); if (window.EventBus) window.EventBus.emit('card:error', { cardId: 'card-10', error: (error as Error).message, timestamp: Date.now() }); }
  }

  render(): void { this.container.classList.remove('is-loading'); this.container.removeAttribute('aria-busy'); this.container.innerHTML = `<div class="card-header"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg><span>Performance</span></div><div class="card-body"><div class="card-value" data-el="score">--</div><div class="card-label">Score geral</div></div><div class="card-status" data-el="status" role="status" aria-live="polite"></div>`; this.$ = { score: this.container.querySelector('[data-el="score"]'), status: this.container.querySelector('[data-el="status"]') }; }

  setStatus(msg: string): void { if (this.$ && this.$.status) this.$.status.textContent = msg || ''; }

  async loadData(): Promise<void> {
    return this.state.withLock('loadData', async (): Promise<void> => {
      try {
        const currentState: CardState = this.state.getState(); const isRefresh: boolean = currentState === 'SUCCESS' || currentState === 'REFRESHING';
        this.state.setState(isRefresh ? 'REFRESHING' : 'LOADING');
        this.container.classList.add('is-loading'); this.setStatus('Carregando...');
        const startTime: number = performance.now();
        const response: APIResponse = await API.get(this.apiEndpoint, { timeout: 10000, retries: 2, headers: { 'Accept': 'application/json' } } as APIRequestOptions);
        const duration: number = performance.now() - startTime;
        _log('info', `API call completed in ${Math.round(duration)}ms`, { traceId: response.meta?.traceId });
        if (!response.ok || !response.data) throw new Error('Resposta invalida da API');
        const data = response.data;
        if (!data.success || !data.data) throw new Error('Dados nao disponiveis');
        if (this.container.classList.contains('is-loading')) this.render();
        const scorePercent: number = parseFloat(String(data.data.value ?? 0));
        if (this.$ && this.$.score) this.$.score.textContent = Number.isFinite(scorePercent) ? `${scorePercent.toFixed(1)}%` : '--';
        this.setStatus(''); this.container.classList.remove('is-loading', 'has-error');
        this.state.setState('SUCCESS', { performanceScore: scorePercent });
        _log('info', 'Dados atualizados', { performanceScore: scorePercent, traceId: response.meta?.traceId });
      } catch (error) {
        const err = error as Error & { code?: string };
        if (err.name === 'AbortError' || err.code === 'REQUEST_ABORTED') { _log('info', 'Request cancelado'); return; }
        _log('error', 'Erro ao carregar dados', { endpoint: this.apiEndpoint, error: err.message, code: err.code });
        if (this.container.classList.contains('is-loading')) this.render();
        this.errorHandler.showCardError(this.container, 'Erro ao carregar performance score');
        this.errorHandler.showToast(`Card 10: ${err.message}`, 'error', 5000);
        this.setStatus('Erro ao carregar'); this.container.classList.remove('is-loading'); this.container.classList.add('has-error');
        this.state.setState('ERROR', { error: err.message, endpoint: this.apiEndpoint });
      }
    }) as Promise<void>;
  }

  async handleRefresh(): Promise<void> { if (!this.state.isPaused()) await this.loadData(); }
  async handleVisibility(): Promise<void> { if (document.hidden) this.state.setState('PAUSED'); else if (this.state.isPaused()) await this.loadData(); }
  setupEventListeners(): void { if (window.EventBus) { window.EventBus.on('cards:refresh-all', this._onRefresh); window.EventBus.on('card-10:refresh', this._onRefresh); } document.addEventListener('visibilitychange', this._onVisibility); }
  startAutoRefresh(): void { if (this.intervalId) clearInterval(this.intervalId); this.intervalId = setInterval((): void => { if (!this.state.isPaused() && !document.hidden) this.loadData(); }, this.refreshInterval); _log('info', 'Auto-refresh iniciado', { interval: this.refreshInterval }); }
  destroy(): void { _log('info', 'Destruindo card'); if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; } if (window.EventBus) { window.EventBus.off('cards:refresh-all', this._onRefresh); window.EventBus.off('card-10:refresh', this._onRefresh); } document.removeEventListener('visibilitychange', this._onVisibility); this.$ = null; this._mountedAt = null; _log('info', 'Card destruido'); }

  getStatus(): CardStatusResult { return { mounted: !!this.$, version: VERSION, moduleId: MODULE_ID, state: this.state.state }; }
  isReady(): boolean { return this.state.isSuccess(); }
  refresh(): Promise<void> { return this.loadData(); }

  info(): CardInfoResult { return { name: MODULE_ID, version: VERSION, cardId: CARD_ID, title: 'Performance Score', mounted: !!this.$, state: this.state.state, uptime: this._mountedAt ? Date.now() - this._mountedAt : 0, timestamp: Date.now() }; }

  healthCheck(): HealthCheckResult {
    const checks: Record<string, boolean> = { instanceExists: true, containerValid: !!this.container, domReady: !!this.$, stateValid: (['IDLE', 'LOADING', 'SUCCESS', 'REFRESHING', 'PAUSED', 'ERROR'] as CardState[]).includes(this.state.state), noErrors: this.state.state !== 'ERROR' };
    const score: number = Object.values(checks).filter(Boolean).length; const maxScore: number = Object.keys(checks).length;
    const issues: string[] = Object.entries(checks).filter(([, v]: [string, boolean]) => !v).map(([k]: [string, boolean]) => k);
    return { status: score === maxScore ? 'HEALTHY' : score >= maxScore - 1 ? 'DEGRADED' : 'UNHEALTHY', score, maxScore, scoreDisplay: `${score}/${maxScore}`, checks, issues: issues.length > 0 ? issues : null, mounted: !!this.$, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  }
}

// ── Facade & Exports ────────────────────────────────────────────────

let _lastInstance: CardPerformanceScore | null = null;
export const Card: CardFacade = {
  mount: (container: HTMLElement): CardPerformanceScore => { _lastInstance = new CardPerformanceScore(container); return _lastInstance; },
  unmount: (instance: CardPerformanceScore | null | undefined): void => { instance?.destroy?.(); if (instance === _lastInstance) _lastInstance = null; },
  refresh: (instance: CardPerformanceScore | null | undefined): Promise<void> | undefined => instance?.loadData?.(),
  getStatus: (instance: CardPerformanceScore | null | undefined): CardStatusResult => instance?.getStatus?.() || { mounted: false },
  isReady: (instance: CardPerformanceScore | null | undefined): boolean => instance?.isReady?.() ?? false,
  info: (instance: CardPerformanceScore | null | undefined): CardInfoResult => instance?.info?.() || { name: MODULE_ID, version: VERSION, cardId: CARD_ID, mounted: false },
  healthCheck: (instance: CardPerformanceScore | null | undefined): HealthCheckResult => instance?.healthCheck?.() || { status: 'UNHEALTHY', mounted: false, version: VERSION, moduleId: MODULE_ID }
};

export const mountCard = (container: HTMLElement): CardPerformanceScore => Card.mount(container);
export const unmountCard = (instance: CardPerformanceScore | null | undefined): void => Card.unmount(instance);
export const refreshCard = (instance: CardPerformanceScore | null | undefined): Promise<void> | undefined => Card.refresh(instance);
export const getCardStatus = (instance: CardPerformanceScore | null | undefined): CardStatusResult => Card.getStatus(instance);
export function info(): CardInfoResult { return _lastInstance?.info?.() || { name: MODULE_ID, version: VERSION, cardId: CARD_ID, mounted: false }; }
export function healthCheck(): HealthCheckResult { return _lastInstance?.healthCheck?.() || { status: 'UNHEALTHY', mounted: false, version: VERSION, moduleId: MODULE_ID }; }

export async function init(selector: string = '#card-10-root'): Promise<CardPerformanceScore | null> { const container = document.querySelector(selector) as HTMLElementWithCardInstance | null; if (!container || container.dataset.initialized === 'true') return null; const instance: CardPerformanceScore = new CardPerformanceScore(container); container.dataset.initialized = 'true'; container.__cardInstance = instance; return instance; }

export default CardPerformanceScore;
