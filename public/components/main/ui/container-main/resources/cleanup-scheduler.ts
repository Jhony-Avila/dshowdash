
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-LOGGER-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:cleanup-scheduler
// PURPOSE: Cleanup Scheduler - Agendador de limpeza de recursos
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CLEANUP_STRATEGIES — exported value
//   createCleanupScheduler() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from '../utils/logger.js';

export const VERSION = '1.1.0-LOGGER-INTEGRATED';
export const MODULE_ID = 'container-main:cleanup-scheduler';

const logger = createLogger(MODULE_ID);

// Estratégias de cleanup
export const CLEANUP_STRATEGIES = Object.freeze({
  AGGRESSIVE: 'aggressive',
  BALANCED: 'balanced',
  CONSERVATIVE: 'conservative',
  MANUAL: 'manual'
});

// Configurações por estratégia
const STRATEGY_CONFIG = {
  [CLEANUP_STRATEGIES.AGGRESSIVE]: {
    idleTimeout: 10000,
    checkInterval: 5000,
    maxIdleResources: 2
  },
  [CLEANUP_STRATEGIES.BALANCED]: {
    idleTimeout: 30000,
    checkInterval: 15000,
    maxIdleResources: 5
  },
  [CLEANUP_STRATEGIES.CONSERVATIVE]: {
    idleTimeout: 60000,
    checkInterval: 30000,
    maxIdleResources: 10
  },
  [CLEANUP_STRATEGIES.MANUAL]: {
    idleTimeout: Infinity,
    checkInterval: 0,
    maxIdleResources: Infinity
  }
};

