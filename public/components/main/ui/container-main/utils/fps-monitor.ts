// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-WARMUP-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: fps-monitor
// PURPOSE: FPS Monitor Utility
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   start() — exported function
//   stop() — exported function
//   getCurrentFPS() — exported function
//   getHistory() — exported function
//   clearHistory() — exported function
//   isRunning() — exported function
//   getJankCount() — exported function
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
//   visibilitychange (document)
// WINDOW ACCESS:
//   document.addEventListener (visibilitychange)
//   document.hidden
//
// @changelog
//   1.3.0-WARMUP-FIX: Fixed warmup leak — _fps was set BEFORE warmup check,
//     causing getCurrentFPS() to return false low values (1-10) for 3 seconds
//     after tab-switch. Now _fps is only updated with validated (post-warmup)
//     samples. Also reset _consecutiveLowFps on warmup to prevent false jank.
//   1.2.0-VISIBILITY-AWARE: Page Visibility API integration.
//     Pauses RAF loop when tab is hidden to prevent false low-FPS readings.
//     Discards first 3 samples after tab becomes visible (warm-up period).
//     Fixes false CRITICAL alerts (FPS 8-11) caused by browser RAF throttling
//     in background tabs.
//   1.1.0-ENTERPRISE: Jank threshold 30 -> 20, consecutive low readings filter
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.3.0-WARMUP-FIX';
export const MODULE_ID = 'fps-monitor';

let _isRunning = false;
let _rafId: unknown = null;
let _lastTime = 0;
let _frames = 0;
let _fps = 0;
let _fpsHistory: unknown[] = [];
let _maxHistory = 60;
let _callbacks = new Set();
let _jankThreshold = 20;
let _jankCount = 0;
let _consecutiveLowFps = 0;

// v1.2.0: Page Visibility tracking
let _isTabHidden = false;
let _warmupSamplesRemaining = 0;
const _WARMUP_SAMPLES = 3; // Discard first 3 samples after tab becomes visible
let _visibilityHandler: (() => void) | null = null;

function _onVisibilityChange() {
  if (document.hidden) {
    // Tab going to background — pause RAF loop, don't measure
    _isTabHidden = true;
    if (_rafId) {
      cancelAnimationFrame((_rafId as number));
      _rafId = null;
    }
  } else {
    // Tab coming back — restart with warmup period
    _isTabHidden = false;
    _warmupSamplesRemaining = _WARMUP_SAMPLES;
    _consecutiveLowFps = 0; // v1.3.0: Reset jank counter on tab-return
    if (_isRunning) {
      _frames = 0;
      _lastTime = performance.now();
      _rafId = requestAnimationFrame(_loop);
    }
  }
}

function _loop(timestamp: number) {
  if (!_isRunning || _isTabHidden) return;

  _frames++;

  if (timestamp - _lastTime >= 1000) {
    const measuredFps = Math.round(_frames * 1000 / (timestamp - _lastTime));

    // v1.3.0-WARMUP-FIX: During warmup after tab-return, discard sample entirely.
    // Do NOT update _fps — prevents getCurrentFPS() from returning false low values.
    if (_warmupSamplesRemaining > 0) {
      _warmupSamplesRemaining--;
      _frames = 0;
      _lastTime = timestamp;
      _rafId = requestAnimationFrame(_loop);
      return;
    }

    // v1.3.0: Only update _fps with validated (post-warmup) samples
    _fps = measuredFps;

    _fpsHistory.push({ timestamp: Date.now(), fps: _fps });

    if (_fpsHistory.length > _maxHistory) {
      _fpsHistory.shift();
    }

    // v1.1.0: Only count as jank if FPS is consistently low (not just one spike)
    // and FPS > 0 (0 means tab in background or modal blocking)
    if (_fps > 0 && _fps < _jankThreshold) {
      _consecutiveLowFps++;
      if (_consecutiveLowFps >= 3) { // 3 consecutive low readings = real jank
        _jankCount++;
      }
    } else {
      _consecutiveLowFps = 0;
    }


    // @ts-expect-error TS migration - TS2349
    _callbacks.forEach(cb => cb(_fps));

    _frames = 0;
    _lastTime = timestamp;
  }

  _rafId = requestAnimationFrame(_loop);
}

