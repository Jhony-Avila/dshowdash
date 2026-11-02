// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-tokens-lifecycle
// PURPOSE: core   lifecycle
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TokensStore from ../state/store.js
//   TokensRegistry from ./registry.js
//   TokensLoader from ./loader.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   LIFECYCLE_STATUS — exported value
//   TokensLifecycle — exported value
//   getVersion() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
// Theme Tokens Loader - Lifecycle v1.0.0-ENTERPRISE
// Gerenciamento de ciclo de vida

import { TokensStore } from '../state/store.js';
import { TokensRegistry } from './registry.js';
import { TokensLoader } from './loader.js';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'theme-tokens-lifecycle';

export function getVersion() {
  return VERSION;
}

// Estado do lifecycle
const _lifecycleState = {
  status: 'NOT_INITIALIZED',
  initialized: false,
  initCount: 0,
  lastInitAt: null as unknown | null,
  lastError: null as unknown | null
};

// Status possíveis
export const LIFECYCLE_STATUS = {
  NOT_INITIALIZED: 'NOT_INITIALIZED',
  INITIALIZING: 'INITIALIZING',
  READY: 'READY',
  ERROR: 'ERROR'
};

// Lifecycle API
export const TokensLifecycle = {
  // Inicializar (idempotente)
  async init(options = {}) {
    // Idempotência
    if (_lifecycleState.initialized && _lifecycleState.status === LIFECYCLE_STATUS.READY) {
      return {
        ok: true,
        alreadyInitialized: true,
        status: _lifecycleState.status,
        initCount: _lifecycleState.initCount
      };
    }

    _lifecycleState.status = LIFECYCLE_STATUS.INITIALIZING;

    try {
      // Carregar todas as fontes
      const loadResult = await TokensLoader.loadAllSources();

      if (!loadResult.ok) {
        _lifecycleState.status = LIFECYCLE_STATUS.ERROR;
        _lifecycleState.lastError = loadResult.error;
        return {
          ok: false,
          error: loadResult.error,
          status: _lifecycleState.status
        };
      }

      // Marcar como inicializado
      TokensStore.setInitialized(true);
      _lifecycleState.initialized = true;
      _lifecycleState.status = LIFECYCLE_STATUS.READY;
      _lifecycleState.initCount++;
      _lifecycleState.lastInitAt = Date.now();
      _lifecycleState.lastError = null;

      return {
        ok: true,
        alreadyInitialized: false,
        status: _lifecycleState.status,
        initCount: _lifecycleState.initCount,
        summary: loadResult.summary
      };

    } catch (error: any) {
      _lifecycleState.status = LIFECYCLE_STATUS.ERROR;
      _lifecycleState.lastError = error.message;
      
      return {
        ok: false,
        error: error.message,
        status: _lifecycleState.status
      };
    }
  },

  // Reset completo
  reset() {
    TokensRegistry.clearRegistry();
    TokensStore.reset();
    
    _lifecycleState.status = LIFECYCLE_STATUS.NOT_INITIALIZED;
    _lifecycleState.initialized = false;
    _lifecycleState.lastError = null;

    return { ok: true };
  },

  // Reload (reset + init)
  async reload() {
    this.reset();
    return this.init();
  },

  // Verificar se inicializado
  isInitialized() {
    return _lifecycleState.initialized;
  },

  // Obter status
  getStatus() {
    return _lifecycleState.status;
  },

  // Obter informações do lifecycle
  getLifecycleInfo() {
    return {
      status: _lifecycleState.status,
      initialized: _lifecycleState.initialized,
      initCount: _lifecycleState.initCount,
      lastInitAt: _lifecycleState.lastInitAt,
      lastError: _lifecycleState.lastError,
      storeInitialized: TokensStore.isInitialized()
    };
  },

  // Health check
  healthCheck() {
    const storeHealth = TokensStore.healthCheck();
    const registryHealth = TokensRegistry.healthCheck();
    const loaderHealth = TokensLoader.healthCheck();

    const allHealthy = storeHealth.healthy && 
                       registryHealth.healthy && 
                       loaderHealth.healthy &&
                       _lifecycleState.status === LIFECYCLE_STATUS.READY;

    return {
      healthy: allHealthy,
      version: VERSION,
      moduleId: MODULE_ID,
      lifecycle: this.getLifecycleInfo(),
      components: {
        store: storeHealth,
        registry: registryHealth,
        loader: loaderHealth
      },
      issues: !allHealthy ? (_lifecycleState.lastError || 'Not ready') : null
    };
  }
};

export default TokensLifecycle;
