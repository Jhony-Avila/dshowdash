// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.4.0-NO-TOKEN-NO-SEND)
// ═══════════════════════════════════════════════════════════════
// MODULE: telemetry-core/transport/send
// PURPOSE: Telemetry Core - Transport Layer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig, setSending, setLastFlushAt from ../state/store.js
//   getBatch from ../core/aggregator.js
//   shouldRetry, incrementAttempt, calculateDelay, clearAttempts, cleanupOldAttempts, getRetryStats from ./retry.js
//   generateTraceId from ../utils/uuid.js
//   safeStringify, getTimestampMs from ../utils/helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   sendBatch() — exported function
//   sendBeacon() — exported function
//   flush() — exported function
//   startFlushTimer() — exported function
//   stopFlushTimer() — exported function
//   isFlushTimerActive() — exported function
//   getTransportStats() — exported function
//   getVersion() — exported function
//   setDebug() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   getLogs() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { getConfig, setSending, setLastFlushAt } from '../state/store.js';
import { getBatch } from '../core/aggregator.js';
import { shouldRetry, incrementAttempt, calculateDelay, clearAttempts, cleanupOldAttempts, getRetryStats } from './retry.js';
import { generateTraceId } from '../utils/uuid.js';
import { safeStringify, getTimestampMs } from '../utils/helpers.js';
export const VERSION = '5.4.0-NO-TOKEN-NO-SEND';
const MODULE_ID = 'telemetry-core/transport/send';
const DEFAULT_ENDPOINT = '/api/telemetry/';
let _debug = false; let _logBuffer: unknown[] = [];
function _log(level: string, ...args: unknown[]) { if (!_debug && level !== 'error') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }
let flushTimer: ReturnType<typeof setInterval> | null = null;
const _metrics = { sendCount: 0, beaconCount: 0, flushCount: 0, errorCount: 0, lastSendAt: null as unknown | null, droppedNoAuth: 0, droppedNoCsrf: 0, skippedNoCsrf: 0 };

