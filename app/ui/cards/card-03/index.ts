// Migrado para TypeScript: 2026-02-25
// Card 03 - Performance Score
// @version 11.0.0-ENTERPRISE
// v11.0.0: healthCheck padronizado (HEALTHY/DEGRADED/UNHEALTHY), info() completo
'use strict';

import { API } from '/assets/js/core/api-client/index.js';


// ═══════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════

type CardStateValue = 'IDLE' | 'LOADING' | 'SUCCESS' | 'REFRESHING' | 'PAUSED' | 'ERROR';
type LogLevel = 'error' | 'warn' | 'info';

interface CardDomElements {
  score: HTMLElement | null;
  status: HTMLElement | null;
}

interface ApiResponseMeta {
  traceId?: string;
  [key: string]: unknown;
}

interface ApiResponse {
  ok: boolean;
  data?: {
    success?: boolean;
    data?: {
      score?: number | string;
      value?: number | string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  meta?: ApiResponseMeta;
  [key: string]: unknown;
}

interface SuccessData {
  score: number;
}

interface ErrorData {
  error: string;
}

interface CardStatusResult {
  mounted: boolean;
  version?: string;
  moduleId?: string;
  state?: CardStateValue;
}

interface CardInfoResult {
  name: string;
  version: string;
  cardId: string;
  title?: string;
  mounted: boolean;
  state?: CardStateValue;
  uptime?: number;
  timestamp?: number;
}

interface HealthCheckChecks {
  instanceExists: boolean;
  containerValid: boolean;
  domReady: boolean;
  stateValid: boolean;
  noErrors: boolean;
}

interface HealthCheckResult {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  score?: number;
  maxScore?: number;
  scoreDisplay?: string;
  checks?: HealthCheckChecks;
  issues?: string[] | null;
  mounted: boolean;
  version: string;
  moduleId: string;
  timestamp?: number;
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

// ═══════════════════════════════════════════════════════════════
// CONSTANTES E UTILITARIOS
// ═══════════════════════════════════════════════════════════════

export const VERSION = '11.0.0-ENTERPRISE' as const;
export const MODULE_ID = 'card-03' as const;
export const CARD_ID = 'card-03' as const;

const _debug = (): boolean => window.APP_CONFIG?.app?.debug ?? false;
const _log = (level: LogLevel, ...args: unknown[]): void => {
  if (level === 'error') { console.error('[Card-03]', ...args); return; }
  if (level === 'warn') { console.warn('[Card-03]', ...args); return; }
  if (_debug()) console.log('[Card-03]', ...args);
};

// ═══════════════════════════════════════════════════════════════
// INTERNAL STATE
// ═══════════════════════════════════════════════════════════════

class InternalState {
  cardId: string;
  state: CardStateValue;
  data: SuccessData | null;
  error: ErrorData | null;
  locked: boolean;

  constructor(cardId: string) { this.cardId = cardId; this.state = 'IDLE'; this.data = null; this.error = null; this.locked = false; }
  async withLock<T>(operation: string, callback: () => Promise<T>): Promise<T | undefined> { if (this.locked) { _log('warn', `Operation ${operation} blocked - already locked`); return; } this.locked = true; try { return await callback(); } finally { this.locked = false; } }
  setState(newState: CardStateValue, data: SuccessData | ErrorData | null = null): void { const oldState: CardStateValue = this.state; this.state = newState; if (newState === 'SUCCESS') { this.data = data as SuccessData; this.error = null; } else if (newState === 'ERROR') { this.error = data as ErrorData; } _log('info', `State: ${oldState} → ${newState}`); }
  is(state: CardStateValue): boolean { return this.state === state; } isLoading(): boolean { return this.state === 'LOADING'; } isSuccess(): boolean { return this.state === 'SUCCESS'; } isError(): boolean { return this.state === 'ERROR'; } isPaused(): boolean { return this.state === 'PAUSED'; }
}

// ═══════════════════════════════════════════════════════════════
// INTERNAL ERROR HANDLER
// ═══════════════════════════════════════════════════════════════

class InternalErrorHandler {
  showCardError(container: HTMLElement, message: string): void { container.innerHTML = `<div class="card-error-state"><svg viewBox="0 0 24 24" class="error-icon-small"><circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2"/><path d="M12 8v4m0 4h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span class="error-text">${message}</span></div>`; }
  showToast(message: string, type: LogLevel = 'error'): void { _log(type, message); }
}

// ═══════════════════════════════════════════════════════════════
// CARD CLASS
// ═══════════════════════════════════════════════════════════════

export class CardPerformanceScore {
  container!: HTMLElement;
  cardId!: string;
  state!: InternalState;
  errorHandler!: InternalErrorHandler;
  apiEndpoint!: string;
  refreshInterval!: number;
  intervalId!: ReturnType<typeof setInterval> | null;
  // @ts-expect-error strict migration — TS2564
  $: CardDomElements | null;
  _mountedAt!: number | null;
  _onRefresh!: () => Promise<void>;
  _onVisibility!: () => Promise<void>;

  constructor(container: HTMLElement) {
    if (!container || !(container instanceof HTMLElement)) { _log('error', 'Container invalido'); return; }
    this.container = container; this.cardId = container.id || 'card-03';
    this.state = new InternalState(this.cardId); this.errorHandler = new InternalErrorHandler();
    const baseUrl: string = ((window.APP_CONFIG?.api as Record<string, unknown> | undefined)?.cardsBaseUrl as string) || '/api/modules/cards';
    this.apiEndpoint = `${baseUrl}/card-03/api.php`;
    this.refreshInterval = 60000; this.intervalId = null; this.$ = null; this._mountedAt = null;
    this._onRefresh = (): Promise<void> => this.handleRefresh(); this._onVisibility = (): Promise<void> => this.handleVisibility();
    this.init();
  }

  async loadCSS(): Promise<void> { const linkId = 'card-03-styles'; if (document.getElementById(linkId)) return; return new Promise<void>((resolve: () => void, reject: (reason: Error) => void) => { const link: HTMLLinkElement = document.createElement('link'); link.id = linkId; link.rel = 'stylesheet'; link.href = '/components/cards/card-03/styles.css'; link.onload = (): void => resolve(); link.onerror = (): void => reject(new Error('Failed to load CSS')); document.head.appendChild(link); }); }

  async init(): Promise<void> { try { await this.loadCSS(); _log('info', 'Inicializando card'); this.render(); await this.loadData(); this.startAutoRefresh(); this.setupEventListeners(); this._mountedAt = Date.now(); _log('info', 'Card inicializado com sucesso'); } catch (error: unknown) { _log('error', 'Erro na inicializacao', { error: (error as Error).message }); } }

  render(): void { this.container.innerHTML = `<div class="card-header"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M12 20V10"></path><path d="M18 20V4"></path><path d="M6 20v-4"></path></svg><span>Performance</span></div><div class="card-body"><div class="card-value" data-el="score">--</div><div class="card-label">Score do dia</div></div><div class="card-status" data-el="status" role="status" aria-live="polite"></div>`; this.$ = { score: this.container.querySelector('[data-el="score"]'), status: this.container.querySelector('[data-el="status"]') }; }

  setStatus(msg: string): void { if (this.$?.status) this.$.status.textContent = msg || ''; }

  async loadData(): Promise<void> {
    return this.state.withLock('loadData', async (): Promise<void> => {
      if (!this.$) { _log('warn', 'Card nao renderizado, abortando loadData'); return; }
      try {
        this.state.setState('LOADING'); this.container.classList.add('is-loading'); this.setStatus('Carregando...');
        const startTime: number = performance.now();
        // @ts-expect-error strict migration — TS2322
        const response: ApiResponse = await API.get(this.apiEndpoint, { timeout: 10000, retries: 2, headers: { 'Accept': 'application/json' } });
        _log('info', `API call completed in ${Math.round(performance.now() - startTime)}ms`, { traceId: response.meta?.traceId });
        if (!this.$) { _log('warn', 'Card destruido durante loading'); return; }
        if (!response.ok || !response.data) throw new Error('Resposta invalida da API');
        const data = response.data;
        if (!data.success || !data.data) throw new Error('Dados nao disponiveis');
        const score: number = parseFloat(String(data.data.score ?? data.data.value ?? 0));
        if (this.$?.score) this.$.score.textContent = Number.isFinite(score) ? String(Math.round(score)) : '--';
        this.setStatus(''); this.container.classList.remove('is-loading', 'has-error');
        this.state.setState('SUCCESS', { score });
        _log('info', 'Dados atualizados', { score, traceId: response.meta?.traceId });
      } catch (error: unknown) {
        if ((error as { name?: string }).name === 'AbortError' || (error as { code?: string }).code === 'REQUEST_ABORTED') { _log('info', 'Request cancelado'); return; }
        _log('error', 'Erro ao carregar dados', { endpoint: this.apiEndpoint, error: (error as Error).message });
        if (this.container) { this.errorHandler.showCardError(this.container, 'Erro ao carregar performance score'); this.container.classList.remove('is-loading'); this.container.classList.add('has-error'); }
        this.setStatus('Erro ao carregar');
        this.state.setState('ERROR', { error: (error as Error).message });
      }
    }) as Promise<void>;
  }

  async handleRefresh(): Promise<void> { if (!this.state.isPaused()) await this.loadData(); }
  async handleVisibility(): Promise<void> { if (document.hidden) this.state.setState('PAUSED'); else if (this.state.isPaused()) await this.loadData(); }
  setupEventListeners(): void { if (window.EventBus) window.EventBus.on('card:refresh-all', this._onRefresh); document.addEventListener('visibilitychange', this._onVisibility); }
  startAutoRefresh(): void { if (this.intervalId) clearInterval(this.intervalId); this.intervalId = setInterval((): void => { if (!this.state.isPaused() && !document.hidden) this.loadData(); }, this.refreshInterval); _log('info', 'Auto-refresh iniciado', { interval: this.refreshInterval }); }
  destroy(): void { _log('info', 'Destruindo card'); if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; } if (window.EventBus) window.EventBus.off('card:refresh-all', this._onRefresh); document.removeEventListener('visibilitychange', this._onVisibility); this.$ = null; this._mountedAt = null; _log('info', 'Card destruido'); }

  getStatus(): CardStatusResult { return { mounted: !!this.$, version: VERSION, moduleId: MODULE_ID, state: this.state.state }; }
  isReady(): boolean { return this.state.isSuccess(); }
  refresh(): Promise<void> { return this.loadData(); }

  info(): CardInfoResult { return { name: MODULE_ID, version: VERSION, cardId: CARD_ID, title: 'Performance Score', mounted: !!this.$, state: this.state.state, uptime: this._mountedAt ? Date.now() - this._mountedAt : 0, timestamp: Date.now() }; }

  healthCheck(): HealthCheckResult {
    const checks: HealthCheckChecks = { instanceExists: true, containerValid: !!this.container, domReady: !!this.$, stateValid: (['IDLE', 'LOADING', 'SUCCESS', 'REFRESHING', 'PAUSED', 'ERROR'] as const).includes(this.state.state), noErrors: this.state.state !== 'ERROR' };
    const score: number = Object.values(checks).filter(Boolean).length;
    const maxScore: number = Object.keys(checks).length;
    const issues: string[] = Object.entries(checks).filter(([, v]: [string, boolean]) => !v).map(([k]: [string, boolean]) => k);
    return { status: score === maxScore ? 'HEALTHY' : score >= maxScore - 1 ? 'DEGRADED' : 'UNHEALTHY', score, maxScore, scoreDisplay: `${score}/${maxScore}`, checks, issues: issues.length > 0 ? issues : null, mounted: !!this.$, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  }
}

// ═══════════════════════════════════════════════════════════════
// CARD FACADE & EXPORTS
// ═══════════════════════════════════════════════════════════════

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

export default CardPerformanceScore;
