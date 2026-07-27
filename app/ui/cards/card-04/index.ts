// Migrado para TypeScript: 2026-02-25
// Card 04 - Pico do Dia
// @version 12.0.0-ENTERPRISE
// v12.0.0: healthCheck padronizado (HEALTHY/DEGRADED/UNHEALTHY), info() completo
'use strict';

import { API } from '/assets/js/core/api-client/index.js';


// ═══════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════

type CardStateValue = 'IDLE' | 'LOADING' | 'SUCCESS' | 'REFRESHING' | 'PAUSED' | 'ERROR';
type LogLevel = 'error' | 'warn' | 'info';

interface CardDomElements {
  hour: HTMLElement | null;
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
      details?: { peak_hour?: string; [key: string]: unknown };
      value?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  meta?: ApiResponseMeta;
  [key: string]: unknown;
}

interface SuccessData {
  peakHour: string;
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

interface CardReadyEvent {
  cardId: string;
  name: string;
  timestamp: number;
}

interface CardErrorEvent {
  cardId: string;
  error: string;
  timestamp: number;
}

interface CardFacade {
  mount: (container: HTMLElement) => CardPeakHour;
  unmount: (instance: CardPeakHour | null | undefined) => void;
  refresh: (instance: CardPeakHour | null | undefined) => Promise<void> | undefined;
  getStatus: (instance: CardPeakHour | null | undefined) => CardStatusResult;
  isReady: (instance: CardPeakHour | null | undefined) => boolean;
  info: (instance: CardPeakHour | null | undefined) => CardInfoResult;
  healthCheck: (instance: CardPeakHour | null | undefined) => HealthCheckResult;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTES E UTILITARIOS
// ═══════════════════════════════════════════════════════════════

export const VERSION = '12.0.0-ENTERPRISE' as const;
export const MODULE_ID = 'card-04' as const;
export const CARD_ID = 'card-04' as const;

const _debug = (): boolean => window.APP_CONFIG?.app?.debug ?? false;
const _log = (level: LogLevel, ...args: unknown[]): void => {
  if (level === 'error') { console.error('[Card-04]', ...args); return; }
  if (level === 'warn') { console.warn('[Card-04]', ...args); return; }
  if (_debug()) console.log('[Card-04]', ...args);
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
  async withLock<T>(operation: string, callback: () => Promise<T>): Promise<T | undefined> { if (this.locked) { _log('warn', `Operation ${operation} blocked`); return; } this.locked = true; try { return await callback(); } finally { this.locked = false; } }
  setState(newState: CardStateValue, data: SuccessData | ErrorData | null = null): void { const oldState: CardStateValue = this.state; this.state = newState; if (newState === 'SUCCESS') { this.data = data as SuccessData; this.error = null; } else if (newState === 'ERROR') this.error = data as ErrorData; _log('info', `State: ${oldState} → ${newState}`); }
  getState(): CardStateValue { return this.state; } is(state: CardStateValue): boolean { return this.state === state; } isLoading(): boolean { return this.state === 'LOADING'; } isSuccess(): boolean { return this.state === 'SUCCESS'; } isError(): boolean { return this.state === 'ERROR'; } isPaused(): boolean { return this.state === 'PAUSED'; }
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

export class CardPeakHour {
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
    this.container = container; this.cardId = container.id || 'card-04';
    this.state = new InternalState(this.cardId); this.errorHandler = new InternalErrorHandler();
    this.apiEndpoint = '/api/modules/cards/card-04/api.php';
    this.refreshInterval = 60000; this.intervalId = null; this.$ = null; this._mountedAt = null;
    this._onRefresh = (): Promise<void> => this.handleRefresh(); this._onVisibility = (): Promise<void> => this.handleVisibility();
    this.init();
  }

  async loadCSS(): Promise<void> { const linkId = 'card-04-styles'; if (document.getElementById(linkId)) return; return new Promise<void>((resolve: () => void, reject: (reason: Error) => void) => { const link: HTMLLinkElement = document.createElement('link'); link.id = linkId; link.rel = 'stylesheet'; link.href = '/components/cards/card-04/styles.css'; link.onload = (): void => resolve(); link.onerror = (): void => reject(new Error('Failed to load CSS')); document.head.appendChild(link); }); }

  async init(): Promise<void> {
    try {
      await this.loadCSS(); _log('info', 'Inicializando card'); this.render(); await this.loadData(); this.startAutoRefresh(); this.setupEventListeners(); this._mountedAt = Date.now();
      if (window.EventBus) window.EventBus.emit('card:ready', { cardId: 'card-04', name: 'Pico do Dia', timestamp: Date.now() } as CardReadyEvent);
      _log('info', 'Card inicializado com sucesso');
    } catch (error: unknown) { _log('error', 'Erro na inicializacao', { error: (error as Error).message }); if (window.EventBus) window.EventBus.emit('card:error', { cardId: 'card-04', error: (error as Error).message, timestamp: Date.now() } as CardErrorEvent); }
  }

  render(): void { this.container.classList.remove('is-loading'); this.container.removeAttribute('aria-busy'); this.container.innerHTML = `<div class="card-header"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><span>Pico do Dia</span></div><div class="card-body"><div class="card-value" data-el="hour">--</div><div class="card-label">Hora mais ativa</div></div><div class="card-status" data-el="status" role="status" aria-live="polite"></div>`; this.$ = { hour: this.container.querySelector('[data-el="hour"]'), status: this.container.querySelector('[data-el="status"]') }; }

  setStatus(msg: string): void { if (this.$ && this.$.status) this.$.status.textContent = msg || ''; }

  async loadData(): Promise<void> {
    return this.state.withLock('loadData', async (): Promise<void> => {
      try {
        const currentState: CardStateValue = this.state.getState();
        const isRefresh: boolean = currentState === 'SUCCESS' || currentState === 'REFRESHING';
        this.state.setState(isRefresh ? 'REFRESHING' : 'LOADING');
        this.container.classList.add('is-loading'); this.setStatus('Carregando...');
        const startTime: number = performance.now();
        // @ts-expect-error strict migration — TS2322
        const response: ApiResponse = await API.get(this.apiEndpoint, { timeout: 10000, retries: 2, headers: { 'Accept': 'application/json' } });
        _log('info', `API call completed in ${Math.round(performance.now() - startTime)}ms`, { traceId: response.meta?.traceId });
        if (!response.ok || !response.data) throw new Error('Resposta invalida da API');
        const data = response.data;
        if (!data.success || !data.data) throw new Error('Dados nao disponiveis');
        if (this.container.classList.contains('is-loading')) this.render();
        const hour: string = String(data.data.details?.peak_hour ?? data.data.value ?? "--");
        if (this.$ && this.$.hour) this.$.hour.textContent = hour;
        this.setStatus(''); this.container.classList.remove('is-loading', 'has-error');
        this.state.setState('SUCCESS', { peakHour: hour });
        _log('info', 'Dados atualizados', { peakHour: hour, traceId: response.meta?.traceId });
      } catch (error: unknown) {
        if ((error as { name?: string }).name === 'AbortError' || (error as { code?: string }).code === 'REQUEST_ABORTED') { _log('info', 'Request cancelado'); return; }
        _log('error', 'Erro ao carregar dados', { endpoint: this.apiEndpoint, error: (error as Error).message });
        if (this.container.classList.contains('is-loading')) this.render();
        this.errorHandler.showCardError(this.container, 'Erro ao carregar pico do dia');
        this.setStatus('Erro ao carregar'); this.container.classList.remove('is-loading'); this.container.classList.add('has-error');
        this.state.setState('ERROR', { error: (error as Error).message });
      }
    }) as Promise<void>;
  }

  async handleRefresh(): Promise<void> { if (!this.state.isPaused()) await this.loadData(); }
  async handleVisibility(): Promise<void> { if (document.hidden) this.state.setState('PAUSED'); else if (this.state.isPaused()) await this.loadData(); }
  setupEventListeners(): void { if (window.EventBus) { window.EventBus.on('cards:refresh-all', this._onRefresh); window.EventBus.on('card-04:refresh', this._onRefresh); } document.addEventListener('visibilitychange', this._onVisibility); }
  startAutoRefresh(): void { if (this.intervalId) clearInterval(this.intervalId); this.intervalId = setInterval((): void => { if (!this.state.isPaused() && !document.hidden) this.loadData(); }, this.refreshInterval); _log('info', 'Auto-refresh iniciado', { interval: this.refreshInterval }); }
  destroy(): void { _log('info', 'Destruindo card'); if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; } if (window.EventBus) { window.EventBus.off('cards:refresh-all', this._onRefresh); window.EventBus.off('card-04:refresh', this._onRefresh); } document.removeEventListener('visibilitychange', this._onVisibility); this.$ = null; this._mountedAt = null; _log('info', 'Card destruido'); }

