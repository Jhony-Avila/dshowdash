// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.7.0-POLL-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader-auth-decision
// PURPOSE: Auth Decision - Preloader System
// @changelog v2.7.0-POLL-FIX: Adicionado polling ativo durante espera
//   para detectar SessionManager/GlobalState assim que disponíveis,
//   eliminando espera desnecessária de 10s por timeout de eventos.
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   AUTH_EVENTS, AUTH_INTENTS from /core/runtime/events/catalog/auth.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   TRUSTED_SOURCES — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   checkImmediate() — exported function
//   waitForAuthDecision() — exported function
//   getVersion() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   AUTH_EVENTS.READY
//   AUTH_INTENTS.LOGIN
//   AUTH_EVENTS.LOGIN_SUCCESS
// WINDOW ACCESS:
//   document.addEventListener
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { AUTH_EVENTS, AUTH_INTENTS } from '/core/runtime/events/catalog/auth.events.js';

export const VERSION = '2.7.0-POLL-FIX';
export const MODULE_ID = 'preloader-auth-decision';

const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _metrics = { checkCount: 0, datasetChecks: 0, sessionManagerChecks: 0, globalStateChecks: 0, fallbackChecks: 0, successCount: 0, failureCount: 0, eventReceived: null as string | null, lastCheckAt: null as number | null, pollChecks: 0, resolvedBy: null as string | null };

const _log = function(level: string, ...rest: any[]) {
  const args = rest;
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === 'error') { if (logger.error) logger.error(prefix, args.join(' ')); return; }
  if (level === 'warn') { if (logger.warn) logger.warn(prefix, args.join(' ')); return; }
  if (level === 'info') { if (logger.info) logger.info(prefix, args.join(' ')); return; }
  if (logger.debug) logger.debug(prefix, args.join(' '));
};

export const TRUSTED_SOURCES = ['auth-boot', 'auth-boot-restore', 'bootstrap-v2', 'bootstrap-v2-restore', 'bootstrap-v2-recovery', 'bootstrap-v2-post-login'];

// @ts-expect-error strict migration — TS2345
function isTrustedSource(source: string | null) { return TRUSTED_SOURCES.indexOf(source) !== -1; }
function checkDataset(): null { return null; }

function checkSessionManager() {
  if (!hasWindow) return null;
  _metrics.sessionManagerChecks++;
  const sm = _getPort('sessionManager');
  const isAuth = sm && sm.isAuthenticated ? sm.isAuthenticated() : undefined;
  const user = sm && sm.getUser ? sm.getUser() : undefined;
  _log('info', `[SESSION-MANAGER] isAuthenticated()=${isAuth}, hasUser=${!!user}`);
  if (isAuth === true && user) {
    _log('info', '[SESSION-MANAGER] DECIDIDO: authenticated=true');
    return { decided: true, authenticated: true, source: 'SessionManager', user };
  }
  return null;
}

function checkGlobalState() {
  if (!hasWindow) return null;
  _metrics.globalStateChecks++;
  const gs = _getPort('globalState');
  const isAuth = gs && gs.isAuthenticated ? gs.isAuthenticated() : undefined;
  _log('info', `[GLOBAL-STATE] isAuthenticated()=${isAuth}`);
  if (isAuth === true) {
    _log('info', '[GLOBAL-STATE] DECIDIDO: authenticated=true');
    return { decided: true, authenticated: true, source: 'GlobalState' };
  }
  return null;
}

function fallbackCheckSession() {
  if (!hasWindow) return Promise.resolve(null);
  _metrics.fallbackChecks++;
  _log('info', '[FALLBACK] Chamando SessionManager.checkSession()...');
  const sm = _getPort('sessionManager');
  if (!sm || !sm.checkSession) {
    _log('info', '[FALLBACK] SessionManager.checkSession nao disponivel');
    return Promise.resolve(null);
  }
  return sm.checkSession().then((result: Record<string, unknown>) => {
    _log('info', '[FALLBACK] checkSession() RESULTADO:', { ok: result ? result.ok : null, authenticated: result ? result.authenticated : null, hasUser: !!(result && result.user) });
    if (result && result.ok && result.authenticated && result.user) {
      _log('info', '[FALLBACK] Backend confirmou autenticacao!');
      _metrics.successCount++;
      return { decided: true, authenticated: true, user: result.user, source: 'fallback-checkSession' };
    }
    _log('info', '[FALLBACK] Backend retornou nao autenticado');
    _metrics.failureCount++;
    return { decided: true, authenticated: false, source: 'fallback-checkSession-negative' };
  }).catch((error: Error) => {
    _log('error', '[FALLBACK] Erro:', error.message);
    _metrics.failureCount++;
    return { decided: true, authenticated: false, source: 'fallback-error', error: error.message };
  });
}

export function checkImmediate() {
  _log('info', 'Verificando sinais imediatos (SessionManager/GlobalState)...');
  _initPorts();
  return checkSessionManager() || checkGlobalState();
}