// Cria instância do Cleanup Scheduler
export function createCleanupScheduler(options: Record<string, any> = {}) {
  const {
    strategy = CLEANUP_STRATEGIES.BALANCED,
    eventBus,
    onCleanup,
    onScheduled,
    customConfig
  } = options;

  const _config = customConfig || (STRATEGY_CONFIG as Record<string, unknown>)[strategy] || STRATEGY_CONFIG.balanced;
  const _scheduled = new Map();
  let _checkTimer: ReturnType<typeof setInterval> | null = null;
  let _destroyed = false;
  let _totalCleaned = 0;
  let _lastCleanup: unknown = null;

  // Emite evento
  function _emit(event: string, data: Record<string, unknown>) {
    if (eventBus?.emit) {
      eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
    }
  }

  // Executa cleanup agendado
  async function _executeCleanup(id: string) {
    const entry = _scheduled.get(id);
    if (!entry) return false;

    try {
      if (entry.cleanup && typeof entry.cleanup === 'function') {
        await entry.cleanup();
      }
      _scheduled.delete(id);
      _totalCleaned++;
      _lastCleanup = { id, timestamp: Date.now() };
      onCleanup?.(id);
      _emit('cleanup:executed', { id });
      return true;
    } catch (e: any) {
      logger.error(`Error cleaning resource`, { id, error: e.message });
      _emit('cleanup:error', { id, error: e.message });
      return false;
    }
  }

  // Verifica recursos para cleanup
  function _checkForCleanup() {
    if (_destroyed) return;

    const now = Date.now();
    const toCleanup: unknown[] = [];

    _scheduled.forEach((entry, id) => {
      if (now - entry.scheduledAt >= _config.idleTimeout) {
        toCleanup.push(id);
      }
    });

    // Limita quantidade de cleanups por ciclo
    const maxPerCycle = Math.min(toCleanup.length, 5);
    for (let i = 0; i < maxPerCycle; i++) {
      _executeCleanup(toCleanup[i] as string);
    }

    // Se excede máximo de recursos idle, limpa os mais antigos
    if (_scheduled.size > _config.maxIdleResources) {
      const sorted = Array.from(_scheduled.entries())
        .sort((a, b) => a[1].scheduledAt - b[1].scheduledAt);
      
      const toRemove = sorted.slice(0, _scheduled.size - _config.maxIdleResources);
      toRemove.forEach(([id]) => _executeCleanup(id));
    }
  }

  // Inicia scheduler
  function _start() {
    if (_checkTimer || _config.checkInterval === 0) return;
    _checkTimer = setInterval(_checkForCleanup, _config.checkInterval);
  }

  // Para scheduler
  function _stop() {
    if (_checkTimer) {
      clearInterval(_checkTimer);
      _checkTimer = null;
    }
  }

  return {
    // Agenda cleanup de recurso
    schedule(id: string, cleanup: (...args: unknown[]) => void, priority = 0) {
      if (_destroyed) return false;

      if (_scheduled.has(id)) {
        this.cancel(id);
      }

      _scheduled.set(id, {
        cleanup,
        priority,
        scheduledAt: Date.now()
      });

      onScheduled?.(id);
      _emit('cleanup:scheduled', { id, priority });
      return true;
    },

    // Cancela cleanup agendado
    cancel(id: string) {
      const had = _scheduled.has(id);
      _scheduled.delete(id);
      if (had) {
        _emit('cleanup:cancelled', { id });
      }
      return had;
    },

    // Executa cleanup imediato
    async executeNow(id: string) {
      return _executeCleanup(id);
    },

    // Executa todos os cleanups pendentes
    async executeAll() {
      const ids = Array.from(_scheduled.keys());
      let cleaned = 0;
      
      for (const id of ids) {
        if (await _executeCleanup(id)) cleaned++;
      }

      _emit('cleanup:all-executed', { cleaned, total: ids.length });
      return cleaned;
    },

    // Verifica se está agendado
    isScheduled(id: string) {
      return _scheduled.has(id);
    },

    // Lista agendados
    getScheduled() {
      const list: unknown[] = [];
      _scheduled.forEach((entry, id) => {
        list.push({
          id,
          scheduledAt: entry.scheduledAt,
          priority: entry.priority,
          age: Date.now() - entry.scheduledAt
        });
      });
      return list.sort((a, b) => (a as Record<string, number>).scheduledAt - (b as Record<string, number>).scheduledAt);
    },

    // Inicia scheduler
    start() {
      if (_destroyed) return this;
      _start();
      _emit('scheduler:started', { strategy });
      return this;
    },

    // Para scheduler
    stop() {
      _stop();
      _emit('scheduler:stopped', {});
      return this;
    },

    // Altera estratégia
    setStrategy(newStrategy: string) {
      const config = (STRATEGY_CONFIG as Record<string, unknown>)[newStrategy];
      if (!config) return false;
      
      Object.assign(_config, config);
      _stop();
      _start();
      _emit('scheduler:strategy-changed', { strategy: newStrategy });
      return true;
    },

    // Obtém configuração atual
    getConfig() {
      return { ..._config };
    },

    // Estatísticas
    getStats() {
      return {
        strategy,
        scheduledCount: _scheduled.size,
        totalCleaned: _totalCleaned,
        lastCleanup: _lastCleanup,
        config: { ..._config },
        running: !!_checkTimer
      };
    },

    // Health check
    healthCheck() {
      return {
        status: _destroyed ? 'DESTROYED' : 'HEALTHY',
        version: VERSION,
        moduleId: MODULE_ID,
        strategy,
        scheduledCount: _scheduled.size,
        totalCleaned: _totalCleaned,
        running: !!_checkTimer,
        config: _config
      };
    },

    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        strategy,
        scheduledCount: _scheduled.size
      };
    },

    // Destroy
    destroy() {
      _destroyed = true;
      _stop();
      _scheduled.clear();
      _emit('scheduler:destroyed', {});
    }
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    strategies: Object.keys(CLEANUP_STRATEGIES),
    exports: ['createCleanupScheduler', 'CLEANUP_STRATEGIES']
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID
  };
}

export default {
  VERSION, MODULE_ID,
  CLEANUP_STRATEGIES,
  createCleanupScheduler,
  info, healthCheck
};
