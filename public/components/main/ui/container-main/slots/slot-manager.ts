
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ADAPTIVE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:slot-manager
// PURPOSE: Slot Manager - Gerenciador central de slots
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createSlot, LOAD_PRIORITY from ../contracts/slot-contract.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createSlotManager() — exported function
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

import { createSlot, LOAD_PRIORITY } from '../contracts/slot-contract.js';

export const VERSION = '1.0.0-ADAPTIVE';
export const MODULE_ID = 'container-main:slot-manager';

// Cria uma instância do Slot Manager
export function createSlotManager(options: Record<string, any> = {}) {
  const {
    container,
    eventBus,
    maxConcurrentLoads = 3,
    idleTimeout = 30000,
    onSlotChange,
    onError
  } = options;

  const _slots = new Map();
  const _activeSlotId = { current: null as string | null };
  const _loadQueue: Array<{ slotId: string; resolve: (slot: unknown) => void; reject: (error: Error) => void }> = [];
  let _loading = 0;
  let _idleTimers = new Map();
  let _destroyed = false;

  // Processa fila de carregamento
  function _processLoadQueue() {
    if (_destroyed) return;
    
    while (_loadQueue.length > 0 && _loading < maxConcurrentLoads) {
      // @ts-expect-error strict migration — TS2339
      const { slotId, resolve, reject } = _loadQueue.shift();
      const slot = _slots.get(slotId);
      
      if (!slot) {
        reject(new Error(`Slot not found: ${slotId}`));
        continue;
      }

      _loading++;
      
      const targetEl = _getOrCreateSlotElement(slotId);
      
      slot.mount(targetEl)
        .then(() => {
          _loading--;
          resolve(slot);
          _processLoadQueue();
        })
        .catch((e: Error) => {
          _loading--;
          onError?.(e, slotId);
          reject(e);
          _processLoadQueue();
        });
    }
  }

  // Obtém ou cria elemento DOM para o slot
  function _getOrCreateSlotElement(slotId: string) {
    let el = container?.querySelector(`[data-slot-id="${slotId}"]`);
    
    if (!el && container) {
      el = document.createElement('div');
      el.className = 'dsd-slot';
      el.setAttribute('data-slot-id', slotId);
      el.setAttribute('role', 'region');
      el.setAttribute('aria-label', `Slot ${slotId}`);
      container.appendChild(el);
    }
    
    return el;
  }

  // Emite evento via EventBus se disponível
  function _emit(event: string, data: Record<string, unknown>) {
    if (eventBus?.emit) {
      eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
    }
  }

  // Configura timer de idle para descarte
  function _setupIdleTimer(slotId: string) {
    _clearIdleTimer(slotId);
    
    if (idleTimeout > 0) {
      const timer = setTimeout(() => {
        const slot = _slots.get(slotId);
        if (slot && slot.getState().state !== 'active') {
          slot.cleanup?.();
          _emit('slot:idle-cleanup', { slotId });
        }
      }, idleTimeout);
      
      _idleTimers.set(slotId, timer);
    }
  }

  // Limpa timer de idle
  function _clearIdleTimer(slotId: string) {
    const timer = _idleTimers.get(slotId);
    if (timer) {
      clearTimeout(timer);
      _idleTimers.delete(slotId);
    }
  }

  return {
    // Registra um novo slot
    register(config: Record<string, unknown>, contentFactory: (element: HTMLElement, config: Record<string, unknown>) => Promise<Record<string, unknown> | null>) {
      if (_destroyed) return null;
      
      const slot = createSlot(config, contentFactory);
      const slotId = slot.getId();
      
      _slots.set(slotId, slot);
      _emit('slot:registered', { slotId, config });
      
      return slot;
    },

    // Remove um slot
    unregister(slotId: string) {
      const slot = _slots.get(slotId);
      if (!slot) return false;

      _clearIdleTimer(slotId);
      slot.unmount();
      _slots.delete(slotId);
      
      const el = container?.querySelector(`[data-slot-id="${slotId}"]`);
      if (el) el.remove();
      
      _emit('slot:unregistered', { slotId });
      return true;
    },

    // Carrega e monta um slot
    async load(slotId: string) {
      if (_destroyed) return null;
      
      const slot = _slots.get(slotId);
      if (!slot) throw new Error(`Slot not found: ${slotId}`);

      const state = slot.getState();
      if (state.mounted) return slot;

      return new Promise((resolve, reject) => {
        const config = slot.getConfig();
        
        // Ordena por prioridade
        const insertIndex = _loadQueue.findIndex((item: { slotId: string }) => {
          const itemSlot = _slots.get(item.slotId);
          return itemSlot && itemSlot.getConfig().priority > config.priority;
        });

        const queueItem = { slotId, resolve, reject };
        
        if (insertIndex === -1) {
          _loadQueue.push(queueItem);
        } else {
          _loadQueue.splice(insertIndex, 0, queueItem);
        }

        _processLoadQueue();
      });
    },

    // Ativa um slot (e pausa os outros)
    async activate(slotId: string) {
      if (_destroyed) return null;
      
      const slot = _slots.get(slotId);
      if (!slot) throw new Error(`Slot not found: ${slotId}`);

      // Pausa slot ativo anterior
      if (_activeSlotId.current && _activeSlotId.current !== slotId) {
        const previousSlot = _slots.get(_activeSlotId.current);
        if (previousSlot) {
          previousSlot.pause();
          _setupIdleTimer(_activeSlotId.current);
          _emit('slot:deactivated', { slotId: _activeSlotId.current });
        }
      }

      // Carrega se necessário
      if (!slot.getState().mounted) {
        await this.load(slotId);
      }

      // Ativa o slot
      _clearIdleTimer(slotId);
      slot.resume();
      _activeSlotId.current = slotId;
      
      // Atualiza visibilidade no DOM
      _slots.forEach((s, id) => {
        const el = container?.querySelector(`[data-slot-id="${id}"]`);
        if (el) {
          el.hidden = id !== slotId;
          el.setAttribute('aria-hidden', id !== slotId ? 'true' : 'false');
        }
      });

      _emit('slot:activated', { slotId });
      onSlotChange?.(slotId, slot);
      
      return slot;
    },

    // Obtém slot por ID
    get(slotId: string) {
      return _slots.get(slotId) || null;
    },

    // Obtém slot ativo
    getActive() {
      return _activeSlotId.current ? _slots.get(_activeSlotId.current) : null;
    },

    // Obtém ID do slot ativo
    getActiveId() {
      return _activeSlotId.current;
    },

    // Lista todos os slots
    list() {
      return Array.from(_slots.keys());
    },

    // Obtém estados de todos os slots
    getStates() {
      const states = {};
      _slots.forEach((slot, id) => {
        (states as Record<string, unknown>)[id] = slot.getState();
      });
      return states;
    },

    // Pausa todos os slots
    pauseAll() {
      _slots.forEach((slot, id) => {
        slot.pause();
        _setupIdleTimer(id);
      });
      _emit('slot:all-paused', { count: _slots.size });
    },

    // Resume slot ativo
    resumeActive() {
      if (_activeSlotId.current) {
        const slot = _slots.get(_activeSlotId.current);
        if (slot) {
          _clearIdleTimer(_activeSlotId.current);
          slot.resume();
        }
      }
    },

    // Cleanup de slots inativos
    cleanupInactive() {
      let cleaned = 0;
      _slots.forEach((slot, id) => {
        if (id !== _activeSlotId.current) {
          slot.cleanup?.();
          cleaned++;
        }
      });
      _emit('slot:cleanup', { cleaned });
      return cleaned;
    },

    // Preload de slots por prioridade
    async preloadByPriority(maxPriority = LOAD_PRIORITY.NORMAL) {
      const toPreload: unknown[] = [];
      
      _slots.forEach((slot, id) => {
        const config = slot.getConfig();
        if (config.priority <= maxPriority && !slot.getState().mounted) {
          toPreload.push({ id, priority: config.priority });
        }
      });

      // Ordena por prioridade
      // @ts-expect-error strict migration — TS2345
      toPreload.sort((a: { priority: number }, b: { priority: number }) => a.priority - b.priority);

      // Carrega em sequência
      for (const { id } of toPreload as Array<{ id: string; priority: number }>) {
        try {
          await this.load(id);
        } catch (e) {
          onError?.(e, id);
        }
      }

      return toPreload.length;
    },

    // Health check
    healthCheck() {
      const states = this.getStates();
      // @ts-expect-error strict migration — TS2769
      const mounted = Object.values(states).filter((s: Record<string, any>) => s.mounted).length;
      // @ts-expect-error strict migration — TS2769
      const errors = Object.values(states).filter((s: Record<string, any>) => s.error).length;

      return {
        status: errors > 0 ? 'DEGRADED' : 'HEALTHY',
        version: VERSION,
        moduleId: MODULE_ID,
        totalSlots: _slots.size,
        mountedSlots: mounted,
        activeSlot: _activeSlotId.current,
        loadQueueLength: _loadQueue.length,
        currentlyLoading: _loading,
        errors,
        destroyed: _destroyed
      };
    },

    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        totalSlots: _slots.size,
        activeSlot: _activeSlotId.current
      };
    },

    // Destroy manager
    destroy() {
      _destroyed = true;
      
      // Limpa timers
      _idleTimers.forEach(timer => clearTimeout(timer));
      _idleTimers.clear();
      
      // Desmonta todos os slots
      _slots.forEach((slot) => {
        try { slot.unmount(); } catch (e) {}
      });
      _slots.clear();
      
      // Limpa fila
      _loadQueue.forEach(({ reject }) => reject(new Error('Manager destroyed')));
      _loadQueue.length = 0;
      
      _activeSlotId.current = null;
      _emit('slot-manager:destroyed', {});
    }
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ['createSlotManager']
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
  createSlotManager,
  info, healthCheck
};
