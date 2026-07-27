declare const _state: Record<string, unknown>;
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-02/state/store
// PURPOSE: State Store - Panel-02
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
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

export class StateStore {
  [key: string]: any;
  constructor(logger: Record<string, unknown>) {
    this.logger = logger;
    this.state = {
      current: 'IDLE',
      loading: false,
      error: null,
      data: null,
      lastUpdate: null
    };
    this.listeners = new Set();
  }

  // Adiciona listener reativo - retorna função de unsubscribe
  subscribe(listener: (state: Record<string, unknown>) => void) {
    if (typeof listener !== 'function') {
      this.logger.error('store.invalid-listener', { type: typeof listener });
      return () => {};
    }

    this.listeners.add(listener);
    this.logger.debug('store.listener-added', { total: this.listeners.size });

    return () => {
      this.listeners.delete(listener);
      this.logger.debug('store.listener-removed', { total: this.listeners.size });
    };
  }

  // Notifica todos os listeners
  notify() {
    this.listeners.forEach((fn: (state: Record<string, unknown>) => void) => {
      try {
        fn({ ...this.state });
      } catch (error) {
        this.logger.error('store.notify-error', {
          error: (error as Error).message,
          stack: (error as Error).stack
        });
      }
    });
  }

  // Atualiza estado e notifica
  setState(key: string, value: unknown) {
    if (!this.state.hasOwnProperty(key)) {
      this.logger.warn('store.unknown-key', { key });
    }

    const oldValue = this.state[key];
    this.state[key] = value;

    this.logger.debug('store.state-changed', {
      key,
      oldValue,
      newValue: value
    });

    this.notify();
  }

  setLoading(loading: boolean) {
    this.setState('loading', Boolean(loading));
  }

  setError(error: string | null) {
    this.state.error = error;
    this.state.loading = false;
    this.logger.warn('store.error-set', { error });
    this.notify();
  }

  // Atualiza dados + timestamp
  setData(data: unknown) {
    this.state = {
      ...this.state,
      data,
      error: null,
      loading: false,
      lastUpdate: Date.now()
    };

    this.logger.debug('store.data-set', {
      dataSize: JSON.stringify(data).length,
      timestamp: this.state.lastUpdate
    });

    this.notify();
  }

  // Retorna cópia imutável
  getState() {
    return { ...this.state };
  }

  // Limpa tudo
  reset() {
    this.state = {
      current: 'IDLE',
      loading: false,
      error: null,
      data: null,
      lastUpdate: null
    };
    this.listeners.clear();
    this.logger.debug('store.reset');
  }
}


// @ts-expect-error TS migration - TS2554
export const store = new StateStore();
export default StateStore;

export const MODULE_ID = 'panel-02/state/store';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: (_state?._initialized !== false) ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { storeReady: true } }; }
