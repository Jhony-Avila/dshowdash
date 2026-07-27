// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.0.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-rate-limiter
// PURPOSE: Login Modal - Rate Limiter (Enhanced with IP Detection)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   RateLimiter() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   localStorage
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '6.0.0-P17WI';
const MODULE_ID = 'login-modal-rate-limiter';
const IP_STORAGE_KEY = 'dshow_rate_limit_ip';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string) { const logger = _getPort('logger'); if (!logger) return; const args = Array.prototype.slice.call(arguments, 1); if (level === 'error') { if (logger.error) logger.error(...['[login-rate-limiter]'].concat(args)); return; } if (level === 'warn') { if (logger.warn) logger.warn(...['[login-rate-limiter]'].concat(args)); return; } if (_debugEnabled() && logger.debug) logger.debug(...['[login-rate-limiter]'].concat(args)); };


// @ts-expect-error TS migration - TS2554
export function RateLimiter(this: any, config: Record<string, any>) { if (!config) config = {}; const sec = config.security || {}; this.maxAttempts = sec.rateLimitAttempts || 5; this.windowMs = sec.rateLimitWindow || 300000; this.lockoutMs = sec.lockoutDuration || 900000; this.attempts = []; this.lockedUntil = null; this.backendRetryAfter = null; this.ipTrackingEnabled = sec.ipTracking !== false; this.ipMaxAttempts = sec.ipMaxAttempts || 10; this.ipWindowMs = sec.ipWindow || 600000; this.ipLockoutMs = sec.ipLockout || 1800000; this._ipData = this._loadIPData(); this._metrics = { totalAttempts: 0, lockouts: 0, syncs: 0, ipLockouts: 0, ipAttempts: 0 }; _initPorts(); _log('info', 'RateLimiter inicializado', { ipTracking: this.ipTrackingEnabled }); }


// @ts-expect-error TS migration - TS2554
RateLimiter.prototype.recordAttempt = function(ipAddress: string) { this._metrics.totalAttempts++; const now = Date.now(); const self = this; this.attempts = this.attempts.filter((t: number) => now - t < self.windowMs); this.attempts.push(now); if (this.attempts.length >= this.maxAttempts) { this.lockedUntil = now + this.lockoutMs; this._metrics.lockouts++; _log('warn', 'Session rate limit atingido', { until: new Date(this.lockedUntil) }); } if (this.ipTrackingEnabled && ipAddress) this._recordIPAttempt(ipAddress, now); };


// @ts-expect-error TS migration - TS2554
RateLimiter.prototype._recordIPAttempt = function(ipAddress: string, now: number) { this._metrics.ipAttempts++; const ip = this._normalizeIP(ipAddress); const self = this; if (!this._ipData.attempts[ip]) this._ipData.attempts[ip] = []; this._ipData.attempts[ip] = this._ipData.attempts[ip].filter((t: number) => now - t < self.ipWindowMs); this._ipData.attempts[ip].push(now); if (this._ipData.attempts[ip].length >= this.ipMaxAttempts) { this._ipData.locked[ip] = now + this.ipLockoutMs; this._metrics.ipLockouts++; _log('warn', 'IP rate limit atingido', { ip: this._maskIP(ip), until: new Date(this._ipData.locked[ip]) }); } this._persistIPData(); };

RateLimiter.prototype._normalizeIP = (ip: string) => { if (!ip) return 'unknown'; return ip.split(',')[0].trim(); };
RateLimiter.prototype._maskIP = (ip: string) => { const parts = ip.split('.'); if (parts.length === 4) return `${parts[0]}.${parts[1]}.xxx.xxx`; return `${ip.substring(0, 8)}***`; };


// @ts-expect-error TS migration - TS2554
RateLimiter.prototype.isLocked = function(ipAddress: string) { const now = Date.now(); if (this.backendRetryAfter && now < this.backendRetryAfter) return true; if (this.lockedUntil && now < this.lockedUntil) return true; if (this.lockedUntil && now >= this.lockedUntil) { this.lockedUntil = null; this.attempts = []; } if (this.ipTrackingEnabled && ipAddress) { const ip = this._normalizeIP(ipAddress); if (this._ipData.locked[ip] && now < this._ipData.locked[ip]) { _log('warn', 'IP bloqueado', { ip: this._maskIP(ip) }); return true; } if (this._ipData.locked[ip] && now >= this._ipData.locked[ip]) { delete this._ipData.locked[ip]; delete this._ipData.attempts[ip]; this._persistIPData(); } } return false; };

RateLimiter.prototype.isIPLocked = function(ipAddress: string) { if (!this.ipTrackingEnabled || !ipAddress) return false; const ip = this._normalizeIP(ipAddress); const now = Date.now(); return this._ipData.locked[ip] && now < this._ipData.locked[ip]; };

