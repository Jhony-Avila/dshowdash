import { createSlot, LOAD_PRIORITY } from "../contracts/slot-contract.js";
const VERSION = "1.0.0-ADAPTIVE";
const MODULE_ID = "container-main:slot-manager";
function createSlotManager(options = {}) {
  const {
    container,
    eventBus,
    maxConcurrentLoads = 3,
    idleTimeout = 3e4,
    onSlotChange,
    onError
  } = options;
  const _slots = /* @__PURE__ */ new Map();
  const _activeSlotId = { current: null };
  const _loadQueue = [];
  let _loading = 0;
  let _idleTimers = /* @__PURE__ */ new Map();
  let _destroyed = false;
  function _processLoadQueue() {
    if (_destroyed) return;
    while (_loadQueue.length > 0 && _loading < maxConcurrentLoads) {
      const { slotId, resolve, reject } = _loadQueue.shift();
      const slot = _slots.get(slotId);
      if (!slot) {
        reject(new Error(`Slot not found: ${slotId}`));
        continue;
      }
      _loading++;
      const targetEl = _getOrCreateSlotElement(slotId);
      slot.mount(targetEl).then(() => {
        _loading--;
        resolve(slot);
        _processLoadQueue();
      }).catch((e) => {
        _loading--;
        onError?.(e, slotId);
        reject(e);
        _processLoadQueue();
      });
    }
  }
  function _getOrCreateSlotElement(slotId) {
    let el = container?.querySelector(`[data-slot-id="${slotId}"]`);
    if (!el && container) {
      el = document.createElement("div");
      el.className = "dsd-slot";
      el.setAttribute("data-slot-id", slotId);
      el.setAttribute("role", "region");
      el.setAttribute("aria-label", `Slot ${slotId}`);
      container.appendChild(el);
    }
    return el;
  }
  function _emit(event, data) {
    if (eventBus?.emit) {
      eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
    }
  }
  function _setupIdleTimer(slotId) {
    _clearIdleTimer(slotId);
    if (idleTimeout > 0) {
      const timer = setTimeout(() => {
        const slot = _slots.get(slotId);
        if (slot && slot.getState().state !== "active") {
          slot.cleanup?.();
          _emit("slot:idle-cleanup", { slotId });
        }
      }, idleTimeout);
      _idleTimers.set(slotId, timer);
    }
  }
  function _clearIdleTimer(slotId) {
    const timer = _idleTimers.get(slotId);
    if (timer) {
      clearTimeout(timer);
      _idleTimers.delete(slotId);
    }
  }
  return {
    // Registra um novo slot
    register(config, contentFactory) {
      if (_destroyed) return null;
      const slot = createSlot(config, contentFactory);
      const slotId = slot.getId();
      _slots.set(slotId, slot);
      _emit("slot:registered", { slotId, config });
      return slot;
    },
    // Remove um slot
    unregister(slotId) {
      const slot = _slots.get(slotId);
      if (!slot) return false;
      _clearIdleTimer(slotId);
      slot.unmount();
      _slots.delete(slotId);
      const el = container?.querySelector(`[data-slot-id="${slotId}"]`);
      if (el) el.remove();
      _emit("slot:unregistered", { slotId });
      return true;
    },
    // Carrega e monta um slot
    async load(slotId) {
      if (_destroyed) return null;
      const slot = _slots.get(slotId);
      if (!slot) throw new Error(`Slot not found: ${slotId}`);
      const state = slot.getState();
      if (state.mounted) return slot;
      return new Promise((resolve, reject) => {
        const config = slot.getConfig();
        const insertIndex = _loadQueue.findIndex((item) => {
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
    async activate(slotId) {
      if (_destroyed) return null;
      const slot = _slots.get(slotId);
      if (!slot) throw new Error(`Slot not found: ${slotId}`);
      if (_activeSlotId.current && _activeSlotId.current !== slotId) {
        const previousSlot = _slots.get(_activeSlotId.current);
        if (previousSlot) {
          previousSlot.pause();
          _setupIdleTimer(_activeSlotId.current);
          _emit("slot:deactivated", { slotId: _activeSlotId.current });
        }
      }
      if (!slot.getState().mounted) {
        await this.load(slotId);
      }
      _clearIdleTimer(slotId);
      slot.resume();
      _activeSlotId.current = slotId;
      _slots.forEach((s, id) => {
        const el = container?.querySelector(`[data-slot-id="${id}"]`);
        if (el) {
          el.hidden = id !== slotId;
          el.setAttribute("aria-hidden", id !== slotId ? "true" : "false");
        }
      });
      _emit("slot:activated", { slotId });
      onSlotChange?.(slotId, slot);
      return slot;
    },
    // Obtém slot por ID
    get(slotId) {
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
        states[id] = slot.getState();
      });
      return states;
    },
    // Pausa todos os slots
    pauseAll() {
      _slots.forEach((slot, id) => {
        slot.pause();
        _setupIdleTimer(id);
      });
      _emit("slot:all-paused", { count: _slots.size });
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
      _emit("slot:cleanup", { cleaned });
      return cleaned;
    },
    // Preload de slots por prioridade
    async preloadByPriority(maxPriority = LOAD_PRIORITY.NORMAL) {
      const toPreload = [];
      _slots.forEach((slot, id) => {
        const config = slot.getConfig();
        if (config.priority <= maxPriority && !slot.getState().mounted) {
          toPreload.push({ id, priority: config.priority });
        }
      });
      toPreload.sort((a, b) => a.priority - b.priority);
      for (const { id } of toPreload) {
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
      const mounted = Object.values(states).filter((s) => s.mounted).length;
      const errors = Object.values(states).filter((s) => s.error).length;
      return {
        status: errors > 0 ? "DEGRADED" : "HEALTHY",
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
      _idleTimers.forEach((timer) => clearTimeout(timer));
      _idleTimers.clear();
      _slots.forEach((slot) => {
        try {
          slot.unmount();
        } catch (e) {
        }
      });
      _slots.clear();
      _loadQueue.forEach(({ reject }) => reject(new Error("Manager destroyed")));
      _loadQueue.length = 0;
      _activeSlotId.current = null;
      _emit("slot-manager:destroyed", {});
    }
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ["createSlotManager"]
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID
  };
}
var slot_manager_default = {
  VERSION,
  MODULE_ID,
  createSlotManager,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  createSlotManager,
  slot_manager_default as default,
  healthCheck,
  info
};
