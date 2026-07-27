const VERSION = "1.0.0";
const MODULE_ID = "overlay-kernel-orphan-detector";
const DEFAULT_CONFIG = {
  enabled: true,
  autoScanEnabled: false,
  scanInterval: 3e4,
  minAgeToConsiderOrphan: 5e3,
  autoCleanup: false,
  containerSelector: "#overlay-container",
  overlaySelector: "[data-overlay-id]",
  onOrphanDetected: null,
  onOrphanCleaned: null
};
let _config = { ...DEFAULT_CONFIG };
let _state = {
  autoScanIntervalId: null,
  lastScan: null,
  scansCount: 0,
  orphansDetected: 0,
  orphansCleaned: 0,
  currentOrphans: []
};
let _store = null;
let _closeOverlay = null;
let _eventBus = null;
function inject(dependencies) {
  if (dependencies.store) _store = dependencies.store;
  if (dependencies.closeOverlay) _closeOverlay = dependencies.closeOverlay;
  if (dependencies.eventBus) _eventBus = dependencies.eventBus;
}
function emit(event, data) {
  if (_eventBus?.emit) {
    _eventBus.emit(event, { ...data, moduleId: MODULE_ID, timestamp: Date.now() });
  }
}
function getDOMOverlayIds() {
  if (typeof document === "undefined") return [];
  const container = document.querySelector(_config.containerSelector);
  if (!container) {
    const fallbackContainer = document.getElementById("overlay-container") || document.querySelector("[data-overlay-container]");
    if (!fallbackContainer) return [];
    const elements2 = fallbackContainer.querySelectorAll(_config.overlaySelector);
    return Array.from(elements2).map((el) => el.dataset.overlayId).filter(Boolean);
  }
  const elements = container.querySelectorAll(_config.overlaySelector);
  return Array.from(elements).map((el) => el.dataset.overlayId).filter(Boolean);
}
function getOverlayAge(overlay) {
  if (!overlay) return 0;
  const createdAt = overlay.runtime?.createdAt || overlay.runtime?.openedAt || overlay.createdAt || overlay.meta?.createdAt;
  if (!createdAt) return Infinity;
  return Date.now() - createdAt;
}
function isOrphan(id, overlay, domIds) {
  if (!domIds.includes(id)) {
    const age = getOverlayAge(overlay);
    if (age >= _config.minAgeToConsiderOrphan) {
      return true;
    }
  }
  return false;
}
function scan() {
  if (!_store) {
    return {
      ok: false,
      error: "store-not-injected",
      orphans: [],
      scanned: 0
    };
  }
  _state.lastScan = Date.now();
  _state.scansCount++;
  const stack = _store.getStack ? _store.getStack() : [];
  const overlays = _store.getOverlays ? _store.getOverlays() : {};
  const domIds = getDOMOverlayIds();
  const orphans = [];
  for (const id of stack) {
    const overlay = overlays[id];
    if (!overlay) {
      orphans.push({
        id,
        type: "unknown",
        reason: "not-in-store",
        age: 0,
        inDOM: domIds.includes(id)
      });
      continue;
    }
    if (isOrphan(id, overlay, domIds)) {
      orphans.push({
        id,
        type: overlay.type || "unknown",
        reason: "not-in-dom",
        age: getOverlayAge(overlay),
        inDOM: false,
        scope: overlay.scope
      });
    }
  }
  _state.currentOrphans = orphans;
  _state.orphansDetected += orphans.length;
  if (orphans.length > 0) {
    if (typeof _config.onOrphanDetected === "function") {
      try {
        _config.onOrphanDetected(orphans);
      } catch (e) {
      }
    }
    emit("orphan-detector:orphans-found", { count: orphans.length, orphans });
  }
  return {
    ok: true,
    orphans,
    scanned: stack.length,
    domCount: domIds.length,
    timestamp: _state.lastScan
  };
}
function getOrphans() {
  return [..._state.currentOrphans];
}
function hasOrphans() {
  return _state.currentOrphans.length > 0;
}
function cleanup() {
  if (!_closeOverlay) {
    return {
      ok: false,
      error: "close-function-not-injected",
      cleaned: 0
    };
  }
  scan();
  const orphans = [..._state.currentOrphans];
  const cleaned = [];
  const failed = [];
  for (const orphan of orphans) {
    try {
      const result = _closeOverlay(orphan.id, "orphan-cleanup");
      if (result?.ok !== false) {
        cleaned.push(orphan.id);
        _state.orphansCleaned++;
        if (typeof _config.onOrphanCleaned === "function") {
          try {
            _config.onOrphanCleaned(orphan);
          } catch (e) {
          }
        }
      } else {
        failed.push({ id: orphan.id, reason: result?.reason || "unknown" });
      }
    } catch (error) {
      failed.push({ id: orphan.id, reason: error.message });
    }
  }
  _state.currentOrphans = _state.currentOrphans.filter(
    (o) => !cleaned.includes(o.id)
  );
  if (cleaned.length > 0) {
    emit("orphan-detector:cleanup-complete", { cleaned: cleaned.length, failed: failed.length });
  }
  return {
    ok: true,
    cleaned,
    failed,
    cleanedCount: cleaned.length,
    failedCount: failed.length
  };
}
function enableAutoScan(interval) {
  if (_state.autoScanIntervalId) {
    disableAutoScan();
  }
  const scanInterval = interval || _config.scanInterval;
  _config.autoScanEnabled = true;
  _state.autoScanIntervalId = setInterval(() => {
    const result = scan();
    if (_config.autoCleanup && result.orphans.length > 0) {
      cleanup();
    }
  }, scanInterval);
  scan();
  return {
    ok: true,
    interval: scanInterval,
    autoCleanup: _config.autoCleanup
  };
}
function disableAutoScan() {
  _config.autoScanEnabled = false;
  if (_state.autoScanIntervalId) {
    clearInterval(_state.autoScanIntervalId);
    _state.autoScanIntervalId = null;
  }
  return { ok: true };
}
function isAutoScanEnabled() {
  return _config.autoScanEnabled && _state.autoScanIntervalId !== null;
}
function configure(config) {
  if (!config || typeof config !== "object") return false;
  _config = { ..._config, ...config };
  if (_config.scanInterval < 5e3) _config.scanInterval = 5e3;
  if (_config.minAgeToConsiderOrphan < 1e3) _config.minAgeToConsiderOrphan = 1e3;
  if (_config.autoScanEnabled && _state.autoScanIntervalId) {
    disableAutoScan();
    enableAutoScan(_config.scanInterval);
  }
  return true;
}
function getConfig() {
  return { ..._config };
}
function enableAutoCleanup(interval) {
  _config.autoCleanup = true;
  return enableAutoScan(interval);
}
function disableAutoCleanup() {
  _config.autoCleanup = false;
  return { ok: true };
}
function getMetrics() {
  return {
    enabled: _config.enabled,
    autoScanEnabled: isAutoScanEnabled(),
    autoCleanup: _config.autoCleanup,
    scansCount: _state.scansCount,
    lastScan: _state.lastScan,
    orphansDetected: _state.orphansDetected,
    orphansCleaned: _state.orphansCleaned,
    currentOrphanCount: _state.currentOrphans.length
  };
}
function resetMetrics() {
  _state.scansCount = 0;
  _state.orphansDetected = 0;
  _state.orphansCleaned = 0;
}
function healthCheck() {
  const metrics = getMetrics();
  const checks = {
    storeInjected: !!_store,
    closeFunctionInjected: !!_closeOverlay,
    noCurrentOrphans: _state.currentOrphans.length === 0,
    recentScan: !_state.lastScan || Date.now() - _state.lastScan < 12e4
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (!checks.storeInjected) status = "UNHEALTHY";
  else if (!checks.noCurrentOrphans) status = "DEGRADED";
  else if (passed < total) status = "DEGRADED";
  return {
    status,
    score: `${passed}/${total}`,
    checks,
    orphanCount: _state.currentOrphans.length,
    metrics: {
      scans: _state.scansCount,
      detected: _state.orphansDetected,
      cleaned: _state.orphansCleaned
    },
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _config.enabled,
    autoScanEnabled: isAutoScanEnabled(),
    config: getConfig(),
    metrics: getMetrics(),
    currentOrphans: getOrphans(),
    timestamp: Date.now()
  };
}
var orphan_detector_default = {
  inject,
  scan,
  getOrphans,
  hasOrphans,
  cleanup,
  enableAutoScan,
  disableAutoScan,
  isAutoScanEnabled,
  configure,
  getConfig,
  enableAutoCleanup,
  disableAutoCleanup,
  getMetrics,
  resetMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  cleanup,
  configure,
  orphan_detector_default as default,
  disableAutoCleanup,
  disableAutoScan,
  enableAutoCleanup,
  enableAutoScan,
  getConfig,
  getMetrics,
  getOrphans,
  hasOrphans,
  healthCheck,
  info,
  inject,
  isAutoScanEnabled,
  resetMetrics,
  scan
};
