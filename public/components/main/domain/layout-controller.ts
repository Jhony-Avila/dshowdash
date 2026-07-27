// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.0.0-UNIFIED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-layout-controller
// PURPOSE: LayoutController - Controle de Layout Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONTAINER_EVENTS from /core/runtime/events/catalog/container.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createLayoutController() — exported function
//   LAYOUT_TYPES — exported value
//   STATE_SYNC_EVENT — exported value
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

import { CONTAINER_EVENTS } from '/core/runtime/events/catalog/container.events.js';

export const VERSION = '8.0.0-UNIFIED';
export const MODULE_ID = 'main-layout-controller';

// P5: State sync event for ContainerMain UI
const STATE_SYNC_EVENT = 'main.state.sync';

const LAYOUT_TYPES: Record<string, string> = {
  DEFAULT: 'default',
  COMPACT: 'compact',
  FULL: 'full',
  CANVAS: 'canvas',
  MINIMAL: 'minimal'
};

export class LayoutController {
  [key: string]: any;
  constructor(context: Record<string, any> = {}) {
    this._events = context.ports?.events || null;
    this._statePort = context.ports?.state || null;
    this._telemetry = context.ports?.telemetry || null;
    this._uiPort = context.ports?.ui || null;
    this._currentLayout = LAYOUT_TYPES.DEFAULT;
    this._compactMode = false;
    this._splitMode = false;
    this._secondaryContainers = [];
    this._metrics = { layoutChanges: 0, compactToggles: 0, stateSyncs: 0 };
  }

  // P5: Emit full state sync for ContainerMain UI
  _emitStateSync(trigger = 'unknown') {
    this._metrics.stateSyncs++;
    const stateSnapshot = {
      container: {
        containerId: 'container-main',
        mounted: true,
        focused: true,
        loading: false,
        error: null as string | null
      },
      layout: {
        mode: this._currentLayout,
        compactMode: this._compactMode,
        split: this._splitMode,
        secondaryContainers: [...this._secondaryContainers]
      },
      timestamp: Date.now(),
      trigger,
      source: MODULE_ID
    };
    this._emit(STATE_SYNC_EVENT, stateSnapshot);
    this._telemetry?.track?.('layout:state-sync', { layout: this._currentLayout, trigger });
    return stateSnapshot;
  }

  applyLayout(layoutType: string) {
    const type = LAYOUT_TYPES[layoutType?.toUpperCase?.()] || layoutType || LAYOUT_TYPES.DEFAULT;
    if (type === this._currentLayout) return this._currentLayout;
    const prevLayout = this._currentLayout;
    this._currentLayout = type;
    this._applyLayoutToUI();
    this._metrics.layoutChanges++;
    this._telemetry?.track?.('layout:applied', { from: prevLayout, to: type });
    this._emit(CONTAINER_EVENTS.LAYOUT_CHANGED, { from: prevLayout, to: type });
    this._emit(CONTAINER_EVENTS.LAYOUT_UPDATED, { layout: type });
    // P5: Emit state sync after layout change
    this._emitStateSync('layout-change');
    return type;
  }

  setCompactMode(enabled: unknown) {
    this._compactMode = !!enabled;
    this._applyLayoutToUI();
    this._metrics.compactToggles++;
    this._telemetry?.track?.('layout:compact', { enabled: this._compactMode });
    this._emit(CONTAINER_EVENTS.LAYOUT_CHANGED, { compactMode: this._compactMode });
    // P5: Emit state sync after compact mode change
    this._emitStateSync('compact-mode');
  }

  setSplitMode(enabled: unknown, secondaryContainers: string[] = []) {
    this._splitMode = !!enabled;
    this._secondaryContainers = secondaryContainers;
    this._applyLayoutToUI();
    this._telemetry?.track?.('layout:split', { enabled: this._splitMode, secondaryCount: secondaryContainers.length });
    this._emit(CONTAINER_EVENTS.LAYOUT_CHANGED, { splitMode: this._splitMode, secondaryContainers });
    // P5: Emit state sync after split mode change
    this._emitStateSync('split-mode');
  }

  syncFromStatePort() {
    if (!this._statePort) return;
    const theme = this._statePort.get?.('theme') || {};
    const prefs = this._statePort.get?.('preferences') || {};
    if (prefs.compactMode !== undefined) this._compactMode = prefs.compactMode;
    if (theme.layout) this.applyLayout(theme.layout);
    // P5: Emit initial state sync after loading from state port
    this._emitStateSync('state-port-sync');
  }

  // P5: Force emit current state (useful for newly mounted UI)
  forceStateSync() {
    return this._emitStateSync('forced');
  }

  _applyLayoutToUI() {
    if (!this._uiPort?.applyLayoutState) return;
    this._uiPort.applyLayoutState({ 
      layoutClass: this._currentLayout, 
      compactMode: this._compactMode,
      splitMode: this._splitMode,
      secondaryContainers: this._secondaryContainers
    });
  }

  getCurrentLayout() { return this._currentLayout; }
  isCompactMode() { return this._compactMode; }
  isSplitMode() { return this._splitMode; }
  getSecondaryContainers() { return [...this._secondaryContainers]; }
  getMetrics() { return { ...this._metrics }; }
  resolveLayoutFromManifest(metadata: Record<string, unknown>) { return metadata?.layout || metadata?.layoutOverride || LAYOUT_TYPES.DEFAULT; }
  _emit(event: string, data: Record<string, unknown> = {}) { this._events?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() }); }

  // P5: Get current state snapshot
  getStateSnapshot() {
    return {
      layout: {
        mode: this._currentLayout,
        compactMode: this._compactMode,
        split: this._splitMode,
        secondaryContainers: [...this._secondaryContainers]
      },
      metrics: this.getMetrics()
    };
  }

  info() { 
    return { 
      version: VERSION, 
      moduleId: MODULE_ID, 
      currentLayout: this._currentLayout, 
      compactMode: this._compactMode, 
      splitMode: this._splitMode,
      secondaryContainersCount: this._secondaryContainers.length,
      layoutTypes: LAYOUT_TYPES, 
      metrics: this.getMetrics(),
      p5Compliant: true,
      stateSyncEvent: STATE_SYNC_EVENT
    }; 
  }

  healthCheck() {
    const hasUIPort = !!this._uiPort;
    const hasEvents = !!this._events;
    const validLayout = Object.values(LAYOUT_TYPES).includes(this._currentLayout);
    let status = 'HEALTHY';
    if (!hasUIPort) status = 'DEGRADED';
    if (!validLayout) status = 'UNHEALTHY';
    return { 
      status, 
      version: VERSION, 
      moduleId: MODULE_ID, 
      checks: { 
        hasUIPort, 
        hasEvents, 
        hasStatePort: !!this._statePort, 
        hasTelemetry: !!this._telemetry, 
        validLayout, 
        currentLayout: this._currentLayout 
      }, 
      metrics: this.getMetrics(),
      p5Compliant: true
    };
  }
}

export function createLayoutController(context: Record<string, unknown>) { return new LayoutController(context); }
export { LAYOUT_TYPES, STATE_SYNC_EVENT };
export default { LayoutController, createLayoutController, LAYOUT_TYPES, STATE_SYNC_EVENT, VERSION, MODULE_ID };
