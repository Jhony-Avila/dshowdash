// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.1-ENTERPRISE-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: telemetry-core/_aggregator
// PURPOSE: Fachada pública do telemetry-core (objeto `Telemetry` + adapters)
// ───────────────────────────────────────────────────────────────
// POR QUE ESTE ARQUIVO EXISTE (2026-07-28)
//
// Esta camada existia apenas DENTRO de `dist/telemetry-core.bundle.js`. A fonte original
// (`index.js.bak.pre-bundle`, citada no `_entry.ts`) foi apagada, e com ela sumiu o único
// lugar onde `Telemetry`, `createLegacyAdapter` e `createCallbackAdapter` eram definidos.
//
// O efeito colateral era grave e silencioso: `index.js` re-exporta o bundle e o `_entry.ts`
// do build apontava para `index.js` — ou seja, **o build se alimentava do próprio artefato**.
// Rebuildar o alvo re-empacotava o bundle antigo e descartava qualquer correção nas fontes.
// Foi assim que a correção de CSRF do transporte (que faz a telemetria voltar a persistir)
// não chegava ao runtime por mais correta que estivesse no `.ts`.
//
// Este arquivo reconstrói aquela camada a partir do bundle, agora importando os módulos-fonte
// reais. A API pública foi mantida EXATAMENTE igual — 11 exports, mesmos nomes e semântica —
// para que nada que já consome o módulo precise mudar.
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//   * as TelemetryContracts, SEVERITIES, EVENT_TYPES, COMPONENT_NAMESPACES,
//     validateEvent, createEventName, parseEventName, info from ./contracts.js
//   initTelemetry, shutdownTelemetry, isInitialized, updateTelemetryConfig,
//     manualFlush, getLifecycleInfo from ./core/lifecycle.js
//   emitEvent, emitMetric, emitError from ./core/emitter.js
//   getBufferSnapshot, getAggregatorMetrics from ./core/aggregator.js
//   updateSampleRates, getSamplingStats from ./core/sampler.js
//   isEnabled, getConfig, getContext, setContext, getStats, getStoreInfo from ./state/store.js
//   buildTimestamp, nowUtcMs from ./utils/helpers.js
//   getRetryStats from ./transport/retry.js
//   getTransportStats, isFlushTimerActive from ./transport/send.js
//
// PROVIDES:
//   VERSION, Telemetry (default), Contracts, TelemetryContracts,
//   createLegacyAdapter(), createCallbackAdapter(), buildTimestamp, nowUtcMs,
//   getVersion(), getLogs()
//
// WINDOW ACCESS:
//   window.__dev.telemetry (sempre) · window.Telemetry / window.TelemetryContracts
//   (apenas fora do strict-mode; sob strict vira GLOBAL_EXPOSURE_BLOCKED)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import * as TelemetryContractsNS from './contracts.js';
import { SEVERITIES, EVENT_TYPES, COMPONENT_NAMESPACES, validateEvent, createEventName, parseEventName, info as contractsInfo } from './contracts.js';
import { initTelemetry, shutdownTelemetry, isInitialized, updateTelemetryConfig, manualFlush, getLifecycleInfo, injectPorts as injectLifecyclePorts, getPorts as getLifecyclePorts, startFlushTimerIfAuthenticated } from './core/lifecycle.js';
import { emitEvent, emitMetric, emitError, injectPorts as injectEmitterPorts } from './core/emitter.js';
import { getBufferSnapshot, getAggregatorMetrics } from './core/aggregator.js';
import { updateSampleRates, getSamplingStats } from './core/sampler.js';
import { isEnabled, getConfig, getContext, setContext, getStats, getStoreInfo } from './state/store.js';
import { buildTimestamp, nowUtcMs } from './utils/helpers.js';
import { getRetryStats } from './transport/retry.js';
import { getTransportStats as getSendStats, isFlushTimerActive } from './transport/send.js';

export const VERSION = '5.1.1-ENTERPRISE-STRICT-MODE';
const MODULE_ID = 'telemetry-core';

let _debug = false;
let _logBuffer: unknown[] = [];
function _log(level: string, ...args: unknown[]) { if (!_debug && level !== 'error') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }

const _metrics = { trackCount: 0, infoCount: 0, warnCount: 0, debugCount: 0, errorTrackCount: 0, timingCount: 0 };

export function getVersion() { return VERSION; }
export function getLogs() { return [..._logBuffer]; }

export const TelemetryContracts = TelemetryContractsNS;
// `Contracts` e `TelemetryContracts` são o MESMO objeto — eram o mesmo binding no bundle.
// Separar os dois criaria duas verdades sobre o mesmo contrato.
export const Contracts = TelemetryContractsNS;

