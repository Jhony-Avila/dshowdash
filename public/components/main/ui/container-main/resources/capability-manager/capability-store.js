const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.capability-manager.capability-store";
function createCapabilityStore() {
  const _panelCapabilities = /* @__PURE__ */ new Map();
  const _activeCapabilityCounts = /* @__PURE__ */ new Map();
  const _requestHistory = [];
  return {
    // Panel record management
    getPanelRecord(panelId) {
      if (!_panelCapabilities.has(panelId)) {
        _panelCapabilities.set(panelId, /* @__PURE__ */ new Map());
      }
      return _panelCapabilities.get(panelId);
    },
    hasPanelRecord(panelId) {
      return _panelCapabilities.has(panelId);
    },
    deletePanelRecord(panelId) {
      return _panelCapabilities.delete(panelId);
    },
    getAllPanels() {
      return _panelCapabilities;
    },
    getPanelCount() {
      return _panelCapabilities.size;
    },
    // Capability counts
    getCapabilityCount(capability) {
      return _activeCapabilityCounts.get(capability) || 0;
    },
    incrementCapabilityCount(capability) {
      const current = _activeCapabilityCounts.get(capability) || 0;
      _activeCapabilityCounts.set(capability, current + 1);
    },
    decrementCapabilityCount(capability) {
      const current = _activeCapabilityCounts.get(capability) || 0;
      _activeCapabilityCounts.set(capability, Math.max(0, current - 1));
    },
    getActiveCapabilityCounts() {
      const counts = {};
      _activeCapabilityCounts.forEach((count, cap) => {
        counts[cap] = count;
      });
      return counts;
    },
    // History management
    // @ts-expect-error strict migration — TS2322
    logRequest(panelId, capability, action, status, reason = null) {
      const entry = {
        panelId,
        capability,
        action,
        status,
        reason,
        timestamp: Date.now()
      };
      _requestHistory.push(entry);
      if (_requestHistory.length > 1e3) _requestHistory.shift();
      return entry;
    },
    getHistory(limit = 100) {
      return _requestHistory.slice(-limit);
    },
    // Clear all
    clear() {
      _panelCapabilities.clear();
      _activeCapabilityCounts.clear();
      _requestHistory.length = 0;
    }
  };
}
var capability_store_default = { createCapabilityStore };
export {
  MODULE_ID,
  VERSION,
  createCapabilityStore,
  capability_store_default as default
};
