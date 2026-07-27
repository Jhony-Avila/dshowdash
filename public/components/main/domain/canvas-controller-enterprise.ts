// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.0.0-UNIFIED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-canvas-enterprise
// PURPOSE: CanvasControllerEnterprise - Multi-Canvas Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MAIN_EVENTS from /core/runtime/events/catalog/main.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createCanvasControllerEnterprise() — exported function
//   CANVAS_MODES — exported value
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

import { MAIN_EVENTS } from '/core/runtime/events/catalog/main.events.js';

export const VERSION = '8.0.0-UNIFIED';
export const MODULE_ID = 'main-canvas-enterprise';

const CANVAS_MODES: Record<string, string> = { BASIC: 'basic', ENTERPRISE: 'enterprise', MULTI: 'multi' };

export class CanvasControllerEnterprise {
  [key: string]: any;
  constructor(context: Record<string, any> = {}) {
    this._events = context.ports?.events || null;
    this._telemetry = context.ports?.telemetry || null;
    this._domAdapter = context.adapters?.dom || null;
    this._uiPort = context.ports?.ui || null;
    this._canvases = new Map();
    this._mode = CANVAS_MODES.BASIC;
    this._initialized = false;
    this._metrics = { canvasesCreated: 0, canvasesDestroyed: 0 };
  }

  init() {
    if (this._initialized) return true;
    this._initialized = true;
    this._telemetry?.track?.(MAIN_EVENTS.CANVAS_INITIALIZED, { mode: this._mode });
    this._emit(MAIN_EVENTS.CANVAS_INITIALIZED, { mode: this._mode });
    return true;
  }

  createCanvas(id: string, options: Record<string, unknown> = {}) {
    if (this._canvases.has(id)) return this._canvases.get(id);
    const container = this._domAdapter?.selectMainContainer?.();
    if (!container) throw new Error('Canvas container not found');
    const canvasEl = this._uiPort?.createCanvasElement?.({ id, mode: options.mode || this._mode, className: 'main-canvas' });
    if (!canvasEl) throw new Error('Failed to create canvas element');
    const canvas = { id, element: canvasEl, attached: null as string | null, mode: options.mode || this._mode, createdAt: Date.now() };
    this._canvases.set(id, canvas);
    this._metrics.canvasesCreated++;
    this._telemetry?.track?.(MAIN_EVENTS.CANVAS_CREATED, { id, mode: canvas.mode });
    this._emit(MAIN_EVENTS.CANVAS_CREATED, { id, mode: canvas.mode });
    return canvas;
  }

  attachToContainer(canvasId: string, container: HTMLElement) {
    const canvas = this._canvases.get(canvasId);
    if (!canvas) return false;
    this._uiPort?.attachCanvas?.(container, canvas.element);
    return true;
  }

  attach(canvasId: string, panelInstance: Record<string, unknown>) {
    const canvas = this._canvases.get(canvasId);
    if (!canvas) throw new Error(`Canvas ${canvasId} not found`);
    canvas.attached = panelInstance;
    this._telemetry?.track?.(MAIN_EVENTS.CANVAS_ATTACHED, { canvasId, panel: panelInstance?.moduleId || 'unknown' });
    this._emit(MAIN_EVENTS.CANVAS_ATTACHED, { canvasId });
    return true;
  }

  resize(canvasId: string) {
    const canvas = this._canvases.get(canvasId);
    if (!canvas) return false;
    this._telemetry?.track?.(MAIN_EVENTS.CANVAS_RESIZED, { canvasId });
    this._emit(MAIN_EVENTS.CANVAS_RESIZED, { canvasId });
    return true;
  }

  destroyCanvas(canvasId: string) {
    const canvas = this._canvases.get(canvasId);
    if (!canvas) return false;
    this._uiPort?.removeElement?.(canvas.element);
    this._canvases.delete(canvasId);
    this._metrics.canvasesDestroyed++;
    this._telemetry?.track?.(MAIN_EVENTS.CANVAS_DESTROYED, { canvasId });
    this._emit(MAIN_EVENTS.CANVAS_DESTROYED, { canvasId });
    return true;
  }

  switchMode(mode: string) {
    const newMode = CANVAS_MODES[mode?.toUpperCase?.()] || mode || CANVAS_MODES.BASIC;
    if (newMode === this._mode) return;
    const prevMode = this._mode;
    this._mode = newMode;
    this._telemetry?.track?.(MAIN_EVENTS.CANVAS_MODE_CHANGED, { from: prevMode, to: newMode });
    this._emit(MAIN_EVENTS.CANVAS_MODE_CHANGED, { from: prevMode, to: newMode });
  }

  getCanvas(id: string) { return this._canvases.get(id) || null; }
  getAllCanvases() { return Array.from(this._canvases.values()); }
  getMode() { return this._mode; }
  getMetrics() { return { ...this._metrics }; }
  clear() { this._canvases.forEach((_: unknown, id: string) => this.destroyCanvas(id)); }
  _emit(event: string, data: Record<string, unknown> = {}) { this._events?.emit?.(event, data); }

  info() {
    return {
      version: VERSION,
      moduleId: MODULE_ID,
      initialized: this._initialized,
      mode: this._mode,
      canvasCount: this._canvases.size,
      canvases: Array.from(this._canvases.keys()),
      metrics: this.getMetrics()
    };
  }

  healthCheck() {
    const hasUIPort = !!this._uiPort;
    const hasDomAdapter = !!this._domAdapter;
    const validMode = Object.values(CANVAS_MODES).includes(this._mode);

    let status = 'HEALTHY';
    if (!hasDomAdapter) status = 'UNHEALTHY';
    else if (!hasUIPort || !this._initialized) status = 'DEGRADED';

    return {
      status,
      version: VERSION,
      moduleId: MODULE_ID,
      checks: {
        hasUIPort,
        hasDomAdapter,
        hasEvents: !!this._events,
        hasTelemetry: !!this._telemetry,
        initialized: this._initialized,
        validMode,
        canvasCount: this._canvases.size
      },
      metrics: this.getMetrics()
    };
  }
}

export function createCanvasControllerEnterprise(context: Record<string, unknown>) { return new CanvasControllerEnterprise(context); }
export { CANVAS_MODES };
export default { CanvasControllerEnterprise, createCanvasControllerEnterprise, CANVAS_MODES, VERSION, MODULE_ID };
