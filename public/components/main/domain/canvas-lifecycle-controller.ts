// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.0.0-UNIFIED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: canvas-lifecycle-controller
// PURPOSE: CanvasLifecycleController - Ciclo de vida de Canvas
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   create() — exported function
//   destroy() — exported function
//   activate() — exported function
//   getActive() — exported function
//   get() — exported function
//   getAll() — exported function
//   clear() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
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

export const VERSION = '8.0.0-UNIFIED';
export const MODULE_ID = 'canvas-lifecycle-controller';

let _canvases = new Map();
let _activeCanvas: string | null = null;
let _metrics = { created: 0, destroyed: 0, activations: 0, errors: 0 };

export function create(canvasId: string, options: Record<string, unknown> = {}) {
  try {
    const canvas = { id: canvasId, ...options, createdAt: Date.now(), state: 'created' };
    _canvases.set(canvasId, canvas);
    _metrics.created++;
    return canvas;
  } catch (error) {
    _metrics.errors++;
    return null;
  }
}

export function destroy(canvasId: string) {
  const result = _canvases.delete(canvasId);
  if (result) {
    _metrics.destroyed++;
    if (_activeCanvas === canvasId) _activeCanvas = null;
  }
  return result;
}

export function activate(canvasId: string) {
  if (_canvases.has(canvasId)) {
    _activeCanvas = canvasId;
    _metrics.activations++;
    return true;
  }
  return false;
}

export function getActive() { return _activeCanvas; }
export function get(canvasId: string) { return _canvases.get(canvasId) || null; }
export function getAll() { return Object.fromEntries(_canvases); }
export function clear() { _canvases.clear(); _activeCanvas = null; }
export function getMetrics() { return { ..._metrics, count: _canvases.size, active: _activeCanvas }; }

export function healthCheck() {
  return {
    status: _metrics.errors === 0 ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { canvasCount: _canvases.size, hasActive: !!_activeCanvas, noErrors: _metrics.errors === 0 },
    metrics: getMetrics()
  };
}

export default { create, destroy, activate, getActive, get, getAll, clear, getMetrics, healthCheck, VERSION, MODULE_ID };
