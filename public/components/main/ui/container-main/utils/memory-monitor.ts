// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-LOGGER-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: memory-monitor
// PURPOSE: Memory Monitor Utility
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   start() — exported function
//   stop() — exported function
//   getCurrentMemory() — exported function
//   getSamples() — exported function
//   getLastSample() — exported function
//   clearSamples() — exported function
//   isRunning() — exported function
//   detectLeak() — exported function
//   subscribe() — exported function
//   getStats() — exported function
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

import { createLogger } from './logger.js';

export const VERSION = '1.2.0-LOGGER-INTEGRATED';
export const MODULE_ID = 'memory-monitor';

const logger = createLogger(MODULE_ID);

let _isRunning = false;
let _intervalId: ReturnType<typeof setInterval> | null = null;
let _samples: unknown[] = [];
let _maxSamples = 60;
let _sampleInterval = 5000;
let _callbacks = new Set();
let _warningThreshold = 500;
let _criticalThreshold = 1000;

function _getMemoryInfo() {
  if (!(performance as any).memory) {
    return { supported: false, usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 };
  }
  
  return {
    supported: true,
    usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
    totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
    jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
    usedMB: Math.round((performance as any).memory.usedJSHeapSize / 1048576 * 100) / 100,
    totalMB: Math.round((performance as any).memory.totalJSHeapSize / 1048576 * 100) / 100,
    limitMB: Math.round((performance as any).memory.jsHeapSizeLimit / 1048576 * 100) / 100,
    usagePercent: Math.round((performance as any).memory.usedJSHeapSize / (performance as any).memory.jsHeapSizeLimit * 100)
  };
}

function _collectSample() {
  const sample = { timestamp: Date.now(), ..._getMemoryInfo() };
  _samples.push(sample);
  
  if (_samples.length > _maxSamples) {
    _samples.shift();
  }
  
  // @ts-expect-error strict migration — TS18048
  if (sample.usedMB >= _criticalThreshold) {
    _notify('critical', sample);
  // @ts-expect-error strict migration — TS18048
  } else if (sample.usedMB >= _warningThreshold) {
    _notify('warning', sample);
  }
  

  // @ts-expect-error TS migration - TS2349
  _callbacks.forEach(cb => cb(sample));
  
  return sample;
}

let _lastNotifyLevel: unknown = null;
let _notifyCount = 0;

function _notify(level: string, sample: Record<string, unknown>) {
  _notifyCount++;
  if (level !== _lastNotifyLevel || _notifyCount >= 12) {
    logger.warn(`Memory ${level}`, { usedMB: sample.usedMB, usagePercent: sample.usagePercent });
    _lastNotifyLevel = level;
    _notifyCount = 0;
  }
}

function _detectLeak() {
  if (_samples.length < 20) return { detected: false, reason: 'Insufficient samples' };
  
  const recentSamples = _samples.slice(-20);
  const firstHalf = recentSamples.slice(0, 10);
  const secondHalf = recentSamples.slice(10);
  
  // @ts-expect-error TS migration - TS2349, TS7006
  const avgFirst = (firstHalf.reduce as unknown as number)((a, s) => a + s.usedJSHeapSize, 0) / firstHalf.length;
  // @ts-expect-error TS migration - TS2349, TS7006
  const avgSecond = (secondHalf.reduce as unknown as number)((a, s) => a + s.usedJSHeapSize, 0) / secondHalf.length;
  
  if (avgFirst === 0) return { detected: false, growthRate: 0, reason: 'No memory data' };
  
  const growthRate = (avgSecond - avgFirst) / avgFirst;
  const growthPercent = Math.round(growthRate * 100);
  
  if (growthRate > 0.5 && avgSecond > 200 * 1048576) {
    return { detected: true, growthRate: growthPercent, reason: 'Consistent memory growth detected' };
  }
  
  return { detected: false, growthRate: growthPercent, reason: 'Memory stable' };
}

export function start(options: Record<string, unknown> = {}) {
  if (_isRunning) return;
  
  _sampleInterval = (options.interval as number) || 5000;
  _maxSamples = (options.maxSamples as number) || 60;
  _warningThreshold = (options.warningThreshold as number) || 500;
  _criticalThreshold = (options.criticalThreshold as number) || 1000;
  
  _collectSample();
  _intervalId = setInterval(_collectSample, _sampleInterval);
  _isRunning = true;
}

export function stop() {
  if (_intervalId) clearInterval(_intervalId);
  _intervalId = null;
  _isRunning = false;
}

export function getCurrentMemory() { return _getMemoryInfo(); }
export function getSamples() { return [..._samples]; }
export function getLastSample() { return _samples[_samples.length - 1] || null; }
export function clearSamples() { _samples = []; }
export function isRunning() { return _isRunning; }
export function detectLeak() { return _detectLeak(); }

export function subscribe(callback: (...args: unknown[]) => void) {
  _callbacks.add(callback);
  return () => _callbacks.delete(callback);
}

export function getStats() {
  if (_samples.length === 0) return null;
  
  const usedValues = _samples.map(s => (s as Record<string, unknown>).usedMB).filter(v => (v as number) > 0);
  if (usedValues.length === 0) return null;
  
  return {
    current: usedValues[usedValues.length - 1],
    // @ts-expect-error TS migration - TS2345
    min: Math.min(...usedValues),
    // @ts-expect-error TS migration - TS2345
    max: Math.max(...usedValues),
    // @ts-expect-error TS migration - TS2349, TS7006
    avg: Math.round((usedValues.reduce as unknown as number)((a, b) => a + b, 0) / usedValues.length * 100) / 100,
    samples: usedValues.length,
    leak: _detectLeak()
  };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, isRunning: _isRunning, samplesCount: _samples.length, memorySupported: !!(performance as any).memory };
}

export function healthCheck() {
  const mem = _getMemoryInfo();
  // @ts-expect-error strict migration — TS18048
  const status = !mem.supported ? 'UNSUPPORTED' : mem.usedMB >= _criticalThreshold ? 'CRITICAL' : mem.usedMB >= _warningThreshold ? 'WARNING' : 'HEALTHY';
  return { status, version: VERSION, moduleId: MODULE_ID, isRunning: _isRunning, currentMemoryMB: mem.usedMB, leak: _detectLeak() };
}

export function destroy() {
  stop();
  _samples = [];
  _callbacks.clear();
  _lastNotifyLevel = null;
  _notifyCount = 0;
}

export default { start, stop, getCurrentMemory, getSamples, getLastSample, clearSamples, isRunning, detectLeak, subscribe, getStats, info, healthCheck, destroy, VERSION, MODULE_ID };