export function waitForAuthDecision(timeout = 10000) {
  _metrics.checkCount++;
  _metrics.lastCheckAt = Date.now();
  _initPorts();
  _log('info', `waitForAuthDecision() iniciado (timeout=${timeout}ms)`);
  _log('info', `[MONITOR] Aguardando AUTH_EVENTS.READY = ${AUTH_EVENTS.READY}`);

  const immediate = checkImmediate();
  if (immediate) {
    _log('info', `DECISAO IMEDIATA: authenticated=${immediate.authenticated}, source=${immediate.source}`);
    if (immediate.authenticated) _metrics.successCount++; else _metrics.failureCount++;
    _metrics.resolvedBy = 'immediate';
    return Promise.resolve(immediate);
  }

  _log('info', 'Nenhum sinal imediato - AGUARDANDO EVENTOS + POLLING do bootstrap-v2...');
  if (!hasWindow || !hasDocument) return Promise.resolve({ decided: true, authenticated: false, source: 'no-environment' });

  return new Promise(resolve => {
    let resolved = false;
    const eb = _getPort('eventBus');

    function cleanup() {
      if (resolved) return;
      resolved = true;
      // @ts-expect-error strict migration — TS2769
      document.removeEventListener(AUTH_EVENTS.READY, onAuthReadyDOM);
      // @ts-expect-error strict migration — TS2769
      document.removeEventListener(AUTH_EVENTS.LOGIN_SUCCESS, onLoginSuccessDOM);
      if (eb && eb.off) {
        eb.off(AUTH_EVENTS.READY, onAuthReadyBus);
        eb.off(AUTH_INTENTS.LOGIN, onLoginRequired);
        eb.off(AUTH_EVENTS.LOGIN_SUCCESS, onLoginSuccess);
      }
      clearTimeout(timeoutId);
      clearInterval(pollId);
    }

    function resolveWith(result: { authenticated?: unknown; source?: string; [key: string]: unknown }) {
      if (resolved) return;
      cleanup();
      _log('info', `DECISAO FINAL: authenticated=${result.authenticated}, source=${result.source}`);
      _metrics.eventReceived = result.source || null;
      if (result.authenticated) _metrics.successCount++; else _metrics.failureCount++;
      resolve(result);
    }

    // ═══ POLLING ATIVO — verifica SessionManager/GlobalState a cada 500ms ═══
    // Resolve assim que os ports ficarem disponíveis (Phase 1/2 do bootstrap)
    // sem precisar esperar o timeout de eventos.
    const pollId = setInterval(() => {
      if (resolved) return;
      _metrics.pollChecks++;
      _initPorts(); // Re-inicializa ports para detectar novos registros
      const pollResult = checkSessionManager() || checkGlobalState();
      if (pollResult) {
        _log('info', `[POLL] Detectado via polling (check #${_metrics.pollChecks}): authenticated=${pollResult.authenticated}`);
        _metrics.resolvedBy = 'poll';
        resolveWith(pollResult);
      }
    }, 500);

    // ═══ EVENT LISTENERS — mantidos para resolução mais rápida ═══
    function onAuthReadyDOM(e: CustomEvent) {
      _log('info', '[DOM] AUTH_READY recebido!', e.detail);
      const source = e.detail ? e.detail.source : null;
      if (isTrustedSource(source)) {
        _log('info', `[DOM] AUTH_READY ACEITO de ${source}`);
        _metrics.resolvedBy = 'dom-event';
        resolveWith({ decided: true, authenticated: true, user: e.detail ? e.detail.user : null, source: `dom-${source}` });
      } else {
        _log('info', `[DOM] AUTH_READY IGNORADO - source nao confiavel: ${source}`);
      }
    }

    function onLoginSuccessDOM(e: CustomEvent) {
      _log('info', '[DOM] LOGIN_SUCCESS recebido!', e.detail);
      const source = e.detail ? e.detail.source : null;
      if (isTrustedSource(source)) {
        _log('info', `[DOM] LOGIN_SUCCESS ACEITO de ${source}`);
        _metrics.resolvedBy = 'dom-login-event';
        resolveWith({ decided: true, authenticated: true, user: e.detail ? e.detail.user : null, source: `dom-login-${source}` });
      }
    }

    function onAuthReadyBus(data: { source?: string; user?: unknown; [key: string]: unknown }) {
      _log('info', `[EVENTBUS] AUTH_READY recebido! source=${data ? data.source : null}`);
      if (!isTrustedSource(data ? data.source || null : null)) { _log('info', '[EVENTBUS] AUTH_READY IGNORADO'); return; }
      _log('info', `[EVENTBUS] AUTH_READY ACEITO de ${data.source}`);
      _metrics.resolvedBy = 'eventbus';
      resolveWith({ decided: true, authenticated: true, user: data ? data.user : null, source: `eventbus-${data.source}` });
    }

    function onLoginRequired(data: { source?: string; reason?: unknown; [key: string]: unknown }) {
      _log('info', `[EVENTBUS] LOGIN_REQUIRED recebido! source=${data ? data.source : null}`);
      // @ts-expect-error strict migration — TS2345
      if (!isTrustedSource(data ? data.source : null)) { _log('info', '[EVENTBUS] LOGIN_REQUIRED IGNORADO'); return; }
      _log('info', `[EVENTBUS] LOGIN_REQUIRED ACEITO de ${data.source}`);
      _metrics.resolvedBy = 'eventbus-login-required';
      resolveWith({ decided: true, authenticated: false, reason: data ? data.reason : null, source: `eventbus-${data.source}` });
    }

    function onLoginSuccess(data: { source?: string; user?: unknown; [key: string]: unknown }) {
      _log('info', `[EVENTBUS] LOGIN_SUCCESS recebido! source=${data ? data.source : null}`);
      // @ts-expect-error strict migration — TS2345
      if (!isTrustedSource(data ? data.source : null)) { _log('info', '[EVENTBUS] LOGIN_SUCCESS IGNORADO'); return; }
      _log('info', `[EVENTBUS] LOGIN_SUCCESS ACEITO de ${data.source}`);
      _metrics.resolvedBy = 'eventbus-login-success';
      resolveWith({ decided: true, authenticated: true, user: data ? data.user : null, source: `eventbus-${data.source}` });
    }

    // @ts-expect-error strict migration — TS2769
    document.addEventListener(AUTH_EVENTS.READY, onAuthReadyDOM, { once: true });
    // @ts-expect-error strict migration — TS2769
    document.addEventListener(AUTH_EVENTS.LOGIN_SUCCESS, onLoginSuccessDOM, { once: true });

    if (eb && eb.on) {
      _log('info', '[MONITOR] Registrando listeners no EventBus...');
      eb.on(AUTH_EVENTS.READY, onAuthReadyBus);
      eb.on(AUTH_INTENTS.LOGIN, onLoginRequired);
      eb.on(AUTH_EVENTS.LOGIN_SUCCESS, onLoginSuccess);
    } else {
      _log('info', '[MONITOR] EventBus nao disponivel - funcionando com POLLING + DOM events');
    }

    const timeoutId = setTimeout(() => {
      if (resolved) return;
      _log('info', `[TIMEOUT] ${timeout}ms esgotado - NENHUM EVENTO/POLL RESOLVEU!`);
      _log('info', '[TIMEOUT] Iniciando FALLBACK SessionManager.checkSession()...');
      fallbackCheckSession().then((fallbackResult: { authenticated?: boolean; source?: string; [key: string]: unknown } | null) => {
        if (resolved) return;
        if (fallbackResult && fallbackResult.authenticated === true) {
          _log('info', '[TIMEOUT->FALLBACK] Backend confirmou autenticacao!');
          _metrics.resolvedBy = 'timeout-fallback';
          resolveWith(fallbackResult);
        } else {
          _log('info', '[TIMEOUT->FALLBACK] Nao autenticado');
          _metrics.resolvedBy = 'timeout';
          resolveWith(fallbackResult || { decided: true, authenticated: false, reason: 'timeout-no-events', source: 'timeout' });
        }
      });
    }, timeout);
  });
}

