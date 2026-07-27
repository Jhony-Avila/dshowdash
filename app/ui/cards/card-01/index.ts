// Migrado para TypeScript: 2026-02-25
// Card 01 - Taxa Diaria
// @version 11.0.0-ENTERPRISE
// v11.0.0: healthCheck padronizado (HEALTHY/DEGRADED/UNHEALTHY), info() completo
'use strict';

import { API } from '/assets/js/core/api-client/index.js';

// ═══════════════════════════════════════════════════════════════
// TIPOS LOCAIS PARA SPARKLINE
// ═══════════════════════════════════════════════════════════════

interface SparklineOptions {
  width?: number;
  height?: number;
  color?: string;
  lineWidth?: number;
  showDots?: boolean;
  dotRadius?: number;
  animate?: boolean;
  gradient?: boolean;
}

interface SparklineInstance {
  setData(data: number[]): void;
  [key: string]: unknown;
}

// ═══════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════

type CardStateValue = 'IDLE' | 'LOADING' | 'SUCCESS' | 'REFRESHING' | 'PAUSED' | 'ERROR';
type LogLevel = 'error' | 'warn' | 'info';

interface CardDomElements {
  pct: HTMLElement | null;
  ok: HTMLElement | null;
  err: HTMLElement | null;
  status: HTMLElement | null;
  sparkline: HTMLElement | null;
}

interface ApiResponseMeta {
  traceId?: string;
  [key: string]: unknown;
}

interface ApiResponse {
  ok: boolean;
  data?: {
    success?: boolean;
    ok?: boolean;
    data?: {
      success_rate?: number | string;
      successRate?: number | string;
      sucesso?: number | string;
      success?: number | string;
      erro?: number | string;
      error?: number | string;
      errors?: number | string;
      [key: string]: unknown;
    };
    history?: Array<{ rate?: number | string; [key: string]: unknown }>;
    [key: string]: unknown;
  };
  meta?: ApiResponseMeta;
  [key: string]: unknown;
}

interface SuccessData {
  successRate: number;
  successCount: number;
  errorCount: number;
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
  mount: (container: HTMLElement) => CardSuccessRate;
  unmount: (instance: CardSuccessRate | null | undefined) => void;
  refresh: (instance: CardSuccessRate | null | undefined) => Promise<void> | undefined;
  getStatus: (instance: CardSuccessRate | null | undefined) => CardStatusResult;
  isReady: (instance: CardSuccessRate | null | undefined) => boolean;
  info: (instance: CardSuccessRate | null | undefined) => CardInfoResult;
  healthCheck: (instance: CardSuccessRate | null | undefined) => HealthCheckResult;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTES E UTILITARIOS
// ═══════════════════════════════════════════════════════════════

export const VERSION = '11.0.0-ENTERPRISE' as const;
export const MODULE_ID = 'card-01' as const;
export const CARD_ID = 'card-01' as const;

const _debug = (): boolean => window.APP_CONFIG?.app?.debug ?? false;
const _log = (level: LogLevel, ...args: unknown[]): void => {
  if (level === 'error') { console.error('[Card-01]', ...args); return; }
  if (level === 'warn') { console.warn('[Card-01]', ...args); return; }
  if (_debug()) console.log('[Card-01]', ...args);
};
const numberFormatter: Intl.NumberFormat = new Intl.NumberFormat('pt-BR');

// ═══════════════════════════════════════════════════════════════
// INTERNAL STATE
// ═══════════════════════════════════════════════════════════════

class InternalState {
  cardId: string;
  state: CardStateValue;
  data: SuccessData | null;
  error: ErrorData | null;
  locked: boolean;