// ============================================================================
// PORTS — a injeção que faltava (2026-07-30)
// ============================================================================
//
// PROBLEMA MEDIDO: `_isAuthenticated()` no lifecycle respondia `false` em TODA
// sessão porque o port `globalState` nunca era injetado — `injectPorts()` existia
// em `core/lifecycle.ts` e `core/emitter.ts`, mas não estava na API pública, e
// ninguém no projeto o chamava. Consequência: o gate P0 mantinha o flush timer
// DESLIGADO e a telemetria só saía em `visibilitychange`/`pagehide`. Com buffer
// de 500 eventos, o excedente era descartado em silêncio.
// Medido no runtime: `healthCheck() = DEGRADED, "Flush timer not active"`
// enquanto `window.GlobalState.isAuthenticated()` já devolvia `true`.
//
// POR QUE A CORREÇÃO MORA AQUI, e não no lifecycle:
// sob strict mode o contrato proíbe os módulos de núcleo lerem `window.*` — e
// está certo. Mas ESTE arquivo é a RAIZ DE COMPOSIÇÃO: ele já expõe em `window`
// e já conhece o ambiente. Resolver a dependência aqui e ENTREGAR pela porta é
// exatamente para isso que ports servem. Um fallback para `window.*` dentro do
// lifecycle seria código morto sob strict — foi tentado antes e revertido.

/** Injeta ports nos dois módulos que mantêm instância própria. */
export function injectPorts(ports: Record<string, unknown>) {
  injectLifecyclePorts(ports);
  injectEmitterPorts(ports);
  return true;
}

/** Port `globalState` como o lifecycle o vê — usado só no diagnóstico. */
function _resolverPortGlobalState(): any {
  try { return (getLifecyclePorts() as any)?.globalState || null; } catch (e) { return null; }
}

/** Lê um global pela via oficial (windowAdapter quando existir). */
function _resolverGlobal(nome: string): any {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  if (w.Core?.windowAdapter?.get) {
    try { return w.Core.windowAdapter.get(nome) || null; } catch (e) { /* cai no direto */ }
  }
  return w[nome] || null;
}

/**
 * Liga o port `globalState`. Devolve se conseguiu.
 *
 * Aceita override por `config.ports` — teste e boot alternativo não deveriam
 * depender de global nenhum.
 */
function _ligarGlobalState(portsDoConfig?: Record<string, unknown>): boolean {
  const explicito = portsDoConfig && portsDoConfig.globalState;
  const gs = explicito || _resolverGlobal('GlobalState') || _resolverGlobal('GlobalStateManager');
  if (!gs) return false;
  injectPorts({ globalState: gs });
  return true;
}

/**
 * Religa o flush quando a autenticação chegar DEPOIS do init.
 *
 * No boot da tela de login o GlobalState existe mas ainda não está autenticado,
 * e o gate P0 (corretamente) deixa o timer desligado. Sem isto, ele ficaria
 * desligado pelo resto da sessão mesmo após o login.
 *
 * É POR EVENTO, não por laço: uma reavaliação periódica já foi tentada aqui e
 * revertida — ela girava 12 vezes e desistia. A diferença agora é que o port
 * existe, então `subscribe` do GlobalState tem o que observar.
 */
function _observarLogin(): void {
  const gs = _resolverGlobal('GlobalState') || _resolverGlobal('GlobalStateManager');
  if (!gs) return;

  let jaLigou = false;
  const tentar = () => {
    if (jaLigou) return;
    // `startFlushTimerIfAuthenticated` reaquece o CSRF à força: a sessão mudou
    // no login e o token anterior voltaria 403.
    if (startFlushTimerIfAuthenticated()) {
      jaLigou = true;
      if (typeof cancelar === 'function') cancelar();
    }
  };

  let cancelar: any = null;
  try {
    if (typeof gs.subscribe === 'function')      cancelar = gs.subscribe(tentar);
    else if (typeof gs.onChange === 'function')  cancelar = gs.onChange(tentar);
  } catch (e) { /* sem canal de observação: o flush de unload continua valendo */ }
}