  getStatus(): CardStatusResult { return { mounted: !!this.$, version: VERSION, moduleId: MODULE_ID, state: this.state.state }; }
  isReady(): boolean { return this.state.isSuccess(); }
  refresh(): Promise<void> { return this.loadData(); }

  info(): CardInfoResult { return { name: MODULE_ID, version: VERSION, cardId: CARD_ID, title: 'Pico do Dia', mounted: !!this.$, state: this.state.state, uptime: this._mountedAt ? Date.now() - this._mountedAt : 0, timestamp: Date.now() }; }

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

let _lastInstance: CardPeakHour | null = null;
export const Card: CardFacade = {
  mount: (container: HTMLElement): CardPeakHour => { _lastInstance = new CardPeakHour(container); return _lastInstance; },
  unmount: (instance: CardPeakHour | null | undefined): void => { instance?.destroy?.(); if (instance === _lastInstance) _lastInstance = null; },
  refresh: (instance: CardPeakHour | null | undefined): Promise<void> | undefined => instance?.loadData?.(),
  getStatus: (instance: CardPeakHour | null | undefined): CardStatusResult => instance?.getStatus?.() || { mounted: false },
  isReady: (instance: CardPeakHour | null | undefined): boolean => instance?.isReady?.() ?? false,
  info: (instance: CardPeakHour | null | undefined): CardInfoResult => instance?.info?.() || { name: MODULE_ID, version: VERSION, cardId: CARD_ID, mounted: false },
  healthCheck: (instance: CardPeakHour | null | undefined): HealthCheckResult => instance?.healthCheck?.() || { status: 'UNHEALTHY', mounted: false, version: VERSION, moduleId: MODULE_ID }
};

export const mountCard = (container: HTMLElement): CardPeakHour => Card.mount(container);
export const unmountCard = (instance: CardPeakHour | null | undefined): void => Card.unmount(instance);
export const refreshCard = (instance: CardPeakHour | null | undefined): Promise<void> | undefined => Card.refresh(instance);
export const getCardStatus = (instance: CardPeakHour | null | undefined): CardStatusResult => Card.getStatus(instance);
export function info(): CardInfoResult { return _lastInstance?.info?.() || { name: MODULE_ID, version: VERSION, cardId: CARD_ID, mounted: false }; }
export function healthCheck(): HealthCheckResult { return _lastInstance?.healthCheck?.() || { status: 'UNHEALTHY', mounted: false, version: VERSION, moduleId: MODULE_ID }; }

export async function init(selector: string = '#card-04-root'): Promise<CardPeakHour | null> { const container: HTMLElement | null = document.querySelector(selector); if (!container || (container as HTMLElement & { dataset: DOMStringMap }).dataset.initialized === 'true') return null; const instance: CardPeakHour = new CardPeakHour(container); (container as HTMLElement & { dataset: DOMStringMap }).dataset.initialized = 'true'; (container as HTMLElement & { __cardInstance?: CardPeakHour }).__cardInstance = instance; return instance; }

export default CardPeakHour;