// ─── CSRF ───────────────────────────────────────────────────────
// O endpoint exige X-CSRF-Token (requireCsrf em api/_helpers/AuthHelpers.php). O fallback
// $_POST['csrf_token'] de lá NUNCA vale aqui: o corpo é JSON, então $_POST fica vazio —
// só o header serve. Sem ele, 100% dos lotes voltavam 403 e eram descartados em silêncio.
// Ordem cookie → check.php é a mesma já usada por panel-pipedrive/outlook/anuncios.
// ⚠️ `.php` é obrigatório em check.php: sem ele a rota cai no fallback da SPA e devolve HTML.
let _csrfCache: string | null = null;
function _csrfDoCookie(): string {
  if (typeof document === 'undefined' || !document.cookie) return '';
  const c = document.cookie.split('; ').find((x) => x.startsWith('csrf_token='));
  return c ? decodeURIComponent(c.slice('csrf_token='.length)) : '';
}
// Versão síncrona — única utilizável no unload, onde não há tempo para um round-trip.
function _csrfAgora(): string { return _csrfCache || _csrfDoCookie(); }
// Aquecimento explícito, chamado no init do módulo. Sem ele, um flush disparado por
// visibilitychange/pagehide ANTES do primeiro envio não tem token em mãos e cai no
// navigator.sendBeacon — que não envia cabeçalho — resultando em 403. Não bloqueia o boot:
// dispara e segue. Se não houver sessão, o token vem vazio e o 401 subsequente é o correto.
// `forcar` descarta o token em cache antes de buscar. É obrigatório depois de um login:
// o token aquecido na sessão anônima continua "preenchido" e o envio sai com um valor que o
// servidor recusa — 403 com cabeçalho presente engana mais que 403 sem cabeçalho nenhum.
export function prepararCsrf(forcar = false) { if (forcar) _csrfCache = null; void _csrfToken(); }
// ⚠️ ESPIRAL DE 403 (corrigida em 2026-07-30). Ao levar 403, o código zerava
// `_csrfCache` e parava por aí. O envio seguinte encontrava o cache vazio, e
// como `_csrfAgora()` é SÍNCRONO (não pode buscar token), caía no
// `navigator.sendBeacon` — que não manda cabeçalho — e levava 403 de novo, que
// zerava o cache de novo. A sessão inteira ficava presa nesse laço, sempre pelo
// caminho sem token. Não havia cookie `csrf_token` para socorrer: medido,
// `document.cookie` NÃO tem esse cookie neste app; o único suprimento é o
// `/api/auth/check.php`. Por isso o 403 agora dispara um REAQUECIMENTO
// (`void _csrfToken()`): a próxima tentativa já tem token em mãos e usa
// `fetch(keepalive)`. Sem isso, um único 403 condenava o resto da sessão.
async function _csrfToken(): Promise<string> {
  const emMaos = _csrfAgora();
  if (emMaos) { _csrfCache = emMaos; return emMaos; }
  try {
    const r = await fetch('/api/auth/check.php', { method: 'GET', headers: { Accept: 'application/json' }, credentials: 'same-origin', cache: 'no-store' });
    const j = await r.json();
    _csrfCache = j?.data?.session?.csrf_token || null;
  } catch { _csrfCache = null; }
  return _csrfCache || '';
}
export async function sendBatch(events: Record<string, unknown>[], options: Record<string, any> = {}) { if (!events || events.length === 0) return { success: true, sent: 0 }; const config = getConfig(); const endpoint = options.endpoint || config.endpoint || DEFAULT_ENDPOINT; const batchId = generateTraceId(); setSending(true); _metrics.sendCount++; const _ctrl = new AbortController(); const _tout = setTimeout(() => _ctrl.abort(), 15000); try { const payload = { batchId, timestamp: getTimestampMs(), events, count: events.length }; const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Telemetry-Batch': batchId, 'X-CSRF-Token': await _csrfToken() }, body: safeStringify(payload), keepalive: true, credentials: 'same-origin', signal: _ctrl.signal }); clearTimeout(_tout); if (response.status === 401 || response.status === 403) { clearAttempts(batchId); setSending(false); if (response.status === 403) { _csrfCache = null; void _csrfToken(); _metrics.droppedNoCsrf++; _log('error', `Telemetry 403: CSRF recusado, lote de ${events.length} evento(s) descartado`); } else { _metrics.droppedNoAuth++; _log('info', 'Telemetry 401: sem sessão (esperado na tela de login), descartando lote'); } return { success: true, sent: 0, dropped: true, reason: response.status === 403 ? 'csrf-rejected' : 'auth-required' }; } if (!response.ok) throw { status: response.status, message: `HTTP ${response.status}` }; clearAttempts(batchId); setLastFlushAt(getTimestampMs()); setSending(false); _metrics.lastSendAt = new Date().toISOString(); _log('info', `Batch sent: ${events.length} events`); return { success: true, sent: events.length, batchId }; } catch (error: any) { clearTimeout(_tout); setSending(false); _metrics.errorCount++; if (shouldRetry(batchId, error)) { const attempt = incrementAttempt(batchId); const delay = calculateDelay(attempt); setTimeout(() => sendBatch(events, options), delay); return { success: false, retry: true, attempt, delay }; } cleanupOldAttempts(); return { success: false, error: error.message || 'Unknown error' }; } }
// ⚠️ navigator.sendBeacon NÃO envia cabeçalhos — nunca leva X-CSRF-Token, então o endpoint
// responde 403 por construção. `fetch(keepalive:true)` também sobrevive ao unload E aceita
// cabeçalho, por isso é o caminho preferido; o beacon fica só como último recurso (sem token
// em mãos ou sem fetch), onde continua valendo mais tentar que desistir.
// Ambos os caminhos têm o mesmo teto de ~64KB por envio — trocar um pelo outro não regride nisso.
export function sendBeacon(events: Record<string, unknown>[]) {
  if (!events || events.length === 0) return false;
  _metrics.beaconCount++;
  const config = getConfig();
  const endpoint = config.endpoint || DEFAULT_ENDPOINT;
  const payload = { batchId: generateTraceId(), timestamp: getTimestampMs(), events, count: events.length, beacon: true };
  const corpo = safeStringify(payload);
  const csrf = _csrfAgora(); // síncrono de propósito: no unload não há tempo de buscar token
  // v5.4.0-NO-TOKEN-NO-SEND: sem token em mãos NÃO existe envio que o servidor aceite — o endpoint exige sessão E
  // X-CSRF-Token; o beacon (sem cabeçalho) volta 401 na tela de login e 403 com sessão. Medido 16/09/2026: eram
  // exatamente esses os 401/403 restantes (flush por pagehide/visibilitychange antes do token, ou anônimo) e cada um
  // vira "Failed to load resource" no console. O buffer NÃO é drenado por este caminho (flushOnUnload usa getBuffer),
  // então os eventos ficam para o próximo flush com token; na tela de login não há sessão que os aceite mesmo.
  if (!csrf) { _metrics.skippedNoCsrf++; _log('info', `Beacon sem token CSRF: ${events.length} evento(s) retidos (sem sessão ou token ainda não aquecido)`); return false; }
  if (typeof fetch === 'function') {
    try {
      // Sem await: no unload a promessa não seria resolvida a tempo — keepalive é o que
      // garante a entrega. O catch existe só para não vazar rejeição não tratada.
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Telemetry-Batch': payload.batchId, 'X-CSRF-Token': csrf }, body: corpo, keepalive: true, credentials: 'same-origin' }).catch(() => {});
      setLastFlushAt(getTimestampMs());
      return true;
    } catch { /* cai no beacon abaixo */ }
  }
  // navigator.sendBeacon (sem cabeçalho) removido como fallback em v5.4.0: nunca é aceito pelo endpoint (403 por construção).
  return false;
}
export async function flush(reason = 'manual') { _metrics.flushCount++; const batch = getBatch(); if (batch.length === 0) return { success: true, sent: 0, reason }; if (['unload', 'visibilitychange', 'pagehide'].includes(reason)) { const sent = sendBeacon(batch); return { success: sent, sent: sent ? batch.length : 0, reason, method: 'beacon' }; } const result = await sendBatch(batch); return { ...result, reason, method: 'fetch' }; }
// Aquece o cache do token ao iniciar o timer. Sem isto, um flush por unload que aconteça
// ANTES do primeiro sendBatch não tem token em mãos (o cookie não é legível por JS aqui),
// cai no navigator.sendBeacon — que não envia cabeçalho — e volta 403. Medido: era a fonte
// dos únicos 403 que sobraram depois da correção.
export function startFlushTimer() { if (flushTimer) return; const config = getConfig(); const interval = config.flushIntervalMs || 30000; void _csrfToken(); flushTimer = setInterval(async () => { const batch = getBatch(); if (batch.length > 0) await sendBatch(batch); }, interval); _log('info', `Flush timer started: ${interval}ms`); }
export function stopFlushTimer() { if (flushTimer) { clearInterval(flushTimer); flushTimer = null; _log('info', 'Flush timer stopped'); } }
export function isFlushTimerActive() { return flushTimer !== null; }
export function getTransportStats() { return { version: VERSION, moduleId: MODULE_ID, flushTimerActive: isFlushTimerActive(), retry: getRetryStats(), defaultEndpoint: DEFAULT_ENDPOINT, metrics: { ..._metrics } }; }
export function getVersion() { return VERSION; }
export function setDebug(enabled: boolean) { _debug = !!enabled; }
export function getMetrics() { return { ..._metrics, flushTimerActive: isFlushTimerActive() }; }
export function resetMetrics() { _metrics.sendCount = 0; _metrics.beaconCount = 0; _metrics.flushCount = 0; _metrics.errorCount = 0; _metrics.lastSendAt = null; _metrics.droppedNoAuth = 0; _metrics.droppedNoCsrf = 0; _metrics.skippedNoCsrf = 0; }
export function getLogs() { return [..._logBuffer]; }
// O 3º check existe porque a ausência dele foi o que escondeu o defeito: lote recusado por
// CSRF voltava como `success: true`, então nada aqui piscava enquanto 15 dias de eventos
// eram descartados. Descarte por CSRF é sempre defeito nosso — 401 (deslogado) não conta.
export function healthCheck() { const checks = { flushTimerActive: isFlushTimerActive(), noExcessiveErrors: _metrics.errorCount < 50, csrfAccepted: _metrics.droppedNoCsrf === 0 }; const passed = Object.values(checks).filter(Boolean).length; const issues = []; if (!isFlushTimerActive()) issues.push('Flush timer not active'); if (_metrics.errorCount >= 50) issues.push('Excessive transport errors'); if (_metrics.droppedNoCsrf > 0) issues.push(`${_metrics.droppedNoCsrf} lote(s) descartado(s) por CSRF recusado`); return { status: passed === 3 ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'CRITICAL', score: passed, maxScore: 3, scoreDisplay: `${passed}/3`, checks, issues: issues.length > 0 ? issues : null, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; }
// @ts-expect-error strict migration — TS2783
export function info() { return { version: VERSION, moduleId: MODULE_ID, ...getTransportStats(), healthCheck: healthCheck(), timestamp: new Date().toISOString() }; }
export default { sendBatch, sendBeacon, flush, startFlushTimer, stopFlushTimer, isFlushTimerActive, getTransportStats, getVersion, setDebug, getMetrics, resetMetrics, getLogs, healthCheck, info };
