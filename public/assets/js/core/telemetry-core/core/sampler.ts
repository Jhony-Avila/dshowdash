// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: telemetry-core/core/sampler
// PURPOSE: Telemetry Core - Event Sampler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig, updateConfig from ../state/store.js
//
// PROVIDES:
//   VERSION — module constant
//   shouldSample() — exported function
//   applySamplingRules() — exported function
//   updateSampleRates() — exported function
//   clearSamplingCache() — exported function
//   getSamplingStats() — exported function
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
import { getConfig, updateConfig } from '../state/store.js';
export const VERSION = '5.1.0-ENTERPRISE';
const MODULE_ID = 'telemetry-core/core/sampler';
let _debug = false; let _logBuffer: unknown[] = [];
function _log(level: string, ...args: unknown[]) { if (!_debug && level !== 'error') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }
const decisionCache = new Map();
const CACHE_TTL = 60000;
const _metrics = { sampledCount: 0, droppedCount: 0, cacheHitCount: 0, cacheMissCount: 0 };
export function shouldSample(event: Record<string, unknown>) { if (!event || !event.severity) return true; const config = getConfig(); const sev = event.severity as keyof typeof config.sampleRates; const rate = config.sampleRates?.[sev]; if (rate === undefined || rate >= 1) return true; if (rate <= 0) return false; return Math.random() < rate; }
export function applySamplingRules(event: Record<string, unknown>) { if (!event) return false; if (event.severity === 'critical' || event.severity === 'error') { _metrics.sampledCount++; return true; } if (event.type === 'metric' && event.metric) { _metrics.sampledCount++; return true; } const cacheKey = `${event.component}:${event.event}`; const cached = decisionCache.get(cacheKey); if (cached && Date.now() - cached.timestamp < CACHE_TTL) { _metrics.cacheHitCount++; if (cached.decision) _metrics.sampledCount++; else _metrics.droppedCount++; return cached.decision; } _metrics.cacheMissCount++; const decision = shouldSample(event); decisionCache.set(cacheKey, { decision, timestamp: Date.now() }); if (decisionCache.size > 1000) cleanCache(); if (decision) _metrics.sampledCount++; else _metrics.droppedCount++; return decision; }
function cleanCache() { const now = Date.now(); for (const [key, value] of decisionCache.entries()) { if (now - value.timestamp > CACHE_TTL) decisionCache.delete(key); } }
export function updateSampleRates(newRates: unknown) { if (!newRates || typeof newRates !== 'object') return; const current = getConfig(); updateConfig({ sampleRates: { ...current.sampleRates, ...newRates } }); decisionCache.clear(); _log('info', 'Sample rates updated'); }
export function clearSamplingCache() { decisionCache.clear(); }
export function getSamplingStats() { return { version: VERSION, moduleId: MODULE_ID, cacheSize: decisionCache.size, cacheTTL: CACHE_TTL, currentRates: getConfig().sampleRates || {}, metrics: { ..._metrics } }; }
export function getVersion() { return VERSION; }
export function setDebug(enabled: boolean) { _debug = !!enabled; }
export function getMetrics() { return { ..._metrics, cacheSize: decisionCache.size }; }
export function resetMetrics() { _metrics.sampledCount = 0; _metrics.droppedCount = 0; _metrics.cacheHitCount = 0; _metrics.cacheMissCount = 0; }
export function getLogs() { return [..._logBuffer]; }
export function healthCheck() { const checks = { cacheNotOverflow: decisionCache.size < 1000, hasValidRates: Object.keys(getConfig().sampleRates || {}).length > 0 }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, issues: passed < 2 ? ['Cache overflow or no sample rates configured'] : null, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; }
// @ts-expect-error strict migration — TS2783
export function info() { return { version: VERSION, moduleId: MODULE_ID, ...getSamplingStats(), healthCheck: healthCheck(), timestamp: new Date().toISOString() }; }
export default { shouldSample, applySamplingRules, updateSampleRates, clearSamplingCache, getSamplingStats, getVersion, setDebug, getMetrics, resetMetrics, getLogs, healthCheck, info };