  constructor(cardId: string) {
    this.cardId = cardId; this.state = 'IDLE'; this.data = null; this.error = null; this.locked = false;
  }
  async withLock<T>(operation: string, callback: () => Promise<T>): Promise<T | undefined> {
    if (this.locked) { _log('warn', `Operation ${operation} blocked - already locked`); return; }
    this.locked = true;
    try { return await callback(); } finally { this.locked = false; }
  }
  setState(newState: CardStateValue, data: SuccessData | ErrorData | null = null): void {
    const oldState: CardStateValue = this.state; this.state = newState;
    if (newState === 'SUCCESS') { this.data = data as SuccessData; this.error = null; } else if (newState === 'ERROR') { this.error = data as ErrorData; }
    _log('info', `State: ${oldState} → ${newState}`);
  }
  is(state: CardStateValue): boolean { return this.state === state; }
  isLoading(): boolean { return this.state === 'LOADING'; }
  isSuccess(): boolean { return this.state === 'SUCCESS'; }
  isError(): boolean { return this.state === 'ERROR'; }
  isPaused(): boolean { return this.state === 'PAUSED'; }
}

// ═══════════════════════════════════════════════════════════════
// INTERNAL ERROR HANDLER
// ═══════════════════════════════════════════════════════════════

class InternalErrorHandler {
  showCardError(container: HTMLElement, message: string): void {
    container.innerHTML = `<div class="card-error-state"><svg viewBox="0 0 24 24" class="error-icon-small"><circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2"/><path d="M12 8v4m0 4h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span class="error-text">${message}</span></div>`;
  }
  showToast(message: string, type: LogLevel = 'error'): void { _log(type, message); }
}

// ═══════════════════════════════════════════════════════════════
// CARD CLASS
// ═══════════════════════════════════════════════════════════════

export class CardSuccessRate {
  container!: HTMLElement;
  cardId!: string;
  state!: InternalState;
  errorHandler!: InternalErrorHandler;
  apiEndpoint!: string;
  refreshInterval!: number;
  intervalId!: ReturnType<typeof setInterval> | null;
  sparkline!: SparklineInstance | null;
  isFirstRender!: boolean;
  // @ts-expect-error strict migration — TS2564
  $: CardDomElements | null;
  _mountedAt!: number | null;
  _onRefresh!: () => Promise<void>;
  _onVisibility!: () => Promise<void>;

  constructor(container: HTMLElement) {
    if (!container || !(container instanceof HTMLElement)) { _log('error', 'Container invalido'); return; }
    this.container = container;
    this.cardId = container.id || 'card-01';
    this.state = new InternalState(this.cardId);
    this.errorHandler = new InternalErrorHandler();
    const baseUrl: string = ((window.APP_CONFIG?.api as Record<string, unknown> | undefined)?.cardsBaseUrl as string) || '/api/modules/cards';
    this.apiEndpoint = `${baseUrl}/card-01/api.php`;
    this.refreshInterval = 60000;
    this.intervalId = null;
    this.sparkline = null;
    this.isFirstRender = true;
    this.$ = null;
    this._mountedAt = null;
    this._onRefresh = (): Promise<void> => this.handleRefresh();
    this._onVisibility = (): Promise<void> => this.handleVisibility();
    this.init();
  }

  async loadCSS(): Promise<void> {
    const linkId = 'card-01-styles';
    if (document.getElementById(linkId)) return;
    return new Promise<void>((resolve: () => void, reject: (reason: Error) => void) => {
      const link: HTMLLinkElement = document.createElement('link');
      link.id = linkId; link.rel = 'stylesheet'; link.href = '/components/cards/card-01/styles.css';
      link.onload = (): void => resolve(); link.onerror = (): void => reject(new Error('Failed to load CSS'));
      document.head.appendChild(link);
    });
  }

  async init(): Promise<void> {
    try {
      await this.loadCSS();
      _log('info', 'Inicializando card');
      if (this.isFirstRender) this.renderSkeleton(); else this.render();
      await this.loadData();
      this.startAutoRefresh();
      this.setupEventListeners();
      this._mountedAt = Date.now();
      _log('info', 'Card inicializado com sucesso');
    } catch (error: unknown) {
      _log('error', 'Erro na inicializacao', { error: (error as Error).message });
      this.render();
      this.setStatus('Erro na inicializacao');
    }
  }

