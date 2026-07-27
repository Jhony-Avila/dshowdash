// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin/scheduler
// PURPOSE: Panel Nav Admin Refresh Scheduler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   REFRESH_INTERVAL from ../core/constants.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   scheduler — exported value
//   start() — exported function
//   stop() — exported function
//   pause() — exported function
//   resume() — exported function
//   toggle() — exported function
//   refresh() — exported function
//   isPaused() — exported function
//   isRunning() — exported function
//   isRefreshing() — exported function
//   getCountdown() — exported function
//   getInterval() — exported function
//   setIntervalValue() — exported function
//   ... and 4 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { REFRESH_INTERVAL } from '../core/constants.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-nav-admin/scheduler';

const Ports = createUiPorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: unknown) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _debug = () => { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug === true; };
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; if (!_debug() && level === 'debug') return; const fn = logger[level] || logger.info; if (typeof fn === 'function') fn.apply(logger, ['[' + MODULE_ID + ']'].concat(args as string[])); };

let _countdownId: ReturnType<typeof setInterval> | null = null;
let _countdown = 0;
let _interval = REFRESH_INTERVAL;
let _onTick: ((countdown: number | null) => void) | null = null;
let _onRefresh: (() => Promise<unknown>) | null = null;
let _paused = false;
let _refreshing = false;

const start = (options: Record<string, unknown> = {}) => { stop(); _initPorts(); _interval = (options.interval as number) || REFRESH_INTERVAL; _onTick = (options.onTick as ((countdown: number | null) => void)) || null; _onRefresh = (options.onRefresh as (() => Promise<unknown>)) || null; _paused = false; _refreshing = false; const seconds = Math.floor(_interval / 1000); _countdown = seconds; if (_onTick) _onTick(_countdown); _countdownId = setInterval(() => { if (_paused || _refreshing) return; _countdown--; if (_onTick) _onTick(_countdown); if (_countdown <= 0) { _countdown = seconds; triggerRefresh(); } }, 1000); _log('info', 'Started: ' + seconds + 's interval'); };

// @ts-expect-error strict migration — TS2721
const triggerRefresh = () => { if (_refreshing) { _log('warn', 'Refresh already in progress, skipping'); return Promise.resolve(); } if (!_onRefresh) return Promise.resolve(); _refreshing = true; return Promise.resolve().then(() => _onRefresh()).catch(e => { _log('error', 'Refresh error:', e.message); }).then(() => { _refreshing = false; _countdown = Math.floor(_interval / 1000); if (_onTick) _onTick(_countdown); }); };

const refresh = () => { _countdown = Math.floor(_interval / 1000); if (_onTick) _onTick(_countdown); return triggerRefresh(); };

const pause = () => { _paused = true; if (_onTick) _onTick(null); _log('debug', 'Paused'); };
const resume = () => { _paused = false; if (_onTick) _onTick(_countdown); _log('debug', 'Resumed'); };
const isPaused = () => _paused;
const toggle = () => { if (_paused) resume(); else pause(); return !_paused; };

const stop = () => { if (_countdownId) { clearInterval(_countdownId); _countdownId = null; } _countdown = 0; _paused = false; _refreshing = false; _onTick = null; _onRefresh = null; _log('debug', 'Stopped'); };

const isRunning = () => _countdownId !== null;
const isRefreshing = () => _refreshing;
const getCountdown = () => _countdown;
const getInterval = () => _interval;
const setIntervalValue = (newInterval: number) => { _interval = newInterval; };

const healthCheck = () => { const portsSnapshot = Ports.snapshot(); const logger = _getPort('logger'); const checks: Record<string, boolean> = { running: _countdownId !== null, loggerReady: !!logger, portsInitialized: portsSnapshot._initialized }; let passed = 0; for (const k in checks) { if (checks[k]) passed++; } return { status: _countdownId !== null ? 'HEALTHY' : 'STOPPED', score: passed + '/3', checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; };

const info = () => { const portsSnapshot = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, running: _countdownId !== null, paused: _paused, refreshing: _refreshing, countdown: _countdown, interval: _interval, portsInitialized: portsSnapshot._initialized, healthCheck: healthCheck() }; };

const scheduler = { start, stop, pause, resume, toggle, refresh, isPaused, isRunning, isRefreshing, getCountdown, getInterval, setInterval: setIntervalValue, info, healthCheck, injectPorts, getPorts };

export { scheduler, start, stop, pause, resume, toggle, refresh, isPaused, isRunning, isRefreshing, getCountdown, getInterval, setIntervalValue, info, healthCheck, VERSION, MODULE_ID };
export default scheduler;
