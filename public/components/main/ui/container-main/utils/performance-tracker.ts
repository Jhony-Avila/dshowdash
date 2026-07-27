// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: performance-tracker
// PURPOSE: Performance Tracker Utility
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   start() — exported function
//   stop() — exported function
//   getSnapshot() — exported function
//   isHealthy() — exported function
//   subscribe() — exported function
//   isRunning() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   destroy() — exported function
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

import * as fpsMonitor from './fps-monitor.js';
import * as memoryMonitor from './memory-monitor.js';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'performance-tracker';

let _isRunning = false;
let _callbacks = new Set();
let _intervalId: ReturnType<typeof setInterval> | null = null;

export function start(options: Record<string, unknown> = {}) {
  if (_isRunning) return;
  
  fpsMonitor.start({ jankThreshold: options.fpsThreshold || 30 });
  memoryMonitor.start({ 
    warningThreshold: options.memoryWarning || 100, 
    criticalThreshold: options.memoryCritical || 200 
  });
  
  _intervalId = setInterval(() => {
    const snapshot = getSnapshot();

    // @ts-expect-error TS migration - TS2349
    _callbacks.forEach(cb => cb(snapshot));
  }, Number(options.reportInterval || 5000));
  
  _isRunning = true;
}

export function stop() {
  fpsMonitor.stop();
  memoryMonitor.stop();
  if (_intervalId) clearInterval(_intervalId);
  _intervalId = null;
  _isRunning = false;
}

export function getSnapshot() {
  return {
    timestamp: Date.now(),
    fps: fpsMonitor.getStats(),
    memory: memoryMonitor.getStats(),
    isHealthy: isHealthy()
  };
}

export function isHealthy() {
  const fpsHealth = fpsMonitor.healthCheck();
  const memHealth = memoryMonitor.healthCheck();
  return fpsHealth.status === 'HEALTHY' && (memHealth.status === 'HEALTHY' || memHealth.status === 'UNSUPPORTED');
}

export function subscribe(callback: (...args: unknown[]) => void) {
  _callbacks.add(callback);
  return () => _callbacks.delete(callback);
}

export function isRunning() { return _isRunning; }

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, isRunning: _isRunning, fps: fpsMonitor.info(), memory: memoryMonitor.info() };
}

export function healthCheck() {
  const fpsHealth = fpsMonitor.healthCheck();
  const memHealth = memoryMonitor.healthCheck();
  
  let status = 'HEALTHY';
  if (fpsHealth.status === 'CRITICAL' || memHealth.status === 'CRITICAL') status = 'CRITICAL';
  else if (fpsHealth.status === 'WARNING' || memHealth.status === 'WARNING') status = 'WARNING';
  else if (!_isRunning) status = 'NOT_RUNNING';
  
  return { status, version: VERSION, moduleId: MODULE_ID, isRunning: _isRunning, fps: fpsHealth, memory: memHealth };
}

export function destroy() {
  stop();
  fpsMonitor.destroy();
  memoryMonitor.destroy();
  _callbacks.clear();
}

export default { start, stop, getSnapshot, isHealthy, subscribe, isRunning, info, healthCheck, destroy, VERSION, MODULE_ID };
