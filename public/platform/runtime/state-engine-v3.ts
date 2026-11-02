// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: platform-state-engine-v3
// PURPOSE: State Engine V3
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION
//   MODULE_ID
//   init
//   createSlice
//   select
//   dispatch
//   destroySlice
//   getSlice
//   subscribeGlobal
//   getAllSlices
//   clear
//   info
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

import { STATE_EVENTS } from '/core/runtime/events/catalog/state.events.js';

interface EventBus {
  emit(event: string, data: Record<string, unknown>): void;
}

interface Action {
  type: string;
  slice?: string;
  [key: string]: unknown;
}

type Reducer = (state: Record<string, unknown>, action: Action) => Record<string, unknown>;
type SliceSubscriber = (newState: Record<string, unknown>, prevState: Record<string, unknown>) => void;
type GlobalSubscriber = (sliceName: string, newState: Record<string, unknown>, prevState: Record<string, unknown>) => void;

interface Slice {
  name: string;
  state: Record<string, unknown>;
  reducers: Record<string, Reducer>;
  createdAt: number;
}

const VERSION = '3.2.0-P2-ENTERPRISE';
const MODULE_ID = 'platform-state-engine-v3';

let _slices: Record<string, Slice> = {};
let _subscribers: Record<string, SliceSubscriber[]> = {};
let _globalSubscribers: GlobalSubscriber[] = [];
let _eventBus: EventBus | null = null;

function init(context: Record<string, unknown>) {
  if (!context) context = {};
  _eventBus = (context.eventBus as EventBus) || null;
  _emit(STATE_EVENTS.ENGINE_INIT, { version: VERSION });
  return { version: VERSION, moduleId: MODULE_ID };
}

function createSlice(name: string, initialState: Record<string, unknown>, reducers: Record<string, Reducer>) {
  if (!initialState) initialState = {};
  if (!reducers) reducers = {};
  if (_slices[name]) return getSlice(name);
  const slice: Slice = { name, state: Object.assign({}, initialState), reducers, createdAt: Date.now() };
  _slices[name] = slice;
  _subscribers[name] = [];
  _emit(STATE_EVENTS.SLICE_CREATED, { name });
  return {
    getState() { return Object.assign({}, slice.state); },
    dispatch(action: Action) { return dispatchToSlice(name, action); },
    subscribe(handler: SliceSubscriber) { return subscribeToSlice(name, handler); },
    destroy() { return destroySlice(name); }
  };
}

function dispatchToSlice(sliceName: string, action: Action) {
  const slice = _slices[sliceName];
  if (!slice) return null;
  const reducer = slice.reducers[action.type];
  if (!reducer) return slice.state;
  const prevState = Object.assign({}, slice.state);
  slice.state = reducer(slice.state, action);
  notifySubscribers(sliceName, slice.state, prevState);
  _emit(STATE_EVENTS.DISPATCH, { slice: sliceName, action: action.type });
  return slice.state;
}

function subscribeToSlice(sliceName: string, handler: SliceSubscriber) {
  const subs = _subscribers[sliceName];
  if (!subs || typeof handler !== 'function') return () => {};
  subs.push(handler);
  return () => {
    const idx = subs.indexOf(handler);
    if (idx !== -1) subs.splice(idx, 1);
  };
}

function notifySubscribers(sliceName: string, newState: Record<string, unknown>, prevState: Record<string, unknown>) {
  const subs = _subscribers[sliceName];
  if (subs) subs.forEach((fn: SliceSubscriber) => { try { fn(newState, prevState); } catch(e) {} });
  _globalSubscribers.forEach((fn: GlobalSubscriber) => { try { fn(sliceName, newState, prevState); } catch(e) {} });
}

function select(selectorFn: (allState: Record<string, Record<string, unknown>>) => unknown) {
  if (typeof selectorFn !== 'function') return null;
  const allState: Record<string, Record<string, unknown>> = {};
  Object.keys(_slices).forEach(name => { allState[name] = Object.assign({}, _slices[name].state); });
  return selectorFn(allState);
}

function dispatch(action: Action) {
  if (!action || !action.slice) return null;
  return dispatchToSlice(action.slice, action);
}

function destroySlice(name: string) {
  delete _slices[name];
  delete _subscribers[name];
  _emit(STATE_EVENTS.SLICE_DESTROYED, { name });
  return true;
}

function getSlice(name: string) {
  const slice = _slices[name];
  if (!slice) return null;
  return {
    getState() { return Object.assign({}, slice.state); },
    dispatch(action: Action) { return dispatchToSlice(name, action); },
    subscribe(handler: SliceSubscriber) { return subscribeToSlice(name, handler); },
    destroy() { return destroySlice(name); }
  };
}

function subscribeGlobal(handler: GlobalSubscriber) {
  if (typeof handler !== 'function') return () => {};
  _globalSubscribers.push(handler);
  return () => {
    const idx = _globalSubscribers.indexOf(handler);
    if (idx !== -1) _globalSubscribers.splice(idx, 1);
  };
}

function getAllSlices() { return Object.keys(_slices); }
function clear() { _slices = {}; _subscribers = {}; _globalSubscribers = []; }

function _emit(event: string, data: Record<string, unknown>) {
  if (!data) data = {};
  if (_eventBus && _eventBus.emit) _eventBus.emit(event, Object.assign({}, data, { source: MODULE_ID, timestamp: Date.now() }));
}

function info() {
  return { version: VERSION, moduleId: MODULE_ID, sliceCount: Object.keys(_slices).length, slices: getAllSlices() };
}

export { VERSION, MODULE_ID, init, createSlice, select, dispatch, destroySlice, getSlice, subscribeGlobal, getAllSlices, clear, info };
export default { VERSION, MODULE_ID, init, createSlice, select, dispatch, destroySlice, getSlice, subscribeGlobal, getAllSlices, clear, info };
