// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.0.0-UNIFIED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-globalstate-v2
// PURPOSE: GlobalStateControllerV2 - Slice Layer Virtual AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MAIN_EVENTS from /core/runtime/events/catalog/main.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createGlobalStateControllerV2() — exported function
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
export const MODULE_ID = 'main-globalstate-v2';

export class GlobalStateControllerV2 {
  [key: string]: any;
  constructor(context: Record<string, any> = {}) {
    this._statePort = context.ports?.state || null;
    this._events = context.ports?.events || null;
    this._telemetry = context.ports?.telemetry || null;
    this._slices = new Map();
    this._subscribers = new Map();
    this._metrics = { slicesCreated: 0, dispatches: 0 };
  }

  createSlice(name: string, initialState: Record<string, unknown> = {}, reducers: Record<string, unknown> = {}) {
    if (this._slices.has(name)) return this._slices.get(name);
    const slice = { name, state: { ...initialState }, reducers, createdAt: Date.now() };
    this._slices.set(name, slice);
    this._subscribers.set(name, new Set());
    this._metrics.slicesCreated++;
    this._telemetry?.track?.(MAIN_EVENTS.GLOBALSTATE_SLICE_CREATED, { name });
    this._emit(MAIN_EVENTS.GLOBALSTATE_SLICE_CREATED, { name });
    return {
      getState: () => ({ ...slice.state }),
      dispatch: (action: Record<string, unknown>) => this._dispatchToSlice(name, action),
      subscribe: (handler: (...args: unknown[]) => void) => this._subscribeToSlice(name, handler)
    };
  }

  _dispatchToSlice(sliceName: string, action: Record<string, unknown>) {
    const slice = this._slices.get(sliceName);
    if (!slice) return;
    const reducer = (slice.reducers as Record<string, (state: Record<string, unknown>, action: Record<string, unknown>) => Record<string, unknown>>)[action.type as string];
    if (reducer) {
      const prevState = { ...slice.state };
      slice.state = reducer(slice.state, action);
      this._notifySubscribers(sliceName, slice.state, prevState);
      this._metrics.dispatches++;
      this._telemetry?.track?.(MAIN_EVENTS.GLOBALSTATE_DISPATCH, { slice: sliceName, action: action.type });
    }
  }

  _subscribeToSlice(sliceName: string, handler: (...args: unknown[]) => void) {
    const subscribers = this._subscribers.get(sliceName);
    if (!subscribers || typeof handler !== 'function') return () => {};
    subscribers.add(handler);
    return () => subscribers.delete(handler);
  }

  _notifySubscribers(sliceName: string, newState: unknown, prevState: unknown) {
    const subscribers = this._subscribers.get(sliceName);
    if (!subscribers) return;
    subscribers.forEach((handler: (...args: unknown[]) => void) => {
      try { handler(newState, prevState); } catch(e) {}
    });
  }

  select(selectorFn: unknown) {
    if (typeof selectorFn !== 'function') return null;
    const allState: Record<string, unknown> = {};
    this._slices.forEach((slice: Record<string, unknown>, name: string) => { allState[name] = { ...(slice.state as Record<string, unknown>) }; });
    const legacyState = this._statePort?.getState?.() || {};
    return selectorFn({ ...legacyState, slices: allState });
  }

  dispatch(action: Record<string, unknown>) {
    if (action?.slice) this._dispatchToSlice(action.slice as string, action);
  }

  subscribe(selector: string, handler: (...args: unknown[]) => void) {
    if (typeof selector === 'string') return this._subscribeToSlice(selector, handler);
    return () => {};
  }

  getSlice(name: string) { return this._slices.get(name) || null; }
  getAllSlices() { return Array.from(this._slices.keys()); }
  getMetrics() { return { ...this._metrics }; }

  syncWithLegacy(key: string, sliceName: string) {
    if (!this._statePort) return;
    const legacyValue = this._statePort.get?.(key);
    const slice = this._slices.get(sliceName);
    if (slice && legacyValue !== undefined) slice.state = { ...slice.state, [key]: legacyValue };
  }

  _emit(event: string, data: Record<string, unknown> = {}) { this._events?.emit?.(event, data); }

  info() {
    return {
      version: VERSION,
      moduleId: MODULE_ID,
      sliceCount: this._slices.size,
      slices: this.getAllSlices(),
      metrics: this.getMetrics()
    };
  }

  healthCheck() {
    const hasStatePort = !!this._statePort;
    const hasEvents = !!this._events;

    // @ts-expect-error TS migration - TS2339
    const subscriberCount = Array.from(this._subscribers.values()).reduce((acc, set) => acc + set.size, 0);

    let status = 'HEALTHY';
    if (!hasStatePort && this._slices.size === 0) status = 'DEGRADED';

    return {
      status,
      version: VERSION,
      moduleId: MODULE_ID,
      checks: {
        hasStatePort,
        hasEvents,
        hasTelemetry: !!this._telemetry,
        sliceCount: this._slices.size,
        subscriberCount
      },
      metrics: this.getMetrics()
    };
  }
}

export function createGlobalStateControllerV2(context: Record<string, unknown>) { return new GlobalStateControllerV2(context); }
export default { GlobalStateControllerV2, createGlobalStateControllerV2, VERSION, MODULE_ID };
