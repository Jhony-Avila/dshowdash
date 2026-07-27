// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
/**
 * @file Adapter Manager
 * @version 1.2.0-EXPORT-FIX
 * @module app-shell/adapters/adapter-manager
 *
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ../utils/circuit-breaker.js (execute)
 * @requires ./globalstate-adapter.js (GlobalStateAdapter)
 * @requires ./auth-adapter.js (AuthAdapter)
 * @requires ./layout-adapter.js (LayoutAdapter)
 * @requires ./theme-adapter.js (ThemeAdapter)
 * @requires ./notification-adapter.js (NotificationAdapter)
 * @requires ./router-adapter.js (RouterAdapter)
 * @requires ./ticker-adapter.js (TickerAdapter)
 * @requires ./responsive-adapter/index.js (ResponsiveAdapter)
 *
 * @provides ADAPTER_CONFIG, connectAdapter, disconnectAllAdapters
 * @provides getConnectedAdaptersList, collectAdapterHealths, collectAdapterInfos
 * @provides getMetrics, getAdapterInstances
 * @provides GlobalStateAdapter, AuthAdapter, LayoutAdapter, ThemeAdapter
 * @provides NotificationAdapter, RouterAdapter, TickerAdapter, ResponsiveAdapter
 *
 * @description
 * Manages adapter connections with circuit breaker protection.
 * Handles lazy loading and health collection for all adapters.
 * v1.1.0: Added getAdapterInstances for index.js compatibility.
 * v1.2.0: Added re-exports of all 8 adapter modules for index.js compatibility.
 *
 * @example
 * import { connectAdapter, getConnectedAdaptersList } from './adapter-manager.js';
 * await connectAdapter('theme');
 * console.log(getConnectedAdaptersList());
 * ============================================================================
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'app-shell.adapters.adapter-manager';

import { execute as circuitExecute } from '../utils/circuit-breaker.js';

// Adapter modules — re-exported for index.js centralized import
import GlobalStateAdapter from './globalstate-adapter.js';
import AuthAdapter from './auth-adapter.js';
import LayoutAdapter from './layout-adapter.js';
import ThemeAdapter from './theme-adapter.js';
import NotificationAdapter from './notification-adapter.js';
import RouterAdapter from './router-adapter.js';
import TickerAdapter from './ticker-adapter.js';
import ResponsiveAdapter from './responsive-adapter/index.js';

export { GlobalStateAdapter, AuthAdapter, LayoutAdapter, ThemeAdapter,

         NotificationAdapter, RouterAdapter, TickerAdapter, ResponsiveAdapter };

export const ADAPTER_CONFIG = Object.freeze({
  globalState: { enabled: true, lazy: false, instance: null },
  auth: { enabled: true, lazy: true, instance: null },
  layout: { enabled: true, lazy: false, instance: null },
  theme: { enabled: true, lazy: false, instance: null },
  notification: { enabled: true, lazy: true, instance: null },
  router: { enabled: true, lazy: true, instance: null },
  ticker: { enabled: true, lazy: true, instance: null },
  responsive: { enabled: true, lazy: false, instance: null }
});

const _adapters = new Map();
const _metrics = { adaptersConnected: 0, errors: 0 };

export function connectAdapter(name: string, adapterModule?: DynObj, callbacks?: DynObj, logger?: DynObj, metrics?: DynObj) {
  if (_adapters.has(name)) {
    return Promise.resolve({ ok: true, adapter: name, cached: true });
  }

  const config = (ADAPTER_CONFIG as DynObj)[name];
  if (!config || !config.enabled) {
    return Promise.resolve({ ok: false, error: `Adapter not enabled: ${name}` });
  }

  return circuitExecute(`adapter-${name}`, () => new Promise(resolve => {
    try {
      let instance;

      if (adapterModule) {
        instance = typeof adapterModule.init === 'function' ? adapterModule.init() : adapterModule;
      } else {
        instance = { name, connected: true };
      }

      _adapters.set(name, {
        name,
        instance,
        connectedAt: Date.now(),
        healthy: true
      });

      _metrics.adaptersConnected++;
      resolve({ ok: true, adapter: name });
    } catch (e: any) {
      _metrics.errors++;
      resolve({ ok: false, error: e.message });
    }
  })).catch(e => {
    _metrics.errors++;
    return { ok: false, error: e.message };
  });
}

export function disconnectAllAdapters() {
  const disconnected: DynObj[] = [];

  _adapters.forEach((adapterInfo, name) => {
    try {
      if (adapterInfo.instance && typeof adapterInfo.instance.destroy === 'function') {
        adapterInfo.instance.destroy();
      }
      disconnected.push(name);
    } catch (e: any) {
      _metrics.errors++;
    }
  });

  _adapters.clear();
  return disconnected;
}

export function getConnectedAdaptersList() {
  const list: DynObj[] = [];
  _adapters.forEach((info, name) => {
    list.push({
      name,
      connectedAt: info.connectedAt,
      healthy: info.healthy
    });
  });
  return list;
}

export function collectAdapterHealths() {
  const healths = {};

  _adapters.forEach((info, name) => {
    try {
      if (info.instance && typeof info.instance.healthCheck === 'function') {
        (healths as DynObj)[name] = info.instance.healthCheck();
      } else {
        (healths as DynObj)[name] = { status: 'HEALTHY', connected: true };
      }
    } catch (e: any) {
      (healths as DynObj)[name] = { status: 'ERROR', error: e.message };
    }
  });

  return healths;
}

export function collectAdapterInfos() {
  const infos = {};

  _adapters.forEach((info, name) => {
    try {
      if (info.instance && typeof info.instance.info === 'function') {
        (infos as DynObj)[name] = info.instance.info();
      } else {
        (infos as DynObj)[name] = { name, connectedAt: info.connectedAt };
      }
    } catch (e: any) {
      (infos as DynObj)[name] = { error: e.message };
    }
  });

  return infos;
}

// Returns a map of adapter name → instance for index.js compatibility
export function getAdapterInstances() {
  const instances = {};
  _adapters.forEach((info, name) => {
    (instances as DynObj)[name] = info.instance || null;
  });
  return instances;
}

export function getMetrics() {
  return {
    adaptersConnected: _metrics.adaptersConnected,
    currentlyConnected: _adapters.size,
    errors: _metrics.errors
  };
}

export default {
  ADAPTER_CONFIG,
  connectAdapter,
  disconnectAllAdapters,
  getConnectedAdaptersList,
  collectAdapterHealths,
  collectAdapterInfos,
  getAdapterInstances,
  getMetrics,
  GlobalStateAdapter,
  AuthAdapter,
  LayoutAdapter,
  ThemeAdapter,
  NotificationAdapter,
  RouterAdapter,
  TickerAdapter,
  ResponsiveAdapter
};