  renderSkeleton(): void {
    this.container.classList.add('is-loading');
    this.container.setAttribute('aria-busy', 'true');
    this.container.innerHTML = `<div class="card-header skeleton-header"><div class="skeleton skeleton-header-icon"></div><div class="skeleton skeleton-header-text"></div></div><div class="card-body"><div class="skeleton skeleton-value"></div><div class="skeleton skeleton-label"></div><div class="skeleton skeleton-sparkline"></div></div><div class="card-meta"><div class="skeleton skeleton-meta-item"></div><div class="skeleton skeleton-meta-item"></div></div><span class="sr-only">Carregando taxa diaria...</span>`;
  }

  render(): void {
    const wasLoading: boolean = this.container.classList.contains('is-loading');
    this.container.classList.remove('is-loading');
    this.container.removeAttribute('aria-busy');
    this.container.innerHTML = `<div class="card-header"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="20 6 9 17 4 12"></polyline></svg><span>Taxa Diaria</span></div><div class="card-body"><div class="card-value" data-el="percent">--</div><div class="card-label">Performance de hoje</div><div class="sparkline-container" data-el="sparkline"></div></div><div class="card-meta"><span>Sucesso: <strong data-el="ok">--</strong></span><span>Erros: <strong data-el="err">--</strong></span></div><div class="card-status" data-el="status" role="status" aria-live="polite"></div>`;
    this.$ = { pct: this.container.querySelector('[data-el="percent"]'), ok: this.container.querySelector('[data-el="ok"]'), err: this.container.querySelector('[data-el="err"]'), status: this.container.querySelector('[data-el="status"]'), sparkline: this.container.querySelector('[data-el="sparkline"]') };
    if (wasLoading && this.isFirstRender) { this.container.classList.add('fade-in-up'); setTimeout(() => this.container.classList.remove('fade-in-up'), 400); this.isFirstRender = false; }
    if (this.$.sparkline && window.Sparkline) this.sparkline = new window.Sparkline(this.$.sparkline, [], { width: 120, height: 30, color: '#22c55e', lineWidth: 2, showDots: true, dotRadius: 2, animate: true, gradient: true }) as SparklineInstance;
  }

  setStatus(msg: string): void { if (this.$ && this.$.status) this.$.status.textContent = msg || ''; }