export const Telemetry = {
  version: VERSION,
  name: MODULE_ID,
  moduleId: MODULE_ID,
  buildTimestamp,
  nowUtcMs,
  Contracts: TelemetryContractsNS,
  SEVERITIES,
  EVENT_TYPES,
  COMPONENT_NAMESPACES,

  /**
   * ORDEM IMPORTA: injetar o port ANTES de `initTelemetry`.
   *
   * O gate P0 que decide ligar o flush timer roda DENTRO do init. Injetar
   * depois deixaria o timer desligado até o próximo login — que numa sessão já
   * autenticada nunca vem.
   */
  init(config: Record<string, any> = {}) {
    _ligarGlobalState(config.ports);
    const r = initTelemetry(config);
    // Já autenticado? o init acima ligou o timer e isto é inócuo. Na tela de
    // login, é o que religa depois que a sessão nasce.
    if (!(r as any)?.flushTimerStarted) _observarLogin();
    return r;
  },

  injectPorts(ports: Record<string, unknown>) { return injectPorts(ports); },
  startFlushTimerIfAuthenticated() { return startFlushTimerIfAuthenticated(); },
  shutdown() { return shutdownTelemetry(); },
  isReady() { return isInitialized(); },
  isEnabled() { return isEnabled(); },
  getVersion() { return VERSION; },

  event(name: string, data: Record<string, any> = {}, options: Record<string, any> = {}) { return emitEvent(name, data, options); },
  metric(name: string, data: Record<string, any> = {}, options: Record<string, any> = {}) { return emitMetric(name, data, options); },
  error(name: string, data: Record<string, any> = {}, options: Record<string, any> = {}) { return emitError(name, data, options); },

  info(component: string, message: string, data: Record<string, any> = {}) { _metrics.infoCount++; return emitEvent(`${component}:info`, { message, ...data }, { component, severity: 'info' }); },
  warn(component: string, message: string, data: Record<string, any> = {}) { _metrics.warnCount++; return emitEvent(`${component}:warn`, { message, ...data }, { component, severity: 'warn' }); },
  // ⚠️ NÃO existe aqui um método `debug(component, message, data)`. O objeto original declarava
  // a chave `debug` DUAS vezes — como método de log e como objeto de atalhos — e em um object
  // literal a última vence. Portanto o método de log sempre foi inacessível (e `debugCount`
  // nunca incrementou). Mantido idêntico de propósito: isto é migração de fonte, não
  // refatoração; corrigir aqui mudaria comportamento sem ninguém ter pedido. Ver `debug` abaixo.

  track(name: string, data: Record<string, any> = {}, options: Record<string, any> = {}) { _metrics.trackCount++; return emitEvent(name, data, options); },
  trackError(component: string, error: unknown, data: Record<string, any> = {}) { _metrics.errorTrackCount++; return emitError(`${component}:error`, { error, ...data }, { component, severity: 'error' }); },
  trackTiming(component: string, duration: number, success = true) { _metrics.timingCount++; return emitMetric(`${component}:timing`, { duration, success, unit: 'ms' }, { component }); },

  setContext(context: Record<string, any>) { setContext(context); },
  getContext() { return getContext(); },
  updateConfig(config: Record<string, any>) { return updateTelemetryConfig(config); },
  setSampleRate(rates: any) { updateSampleRates(rates); },

  async flush(reason = 'manual') { return manualFlush(reason); },
  getBufferSnapshot() { return getBufferSnapshot(); },
  getStats() { return getStats(); },

  getMetrics() {
    const agg = getAggregatorMetrics(); const retry = getRetryStats(); const transporte = getSendStats(); const sampling = getSamplingStats();
    return { ..._metrics, ...agg, transport: { flushTimerActive: transporte.flushTimerActive, defaultEndpoint: transporte.defaultEndpoint, retry }, sampling };
  },
  resetMetrics() { _metrics.trackCount = 0; _metrics.infoCount = 0; _metrics.warnCount = 0; _metrics.debugCount = 0; _metrics.errorTrackCount = 0; _metrics.timingCount = 0; _log('info', 'Metrics reset'); },
  setDebug(enabled: boolean) { _debug = !!enabled; _log('info', `Debug: ${_debug}`); },
  getLogs() { return [..._logBuffer]; },
  getTransportStats() { return { aggregator: getAggregatorMetrics(), retry: getRetryStats(), flushTimerActive: isFlushTimerActive(), sampling: getSamplingStats() }; },

  validateEvent(event: unknown) { return validateEvent(event as any); },
  createEventName(a: string, b: string) { return createEventName(a, b); },
  parseEventName(name: string) { return parseEventName(name); },

  healthCheck() {
    const timeZone = (window as any).APP_CONFIG?.app?.timeZone || 'America/Sao_Paulo';
    const checks = { initialized: isInitialized(), enabled: isEnabled(), flushTimerActive: isFlushTimerActive(), timeZoneConfigured: true };
    const issues: string[] = [];
    if (!isInitialized()) issues.push('Not initialized');
    if (!isEnabled()) issues.push('Telemetry disabled');
    if (!isFlushTimerActive() && isInitialized()) issues.push('Flush timer not active');
    const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length;
    return { status: passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: issues.length > 0 ? issues : null, version: VERSION, moduleId: MODULE_ID, timeZone, timestamp: Date.now() };
  },
  getInfo() {
    const config = getConfig();
    const timeZone = (window as any).APP_CONFIG?.app?.timeZone || 'America/Sao_Paulo';
    const locale = (window as any).APP_CONFIG?.app?.locale || 'pt-BR';
    return { moduleId: MODULE_ID, version: VERSION, isReady: isInitialized(), isEnabled: isEnabled(), endpoint: config.endpoint, timeZone, locale, stats: getStats(), metrics: this.getMetrics(), lifecycle: getLifecycleInfo(), store: getStoreInfo(), contracts: contractsInfo(), healthCheck: this.healthCheck(), timestamp: new Date().toISOString() };
  },
  getDiagnostics() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: this.healthCheck(), info: this.getInfo(), buffer: getBufferSnapshot(), contracts: contractsInfo() }; },

  // `debug` é um OBJETO de atalhos de diagnóstico (não um método) — ver a nota acima.
  debug: {
    info: () => Telemetry.getInfo(),
    healthCheck: () => Telemetry.healthCheck(),
    stats: () => Telemetry.getStats(),
    metrics: () => Telemetry.getMetrics(),
    buffer: () => Telemetry.getBufferSnapshot(),
    diagnostics: () => Telemetry.getDiagnostics(),
    contracts: () => contractsInfo(),
    buildTimestamp: (d?: any) => buildTimestamp(d),
    nowUtcMs: () => nowUtcMs(),
    getLogs: () => Telemetry.getLogs(),
  },
};

