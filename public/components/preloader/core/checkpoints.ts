// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: boot-checkpoints
// PURPOSE: Boot Checkpoint System
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   startBoot() — exported function
//   checkpoint() — exported function
//   completeBoot() — exported function
//   failBoot() — exported function
//   canResume() — exported function
//   getResumePoint() — exported function
//   resumeBoot() — exported function
//   clearResume() — exported function
//   getCurrentBoot() — exported function
//   getBoot() — exported function
//   getLastIncompleteBoot() — exported function
//   getCheckpoint() — exported function
//   getAllCheckpoints() — exported function
//   getHistory() — exported function
//   loadFromStorage() — exported function
//   clearStorage() — exported function
//   cleanup() — exported function
//   getStatus() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.2.0-P17WI';
export const MODULE_ID = 'boot-checkpoints';

const hasWindow = typeof window !== 'undefined';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _log(level: 'error' | 'warn' | 'info' | 'debug', msg: string, ctx?: Record<string, unknown>) {
  const logger = _getPort('logger');
  if (!logger) return;
  ctx = ctx || {};
  ctx.component = MODULE_ID;
  if (level === 'warn') { if (logger.warn) logger.warn(msg, ctx); return; }
  if (level === 'info') { if (logger.info) logger.info(msg, ctx); return; }
  if (logger.debug) logger.debug(msg, ctx);
}

const _config = { enabled: true, persistToStorage: true, storageKey: 'boot_checkpoints', maxCheckpoints: 20, ttlMs: 3600000, autoCleanup: true };
const _checkpoints = new Map();
let _currentBootId: string | null = null;
let _currentCheckpoint: string | null = null;

export function startBoot(bootId?: string) {
  _initPorts();
  _currentBootId = bootId || (`boot_${Date.now()}`);
  _currentCheckpoint = null;
  const bootData: Record<string, any> = { bootId: _currentBootId, startedAt: Date.now(), checkpoints: [] as Record<string, any>[], status: 'in_progress', lastCheckpoint: null as string | null, metadata: {} };
  _checkpoints.set(_currentBootId, bootData);
  _saveToStorage();
  _log('info', 'Boot started', { bootId: _currentBootId });
  return _currentBootId;
}

export function checkpoint(name: string, data?: Record<string, unknown>) {
  if (!_currentBootId) { _log('warn', 'No active boot for checkpoint'); return null; }
  const bootData = _checkpoints.get(_currentBootId);
  if (!bootData) return null;
  const cp = { name, timestamp: Date.now(), duration: bootData.checkpoints.length > 0 ? Date.now() - bootData.checkpoints[bootData.checkpoints.length - 1].timestamp : Date.now() - bootData.startedAt, data: data || {}, index: bootData.checkpoints.length };
  bootData.checkpoints.push(cp);
  bootData.lastCheckpoint = name;
  _currentCheckpoint = name;
  _saveToStorage();
  _log('debug', 'Checkpoint reached', { bootId: _currentBootId, checkpoint: name });
  return cp;
}

export function completeBoot(metadata?: Record<string, unknown>) {
  if (!_currentBootId) return null;
  const bootData = _checkpoints.get(_currentBootId);
  if (!bootData) return null;
  bootData.status = 'completed';
  bootData.completedAt = Date.now();
  bootData.totalDuration = bootData.completedAt - bootData.startedAt;
  bootData.metadata = Object.assign({}, bootData.metadata, metadata || {});
  _saveToStorage();
  _log('info', 'Boot completed', { bootId: _currentBootId, duration: bootData.totalDuration });
  const result = Object.assign({}, bootData);
  _currentBootId = null;
  _currentCheckpoint = null;
  return result;
}

export function failBoot(error: unknown, metadata?: Record<string, unknown>) {
  if (!_currentBootId) return null;
  const bootData = _checkpoints.get(_currentBootId);
  if (!bootData) return null;
  bootData.status = 'failed';
  bootData.failedAt = Date.now();
  bootData.error = { message: error && (error as Error).message ? (error as Error).message : String(error), name: error ? (error as Error).name : undefined, stack: error ? (error as Error).stack : undefined };
  bootData.metadata = Object.assign({}, bootData.metadata, metadata || {});
  _saveToStorage();
  _log('warn', 'Boot failed', { bootId: _currentBootId, checkpoint: _currentCheckpoint, error: bootData.error.message });
  return Object.assign({}, bootData);
}

export function canResume() { const lastBoot = getLastIncompleteBoot(); return lastBoot !== null && lastBoot.checkpoints.length > 0; }

export function getResumePoint() {
  const lastBoot = getLastIncompleteBoot();
  if (!lastBoot) return null;
  return { bootId: lastBoot.bootId, checkpoint: lastBoot.lastCheckpoint, checkpointIndex: lastBoot.checkpoints.length - 1, data: lastBoot.checkpoints.length > 0 ? lastBoot.checkpoints[lastBoot.checkpoints.length - 1].data : {}, startedAt: lastBoot.startedAt, timeSinceFailed: Date.now() - (lastBoot.failedAt || lastBoot.startedAt) };
}

