
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-kernel-orphan-detector
// PURPOSE: Overlay Kernel - Orphan Detector v1.0.0
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   inject() — exported function
//   scan() — exported function
//   getOrphans() — exported function
//   hasOrphans() — exported function
//   cleanup() — exported function
//   enableAutoScan() — exported function
//   disableAutoScan() — exported function
//   isAutoScanEnabled() — exported function
//   configure() — exported function
//   getConfig() — exported function
//   enableAutoCleanup() — exported function
//   disableAutoCleanup() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0';
export const MODULE_ID = 'overlay-kernel-orphan-detector';

// Configuração padrão
const DEFAULT_CONFIG = {
  enabled: true,
  autoScanEnabled: false,
  scanInterval: 30000,
  minAgeToConsiderOrphan: 5000,
  autoCleanup: false,
  containerSelector: '#overlay-container',
  overlaySelector: '[data-overlay-id]',
  onOrphanDetected: null as DynObj,
  onOrphanCleaned: null as DynObj
};

// Estado interno
let _config = { ...DEFAULT_CONFIG };
let _state = {
  autoScanIntervalId: null as DynObj,
  lastScan: null as DynObj,
  scansCount: 0,
  orphansDetected: 0,
  orphansCleaned: 0,
  currentOrphans: [] as DynObj
};

// Referências externas
let _store: DynObj = null;
let _closeOverlay: DynObj = null;
let _eventBus: DynObj = null;

/**
 * Injeta dependências
 */
export function inject(dependencies: DynObj) {
  if (dependencies.store) _store = dependencies.store;
  if (dependencies.closeOverlay) _closeOverlay = dependencies.closeOverlay;
  if (dependencies.eventBus) _eventBus = dependencies.eventBus;
}

/**
 * Emite evento
 */
function emit(event: string, data: DynObj) {
  if (_eventBus?.emit) {
    _eventBus.emit(event, { ...data, moduleId: MODULE_ID, timestamp: Date.now() });
  }
}

/**
 * Obtém elementos DOM de overlays
 */
function getDOMOverlayIds() {
  if (typeof document === 'undefined') return [];
  
  const container = document.querySelector(_config.containerSelector);
  if (!container) {
    // Tentar fallback
    const fallbackContainer = document.getElementById('overlay-container') || 
                              document.querySelector('[data-overlay-container]');
    if (!fallbackContainer) return [];
    
    const elements = fallbackContainer.querySelectorAll(_config.overlaySelector);
    return Array.from(elements).map(el => (el as HTMLElement).dataset.overlayId).filter(Boolean);
  }

  const elements = container.querySelectorAll(_config.overlaySelector);
  return Array.from(elements).map(el => (el as HTMLElement).dataset.overlayId).filter(Boolean);
}

/**
 * Obtém idade do overlay em ms
 */
function getOverlayAge(overlay: DynObj) {
  if (!overlay) return 0;
  const createdAt = overlay.runtime?.createdAt || 
                    overlay.runtime?.openedAt || 
                    overlay.createdAt || 
                    overlay.meta?.createdAt;
  if (!createdAt) return Infinity; // Sem data = considerar antigo
  return Date.now() - createdAt;
}

/**
 * Verifica se um overlay específico é órfão
 */
function isOrphan(id: DynObj, overlay: DynObj, domIds: DynObj) {
  // Se não está no DOM
  if (!domIds.includes(id)) {
    // Verificar idade mínima
    const age = getOverlayAge(overlay);
    if (age >= _config.minAgeToConsiderOrphan) {
      return true;
    }
  }
  return false;
}

/**
 * Executa scan para detectar órfãos
 */
export function scan() {
  if (!_store) {
    return { 
      ok: false, 
      error: 'store-not-injected',
      orphans: [] as DynObj,
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
      // Overlay na stack mas não no store = definitivamente órfão
      orphans.push({
        id,
        type: 'unknown',
        reason: 'not-in-store',
        age: 0,
        inDOM: domIds.includes(id)
      });
      continue;
    }
    
    if (isOrphan(id, overlay, domIds)) {
      orphans.push({
        id,
        type: overlay.type || 'unknown',
        reason: 'not-in-dom',
        age: getOverlayAge(overlay),
        inDOM: false,
        scope: overlay.scope
      });
    }
  }
  
  // Atualizar estado
  _state.currentOrphans = orphans;
  _state.orphansDetected += orphans.length;
  
  // Callback e evento
  if (orphans.length > 0) {
    if (typeof _config.onOrphanDetected === 'function') {
      try {
        _config.onOrphanDetected(orphans);
      } catch (e) {}
    }
    emit('orphan-detector:orphans-found', { count: orphans.length, orphans });
  }
  
  return {
    ok: true,
    orphans,
    scanned: stack.length,
    domCount: domIds.length,
    timestamp: _state.lastScan
  };
}

