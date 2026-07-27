// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-enterprise/state/store
// PURPOSE: Panel Enterprise - Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getState() — exported function
//   get() — exported function
//   set() — exported function
//   setFeatures() — exported function
//   setActiveFeatures() — exported function
//   setSubscription() — exported function
//   isFeatureActive() — exported function
//   reset() — exported function
//   subscribe() — exported function
//   info() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-enterprise/state/store';

interface StoreState {
  mounted: boolean;
  loading: boolean;
  error: unknown;
  features: unknown[];
  activeFeatures: unknown[];
  subscription: unknown;
  lastUpdate: number | null;
  _initialized: boolean;
}

let _listeners: Array<(state: StoreState) => void> = [];
let _store: StoreState = {
  mounted: false,
  loading: false,
  error: null,
  features: [],
  activeFeatures: [],
  subscription: null,
  lastUpdate: null,
  _initialized: false
};

export const getState = () => ({ ..._store });
export const get = (key: keyof StoreState) => key ? _store[key] : getState();

export const set = (key: keyof StoreState | Partial<StoreState>, value?: unknown) => {
  if (typeof key === 'object') { Object.assign(_store, key); }
  else { (_store as unknown as Record<string, unknown>)[key as string] = value; }
  _store.lastUpdate = Date.now();
  _notify();
};

export const setFeatures = (features: unknown[]) => { _store.features = features || []; _notify(); };
export const setActiveFeatures = (features: unknown[]) => { _store.activeFeatures = features || []; _notify(); };
export const setSubscription = (sub: unknown) => { _store.subscription = sub; _notify(); };
export const isFeatureActive = (featureId: unknown) => _store.activeFeatures.includes(featureId);

export const reset = () => {
  _store = { mounted: false, loading: false, error: null, features: [], activeFeatures: [], subscription: null, lastUpdate: null, _initialized: false };
  _notify();
};

export const subscribe = (fn: (state: StoreState) => void) => { _listeners.push(fn); return () => { _listeners = _listeners.filter(l => l !== fn); }; };
const _notify = () => { _listeners.forEach(fn => { try { fn(getState()); } catch (e) {} }); };

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, featureCount: _store.features.length });

export default { getState, get, set, setFeatures, setActiveFeatures, setSubscription, isFeatureActive, reset, subscribe };