export function start(options: Record<string, unknown> = {}) {
  if (_isRunning) return;

  _maxHistory = (options.maxHistory as number) || 60;
  _jankThreshold = (options.jankThreshold as number) || 20;

  _isRunning = true;
  _isTabHidden = document.hidden;
  _warmupSamplesRemaining = 0;
  _lastTime = performance.now();
  _frames = 0;
  _consecutiveLowFps = 0;

  // v1.2.0: Register visibility listener
  if (!_visibilityHandler) {
    _visibilityHandler = _onVisibilityChange;
    document.addEventListener('visibilitychange', _visibilityHandler);
  }

  // Only start RAF if tab is visible
  if (!_isTabHidden) {
    _rafId = requestAnimationFrame(_loop);
  }
}

export function stop() {
  _isRunning = false;
  if (_rafId) cancelAnimationFrame((_rafId as number));
  _rafId = null;
}

export function getCurrentFPS() { return _fps; }
export function getHistory() { return [..._fpsHistory]; }
export function clearHistory() { _fpsHistory = []; _jankCount = 0; _consecutiveLowFps = 0; }
export function isRunning() { return _isRunning; }
export function getJankCount() { return _jankCount; }

export function subscribe(callback: (...args: unknown[]) => void) {
  _callbacks.add(callback);
  return () => _callbacks.delete(callback);
}

export function getStats() {
  if (_fpsHistory.length === 0) return null;

  // v1.1.0: Filter out 0 FPS readings (background/modal)
  const values = _fpsHistory.map(h => (h as Record<string, unknown>).fps).filter(f => (f as number) > 0);
  if (values.length === 0) return { current: _fps, min: 0, max: 0, avg: 0, samples: 0, jankCount: 0, jankPercent: 0 };

  return {
    current: _fps,
    // @ts-expect-error TS migration - TS2345
    min: Math.min(...values),
    // @ts-expect-error TS migration - TS2345
    max: Math.max(...values),
    // @ts-expect-error TS migration - TS2349, TS7006
    avg: Math.round((values.reduce as unknown as number)((a, b) => a + b, 0) / values.length),
    samples: values.length,
    jankCount: _jankCount,
    jankPercent: values.length > 0 ? Math.round(_jankCount / values.length * 100) : 0
  };
}

export function info() {
  return {
    moduleId: MODULE_ID, version: VERSION, isRunning: _isRunning,
    currentFPS: _fps, historyLength: _fpsHistory.length,
    isTabHidden: _isTabHidden, warmupRemaining: _warmupSamplesRemaining
  };
}

export function healthCheck() {
  // v1.2.0: If tab is hidden, report PAUSED instead of CRITICAL
  const status = !_isRunning ? 'NOT_RUNNING' :
                 _isTabHidden ? 'PAUSED' :
                 (_fps > 0 && _fps < 10) ? 'CRITICAL' :
                 (_fps > 0 && _fps < _jankThreshold) ? 'WARNING' :
                 'HEALTHY';
  return { status, version: VERSION, moduleId: MODULE_ID, isRunning: _isRunning, currentFPS: _fps, jankCount: _jankCount, isTabHidden: _isTabHidden };
}

export function destroy() {
  stop();
  // v1.2.0: Cleanup visibility listener
  if (_visibilityHandler) {
    document.removeEventListener('visibilitychange', _visibilityHandler);
    _visibilityHandler = null;
  }
  _fpsHistory = [];
  _callbacks.clear();
  _jankCount = 0;
  _consecutiveLowFps = 0;
  _isTabHidden = false;
  _warmupSamplesRemaining = 0;
}

export default { start, stop, getCurrentFPS, getHistory, clearHistory, isRunning, getJankCount, subscribe, getStats, info, healthCheck, destroy, VERSION, MODULE_ID };