/**
 * Retorna órfãos atuais (do último scan)
 */
export function getOrphans() {
  return [..._state.currentOrphans];
}

/**
 * Verifica se há órfãos
 */
export function hasOrphans() {
  return _state.currentOrphans.length > 0;
}

/**
 * Limpa órfãos detectados
 */
export function cleanup() {
  if (!_closeOverlay) {
    return {
      ok: false,
      error: 'close-function-not-injected',
      cleaned: 0
    };
  }
  
  // Fazer scan primeiro para garantir lista atualizada
  scan();
  
  const orphans = [..._state.currentOrphans];
  const cleaned: DynObj[] = [];
  const failed = [];
  
  for (const orphan of orphans) {
    try {
      const result = _closeOverlay(orphan.id, 'orphan-cleanup');
      if (result?.ok !== false) {
        cleaned.push(orphan.id);
        _state.orphansCleaned++;
        
        if (typeof _config.onOrphanCleaned === 'function') {
          try {
            _config.onOrphanCleaned(orphan);
          } catch (e) {}
        }
      } else {
        failed.push({ id: orphan.id, reason: result?.reason || 'unknown' });
      }
    } catch (error: any) {
      failed.push({ id: orphan.id, reason: error.message });
    }
  }
  
  // Atualizar lista de órfãos
  _state.currentOrphans = _state.currentOrphans.filter(
    (o: DynObj) => !cleaned.includes(o.id)
  );
  
  if (cleaned.length > 0) {
    emit('orphan-detector:cleanup-complete', { cleaned: cleaned.length, failed: failed.length });
  }
  
  return {
    ok: true,
    cleaned,
    failed,
    cleanedCount: cleaned.length,
    failedCount: failed.length
  };
}

/**
 * Habilita auto-scan
 */
export function enableAutoScan(interval: number) {
  if (_state.autoScanIntervalId) {
    disableAutoScan();
  }
  
  const scanInterval = interval || _config.scanInterval;
  _config.autoScanEnabled = true;
  
  _state.autoScanIntervalId = setInterval(() => {
    const result = scan();
    
    // Auto-cleanup se configurado
    if (_config.autoCleanup && result.orphans.length > 0) {
      cleanup();
    }
  }, scanInterval);
  
  // Scan inicial
  scan();
  
  return {
    ok: true,
    interval: scanInterval,
    autoCleanup: _config.autoCleanup
  };
}

/**
 * Desabilita auto-scan
 */
export function disableAutoScan() {
  _config.autoScanEnabled = false;
  
  if (_state.autoScanIntervalId) {
    clearInterval(_state.autoScanIntervalId);
    _state.autoScanIntervalId = null;
  }
  
  return { ok: true };
}

/**
 * Verifica se auto-scan está ativo
 */
export function isAutoScanEnabled() {
  return _config.autoScanEnabled && _state.autoScanIntervalId !== null;
}

/**
 * Atualiza configuração
 */
export function configure(config: DynObj) {
  if (!config || typeof config !== 'object') return false;
  
  _config = { ..._config, ...config };
  
  // Validar limites
  if (_config.scanInterval < 5000) _config.scanInterval = 5000;
  if (_config.minAgeToConsiderOrphan < 1000) _config.minAgeToConsiderOrphan = 1000;
  
  // Reiniciar auto-scan se ativo
  if (_config.autoScanEnabled && _state.autoScanIntervalId) {
    disableAutoScan();
    enableAutoScan(_config.scanInterval);
  }
  
  return true;
}

/**
 * Retorna configuração atual
 */
export function getConfig() {
  return { ..._config };
}

/**
 * Habilita auto-cleanup junto com auto-scan
 */
export function enableAutoCleanup(interval: number) {
  _config.autoCleanup = true;
  return enableAutoScan(interval);
}

/**
 * Desabilita auto-cleanup
 */
export function disableAutoCleanup() {
  _config.autoCleanup = false;
  return { ok: true };
}

/**
 * Retorna métricas
 */
export function getMetrics() {
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

/**
 * Reseta métricas
 */
export function resetMetrics() {
  _state.scansCount = 0;
  _state.orphansDetected = 0;
  _state.orphansCleaned = 0;
}

/**
 * Health check
 */
export function healthCheck() {
  const metrics = getMetrics();
  
  const checks = {
    storeInjected: !!_store,
    closeFunctionInjected: !!_closeOverlay,
    noCurrentOrphans: _state.currentOrphans.length === 0,
    recentScan: !_state.lastScan || (Date.now() - _state.lastScan) < 120000
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  let status = 'HEALTHY';
  if (!checks.storeInjected) status = 'UNHEALTHY';
  else if (!checks.noCurrentOrphans) status = 'DEGRADED';
  else if (passed < total) status = 'DEGRADED';
  
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

/**
 * Info do módulo
 */
export function info() {
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

// Export default
export default {
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