export function getVersion() { return VERSION; }
export function getMetrics() { return Object.assign({}, _metrics); }
export function resetMetrics() { const metricsAny = _metrics as Record<string, number | string | null>; Object.keys(_metrics).forEach(k => { metricsAny[k] = typeof metricsAny[k] === 'number' ? 0 : null; }); }

export function healthCheck() {
  const gs = _getPort('globalState');
  const eb = _getPort('eventBus');
  const sm = _getPort('sessionManager');
  const checks = {
    hasWindow,
    hasDocument,
    sessionManagerAvailable: !!(sm && sm.checkSession),
    globalStateAvailable: !!(gs && gs.isAuthenticated),
    eventBusAvailable: !!(eb && eb.on),
    lowFailureRate: _metrics.checkCount === 0 || (_metrics.successCount / _metrics.checkCount) > 0.3,
    hasLogger: !!_getPort('logger'),
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? 'HEALTHY' : (passed >= 5 ? 'DEGRADED' : 'UNHEALTHY'),
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    metrics: Object.assign({}, _metrics),
    trustedSources: TRUSTED_SOURCES,
    portsInitialized: Ports.isInitialized(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    trustedSources: TRUSTED_SOURCES,
    portsInitialized: Ports.isInitialized(),
    metrics: getMetrics(),
    healthCheck: healthCheck()
  };
}

export default { waitForAuthDecision, checkImmediate, fallbackCheckSession, TRUSTED_SOURCES, getVersion, getMetrics, healthCheck, info, injectPorts, getPorts };
