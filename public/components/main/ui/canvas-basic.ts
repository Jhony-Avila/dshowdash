// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-AAA-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: canvas-basic
// PURPOSE: CanvasBasic - Canvas Básico
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createCanvas() — exported function
//   updateCanvas() — exported function
//   destroyCanvas() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   createCanvasBasic() — exported function
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

export const VERSION = '2.1.0-AAA-P4';
export const MODULE_ID = 'canvas-basic';

let _metrics = { renders: 0, updates: 0, errors: 0 };

export function createCanvas(container: HTMLElement | null, options: Record<string, unknown> = {}) {
  try {
    const canvas = document.createElement('div');
    canvas.className = 'main-canvas main-canvas--basic';
    canvas.setAttribute('data-canvas-id', String(options.id || 'basic'));
    container?.appendChild(canvas);
    _metrics.renders++;
    return canvas;
  } catch (error) { _metrics.errors++; return null; }
}

export function updateCanvas(canvas: HTMLElement | null, content: string) {
  try { if (canvas) { canvas.innerHTML = content; _metrics.updates++; return true; } return false; } catch (error) { _metrics.errors++; return false; }
}

export function destroyCanvas(canvas: HTMLElement | null) {
  try { canvas?.remove(); return true; } catch (error) { _metrics.errors++; return false; }
}

export function getMetrics() { return { ..._metrics }; }

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, metrics: getMetrics() };
}

export function createCanvasBasic(container: HTMLElement | null, options: Record<string, unknown> = {}) {
  const canvas = createCanvas(container, options);
  return {
    VERSION, MODULE_ID,
    element: canvas,
    update(content: string) { return updateCanvas(canvas, content); },
    destroy() { return destroyCanvas(canvas); },
    getElement() { return canvas; },
    getMetrics() { return getMetrics(); },
    healthCheck() { return healthCheck(); }
  };
}

export default { createCanvas, updateCanvas, destroyCanvas, createCanvasBasic, getMetrics, healthCheck, VERSION, MODULE_ID };