export function createLegacyAdapter(component = 'unknown') {
  return {
    track(name: string, data: Record<string, any> = {}) { return Telemetry.event(`${component}:${name}`, data, { component }); },
    trackError(name: string, error: unknown, data: Record<string, any> = {}) { return Telemetry.error(`${component}:${name}:error`, { error, ...data }, { component }); },
    trackTiming(name: string, duration: number, success = true) { return Telemetry.metric(`${component}:${name}:timing`, { duration, success }, { component }); },
    info(message: string, data: Record<string, any> = {}) { return Telemetry.info(component, message, data); },
    error(message: string, data: Record<string, any> = {}) { return Telemetry.error(`${component}:error`, { message, ...data }, { component }); },
    warn(message: string, data: Record<string, any> = {}) { return Telemetry.warn(component, message, data); },
    // ⚠️ Idêntico ao original — e o original é defeituoso: `Telemetry.debug` é um OBJETO,
    // então chamá-lo lança TypeError. Ninguém reclamou em produção, o que indica que este
    // ramo nunca é exercitado. Mantido fiel para não mascarar o defeito numa migração de
    // fonte; corrigir é decisão separada, com teste próprio.
    debug(message: string, data: Record<string, any> = {}) { return (Telemetry as any).debug(component, message, data); },
  };
}

export function createCallbackAdapter(component = 'unknown') {
  return function (name: string, data: Record<string, any> = {}) { return Telemetry.event(`${component}:${name}`, data, { component }); };
}

export { buildTimestamp, nowUtcMs };

if (typeof window !== 'undefined') {
  (window as any).__dev = (window as any).__dev || {};
  (window as any).__dev.telemetry = {
    getVersion: () => VERSION,
    healthCheck: () => Telemetry.healthCheck(),
    info: () => Telemetry.getInfo(),
    getDiagnostics: () => Telemetry.getDiagnostics(),
    setDebug: (v: boolean) => Telemetry.setDebug(v),
    getMetrics: () => Telemetry.getMetrics(),
    resetMetrics: () => Telemetry.resetMetrics(),
    getLogs: () => Telemetry.getLogs(),
    contracts: () => contractsInfo(),
    buildTimestamp: (d?: any) => buildTimestamp(d),
    nowUtcMs: () => nowUtcMs(),
    // Diagnóstico do port: sem isto, "flush timer desligado" não distingue
    // "não autenticado" de "port nunca injetado" — que foi o que escondeu
    // esse defeito por semanas.
    ports: () => ({
      globalStateInjetado: !!_resolverPortGlobalState(),
      autenticado: (() => {
        const gs = _resolverPortGlobalState();
        try { return gs?.isAuthenticated?.() ?? null; } catch (e) { return 'erro'; }
      })(),
    }),
    religarFlush: () => Telemetry.startFlushTimerIfAuthenticated(),
  };
  // ⚠️ recordViolation(type: string, details: object) — SEMPRE 2 argumentos.
  if (isStrict()) {
    recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, global: 'Telemetry' });
    recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, global: 'TelemetryContracts' });
  } else {
    (window as any).Telemetry = Telemetry;
    (window as any).TelemetryContracts = TelemetryContractsNS;
  }
}

export default Telemetry;
