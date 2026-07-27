// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-AAA-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: canvas-port
// PURPOSE: CanvasPort - Contrato de Canvas
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CanvasPortContract — exported value
//   createNullCanvasPort() — exported function
//   createCanvasPort() — exported function
//   validateCanvasPort() — exported function
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

export const VERSION = '2.1.0-AAA-P4';
export const MODULE_ID = 'canvas-port';

export const CanvasPortContract = { create: 'function', destroy: 'function', getActive: 'function' };

export function createNullCanvasPort() {
  return { create: (): null => null, destroy: (): void => {}, getActive: (): null => null };
}

export function createCanvasPort(deps: Record<string, unknown> = {}) {
  let _active: HTMLDivElement | null = null;
  let _metrics = { created: 0, destroyed: 0 };
  return {
    create(container: HTMLElement | null, options: Record<string, unknown> = {}) {
      try {
        const canvas = document.createElement('div');
        canvas.className = 'main-canvas';
        canvas.setAttribute('data-canvas-id', String(options.id || 'main'));
        container?.appendChild(canvas);
        _active = canvas;
        _metrics.created++;
        return canvas;
      } catch (e) { return null; }
    },
    destroy(canvas: HTMLElement | null) { try { (canvas || _active)?.remove(); _active = null; _metrics.destroyed++; return true; } catch (e) { return false; } },
    getActive() { return _active; },
    getMetrics() { return { ..._metrics }; }
  };
}

export function validateCanvasPort(port: Record<string, unknown> | null | undefined) { return port && typeof port.create === 'function'; }

export function healthCheck(port: Record<string, unknown> | null | undefined) {
  return { status: typeof port?.create === 'function' ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { hasCreate: typeof port?.create === 'function', hasDestroy: typeof port?.destroy === 'function' } };
}

export default { CanvasPortContract, createNullCanvasPort, createCanvasPort, validateCanvasPort, healthCheck, VERSION, MODULE_ID };