  async loadData(): Promise<void> {
    return this.state.withLock('loadData', async (): Promise<void> => {
      try {
        this.state.setState('LOADING');
        this.container.classList.add('is-loading');
        this.setStatus('Carregando...');
        const startTime: number = performance.now();
        // @ts-expect-error strict migration — TS2322
        const response: ApiResponse = await API.get(this.apiEndpoint, { timeout: 10000, retries: 2, headers: { 'Accept': 'application/json' } });
        _log('info', `API call completed in ${Math.round(performance.now() - startTime)}ms`, { traceId: response.meta?.traceId });
        if (!response.ok || !response.data) throw new Error('Resposta invalida da API');
        const data = response.data;
        if (!(data.success === true || data.ok === true) || !data.data) throw new Error('Dados nao disponiveis');
        if (this.container.classList.contains('is-loading')) this.render();
        const apiData = data.data || {};
        const pctNum: number = Number(apiData.success_rate ?? apiData.successRate);
        const succNum: number = Number(apiData.sucesso ?? apiData.success);
        const errNum: number = Number(apiData.erro ?? apiData.error ?? apiData.errors);
        if (this.$) {
          if (this.$.pct) this.$.pct.textContent = Number.isFinite(pctNum) ? `${Math.round(pctNum)}%` : '--';
          if (this.$.ok) this.$.ok.textContent = Number.isFinite(succNum) ? numberFormatter.format(succNum) : '--';
          if (this.$.err) this.$.err.textContent = Number.isFinite(errNum) ? numberFormatter.format(errNum) : '--';
        }
        if (data.history && Array.isArray(data.history) && data.history.length > 0 && this.sparkline) {
          const sparklineData: number[] = data.history.map((h: { rate?: number | string; [key: string]: unknown }) => Math.max(0, Math.min(100, Number(h?.rate ?? 0))));
          this.sparkline.setData(sparklineData);
        } else if (this.sparkline) this.sparkline.setData([]);
        this.setStatus('');
        this.container.classList.remove('is-loading', 'has-error');
        this.state.setState('SUCCESS', { successRate: pctNum, successCount: succNum, errorCount: errNum });
        _log('info', 'Dados atualizados com sucesso', { successRate: pctNum, traceId: response.meta?.traceId });
      } catch (error: unknown) {
        _log('error', 'Erro ao carregar dados', { endpoint: this.apiEndpoint, error: (error as Error).message });
        if (this.container.classList.contains('is-loading')) this.render();
        this.errorHandler.showCardError(this.container, 'Erro ao carregar taxa de sucesso');
        this.setStatus('Erro ao carregar');
        this.container.classList.remove('is-loading');
        this.container.classList.add('has-error');
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

  info(): CardInfoResult {
    return {
      name: MODULE_ID,
      version: VERSION,
      cardId: CARD_ID,
      title: 'Taxa Diaria',
      mounted: !!this.$,
      state: this.state.state,
      uptime: this._mountedAt ? Date.now() - this._mountedAt : 0,
      timestamp: Date.now()
    };
  }

  healthCheck(): HealthCheckResult {
    const checks: HealthCheckChecks = {
      instanceExists: true,
      containerValid: !!this.container,
      domReady: !!this.$,
      stateValid: (['IDLE', 'LOADING', 'SUCCESS', 'REFRESHING', 'PAUSED', 'ERROR'] as const).includes(this.state.state),
      noErrors: this.state.state !== 'ERROR'
    };
    const score: number = Object.values(checks).filter(Boolean).length;
    const maxScore: number = Object.keys(checks).length;
    const issues: string[] = Object.entries(checks).filter(([, v]: [string, boolean]) => !v).map(([k]: [string, boolean]) => k);
    return {
      status: score === maxScore ? 'HEALTHY' : score >= maxScore - 1 ? 'DEGRADED' : 'UNHEALTHY',
      score, maxScore, scoreDisplay: `${score}/${maxScore}`,
      checks, issues: issues.length > 0 ? issues : null,
      mounted: !!this.$, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now()
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// CARD FACADE & EXPORTS
// ═══════════════════════════════════════════════════════════════

let _lastInstance: CardSuccessRate | null = null;
export const Card: CardFacade = {
  mount: (container: HTMLElement): CardSuccessRate => { _lastInstance = new CardSuccessRate(container); return _lastInstance; },
  unmount: (instance: CardSuccessRate | null | undefined): void => { instance?.destroy?.(); if (instance === _lastInstance) _lastInstance = null; },
  refresh: (instance: CardSuccessRate | null | undefined): Promise<void> | undefined => instance?.loadData?.(),
  getStatus: (instance: CardSuccessRate | null | undefined): CardStatusResult => instance?.getStatus?.() || { mounted: false },
  isReady: (instance: CardSuccessRate | null | undefined): boolean => instance?.isReady?.() ?? false,
  info: (instance: CardSuccessRate | null | undefined): CardInfoResult => instance?.info?.() || { name: MODULE_ID, version: VERSION, cardId: CARD_ID, mounted: false },
  healthCheck: (instance: CardSuccessRate | null | undefined): HealthCheckResult => instance?.healthCheck?.() || { status: 'UNHEALTHY', mounted: false, version: VERSION, moduleId: MODULE_ID }
};

export const mountCard = (container: HTMLElement): CardSuccessRate => Card.mount(container);
export const unmountCard = (instance: CardSuccessRate | null | undefined): void => Card.unmount(instance);
export const refreshCard = (instance: CardSuccessRate | null | undefined): Promise<void> | undefined => Card.refresh(instance);
export const getCardStatus = (instance: CardSuccessRate | null | undefined): CardStatusResult => Card.getStatus(instance);
export function info(): CardInfoResult { return _lastInstance?.info?.() || { name: MODULE_ID, version: VERSION, cardId: CARD_ID, mounted: false }; }
export function healthCheck(): HealthCheckResult { return _lastInstance?.healthCheck?.() || { status: 'UNHEALTHY', mounted: false, version: VERSION, moduleId: MODULE_ID }; }

export default CardSuccessRate;