RateLimiter.prototype.getRemainingLockTime = function(ipAddress: string) { const now = Date.now(); if (this.backendRetryAfter && now < this.backendRetryAfter) return this.backendRetryAfter - now; if (this.lockedUntil && now < this.lockedUntil) return this.lockedUntil - now; if (this.ipTrackingEnabled && ipAddress) { const ip = this._normalizeIP(ipAddress); if (this._ipData.locked[ip] && now < this._ipData.locked[ip]) return this._ipData.locked[ip] - now; } return 0; };


// @ts-expect-error TS migration - TS2554
RateLimiter.prototype.syncBackendRetryAfter = function(retryAfterMs: number, source: string) { if (!source) source = 'unknown'; this._metrics.syncs++; this.backendRetryAfter = Date.now() + retryAfterMs; _log('info', `Backend retry-after sincronizado: ${retryAfterMs}ms (source: ${source})`); };


// @ts-expect-error TS migration - TS2554
RateLimiter.prototype.syncIPFromBackend = function(headers: any) { if (!headers) return; const remaining = headers.get ? headers.get('X-RateLimit-Remaining') : null; const reset = headers.get ? headers.get('X-RateLimit-Reset') : null; const clientIP = (headers.get ? headers.get('X-Client-IP') : null) || (headers.get ? headers.get('X-Forwarded-For') : null); if (remaining !== null && parseInt(remaining, 10) === 0 && reset) { const resetMs = parseInt(reset, 10) * 1000 - Date.now(); if (resetMs > 0 && clientIP) { const ip = this._normalizeIP(clientIP); this._ipData.locked[ip] = Date.now() + resetMs; this._persistIPData(); _log('info', 'IP sync from backend', { ip: this._maskIP(ip), resetMs }); } } };


// @ts-expect-error TS migration - TS2554
RateLimiter.prototype.reset = function(ipAddress: string) { this.attempts = []; this.lockedUntil = null; this.backendRetryAfter = null; if (ipAddress) { const ip = this._normalizeIP(ipAddress); delete this._ipData.attempts[ip]; delete this._ipData.locked[ip]; this._persistIPData(); } _log('info', 'Rate limiter resetado'); };


// @ts-expect-error TS migration - TS2554
RateLimiter.prototype.resetAll = function() { this.attempts = []; this.lockedUntil = null; this.backendRetryAfter = null; this._ipData = { attempts: {}, locked: {} }; this._persistIPData(); _log('info', 'Rate limiter completamente resetado'); };


// @ts-expect-error TS migration - TS2554
RateLimiter.prototype._loadIPData = () => { try { const stored = localStorage.getItem(IP_STORAGE_KEY); if (stored) { const data = JSON.parse(stored); const now = Date.now(); Object.keys(data.locked || {}).forEach((ip: string) => { if (data.locked[ip] < now) delete data.locked[ip]; }); return { attempts: data.attempts || {}, locked: data.locked || {} }; } } catch (e) { _log('warn', 'Erro ao carregar IP data', e); } return { attempts: {}, locked: {} }; };


// @ts-expect-error TS migration - TS2554
RateLimiter.prototype._persistIPData = function() { try { localStorage.setItem(IP_STORAGE_KEY, JSON.stringify(this._ipData)); } catch (e) { _log('warn', 'Erro ao persistir IP data', e); } };

RateLimiter.prototype.getStatus = function(ipAddress: string) { const ip = ipAddress ? this._normalizeIP(ipAddress) : null; return { isLocked: this.isLocked(ipAddress), remainingLockTime: this.getRemainingLockTime(ipAddress), attempts: this.attempts.length, maxAttempts: this.maxAttempts, lockedUntil: this.lockedUntil, backendRetryAfter: this.backendRetryAfter, ipTracking: this.ipTrackingEnabled, ipLocked: ip ? this.isIPLocked(ip) : false, ipAttempts: ip ? ((this._ipData.attempts[ip] && this._ipData.attempts[ip].length) || 0) : 0, metrics: Object.assign({}, this._metrics) }; };

RateLimiter.prototype.info = function() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), config: { maxAttempts: this.maxAttempts, windowMs: this.windowMs, lockoutMs: this.lockoutMs, ipTracking: this.ipTrackingEnabled, ipMaxAttempts: this.ipMaxAttempts }, status: this.getStatus(), trackedIPs: Object.keys(this._ipData.attempts).length, lockedIPs: Object.keys(this._ipData.locked).length, timestamp: Date.now() }; };

RateLimiter.prototype.healthCheck = function() { const logger = _getPort('logger'); const checks = { notPermanentlyLocked: !this.lockedUntil || Date.now() >= this.lockedUntil, lowAttemptCount: this.attempts.length < this.maxAttempts, noBackendBlock: !this.backendRetryAfter || Date.now() >= this.backendRetryAfter, ipTrackingHealthy: Object.keys(this._ipData.locked).length < 100, loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; const status = passed === 6 ? 'HEALTHY' : (passed >= 4 ? 'DEGRADED' : 'UNHEALTHY'); return { status, score: `${passed}/6`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; };

export default RateLimiter;
export { VERSION, MODULE_ID };