export function resumeBoot(bootId?: string) {
  const targetBoot = bootId ? _checkpoints.get(bootId) : getLastIncompleteBoot();
  if (!targetBoot) { _log('warn', 'No boot to resume'); return null; }
  _currentBootId = targetBoot.bootId;
  _currentCheckpoint = targetBoot.lastCheckpoint;
  targetBoot.status = 'resumed';
  targetBoot.resumedAt = Date.now();
  _saveToStorage();
  _log('info', 'Boot resumed', { bootId: _currentBootId, fromCheckpoint: _currentCheckpoint });
  return { bootId: _currentBootId, resumeFrom: _currentCheckpoint, checkpoints: targetBoot.checkpoints };
}

export function clearResume(bootId?: string) {
  const targetId = bootId || _currentBootId;
  if (targetId) { _checkpoints.delete(targetId); _saveToStorage(); }
}

export function getCurrentBoot() { return _currentBootId ? _checkpoints.get(_currentBootId) : null; }
export function getBoot(bootId: string) { return _checkpoints.get(bootId) || null; }

export function getLastIncompleteBoot() {
  const boots = Array.from(_checkpoints.values()).filter(b => b.status === 'failed' || b.status === 'in_progress').sort((a, b) => b.startedAt - a.startedAt);
  return boots[0] || null;
}

export function getCheckpoint(name: string) {
  const bootData = getCurrentBoot();
  if (!bootData) return null;
  return bootData.checkpoints.find((cp: Record<string, unknown>) => cp.name === name) || null;
}

export function getAllCheckpoints() { const bootData = getCurrentBoot(); return bootData ? bootData.checkpoints.slice() : []; }

export function getHistory(limit = 10) {
  return Array.from(_checkpoints.values()).sort((a, b) => b.startedAt - a.startedAt).slice(0, limit);
}

function _saveToStorage() {
  if (!_config.persistToStorage) return;
  if (typeof localStorage === 'undefined') return;
  try { const data = Array.from(_checkpoints.entries()); localStorage.setItem(_config.storageKey, JSON.stringify(data)); }
  catch (e: any) { _log('warn', 'Failed to save checkpoints', { error: e.message }); }
}

export function loadFromStorage() {
  if (typeof localStorage === 'undefined') return 0;
  try {
    const data = localStorage.getItem(_config.storageKey);
    if (!data) return 0;
    const entries = JSON.parse(data);
    entries.forEach((entry: [string, Record<string, any>]) => {
      const key = entry[0];
      const value = entry[1];
      if (_config.autoCleanup && Date.now() - value.startedAt > _config.ttlMs) return;
      _checkpoints.set(key, value);
    });
    return _checkpoints.size;
  } catch (e: any) { _log('warn', 'Failed to load checkpoints', { error: e.message }); return 0; }
}

export function clearStorage() {
  _checkpoints.clear();
  if (typeof localStorage !== 'undefined') { localStorage.removeItem(_config.storageKey); }
}

export function cleanup() {
  const now = Date.now();
  let cleaned = 0;
  _checkpoints.forEach((bootData, bootId) => {
    if (now - bootData.startedAt > _config.ttlMs) { _checkpoints.delete(bootId); cleaned++; return; }
    if (bootData.status === 'completed' && bootData.completedAt && now - bootData.completedAt > 3600000) { _checkpoints.delete(bootId); cleaned++; }
  });
  while (_checkpoints.size > _config.maxCheckpoints) {
    const oldest = Array.from(_checkpoints.entries()).sort((a, b) => a[1].startedAt - b[1].startedAt)[0];
    if (oldest) { _checkpoints.delete(oldest[0]); cleaned++; }
  }
  if (cleaned > 0) { _saveToStorage(); _log('debug', 'Checkpoints cleaned', { cleaned }); }
  return cleaned;
}

export function getStatus() { return { version: VERSION, moduleId: MODULE_ID, currentBootId: _currentBootId, currentCheckpoint: _currentCheckpoint, totalBoots: _checkpoints.size, canResume: canResume(), portsInitialized: Ports.isInitialized() }; }

export function healthCheck() { const checks = { storageWorking: _config.persistToStorage, hasLogger: !!_getPort('logger'), portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/3`, moduleId: MODULE_ID, version: VERSION, checks, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }

export function info() { return { version: VERSION, moduleId: MODULE_ID, features: ['checkpointing', 'resume-from-failure', 'persistence', 'auto-cleanup', 'history'], portsInitialized: Ports.isInitialized(), status: getStatus() }; }

if (typeof localStorage !== 'undefined') { loadFromStorage(); if (_config.autoCleanup) { cleanup(); } }

export default { VERSION, MODULE_ID, startBoot, checkpoint, completeBoot, failBoot, canResume, getResumePoint, resumeBoot, clearResume, getCurrentBoot, getBoot, getLastIncompleteBoot, getCheckpoint, getAllCheckpoints, getHistory, loadFromStorage, clearStorage, cleanup, getStatus, healthCheck, info, injectPorts, getPorts };
