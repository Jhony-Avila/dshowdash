
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-EVENT-CONSTANTS)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-kernel-auto-cleanup
// PURPOSE: Overlay Kernel - Auto Cleanup v1.2.0-EVENT-CONSTANTS
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   OVERLAY_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   inject() — exported function
//   scan() — exported function
//   enable() — exported function
//   disable() — exported function
//   isEnabled() — exported function
//   configure() — exported function
//   getConfig() — exported function
//   setMaxAge() — exported function
//   exempt() — exported function
//   unexempt() — exported function
//   exemptType() — exported function
//   unexemptType() — exported function
//   getExpired() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   OVERLAY_EVENT_NAMES.AUTO_CLEANED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { OVERLAY_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.2.0-EVENT-CONSTANTS';
export const MODULE_ID = 'overlay-kernel-auto-cleanup';

// Configuração padrão
const DEFAULT_CONFIG = {
  enabled: false,
  scanInterval: 10000,
  defaultMaxAge: 300000,
  maxAgeByType: {
    toast: 10000,
    loading: 60000,
    modal: 0,
    dialog: 0,
    drawer: 0,
    sheet: 180000
  },
  exemptTypes: ['system-modal', 'login-modal', 'error-modal'],
  exemptIds: [] as DynObj,
  closeReason: 'auto-cleanup-expired',
  onCleanup: null as DynObj
};

// Estado interno
let _config = { ...DEFAULT_CONFIG };
let _state = {
  enabled: false,
  intervalId: null as DynObj,
  lastScan: null as DynObj,
  cleanedCount: 0,
  scansCount: 0,
  exemptedCount: 0,
  startTime: null as DynObj
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
 * Calcula idade do overlay em ms
 */
function getOverlayAge(overlay: DynObj) {
  if (!overlay) return 0;
  const createdAt = overlay.createdAt || overlay.runtime?.createdAt || overlay.meta?.createdAt;
  if (!createdAt) return 0;
  return Date.now() - createdAt;
}

/**
 * Obtém max age para um tipo específico
 */
function getMaxAge(type: DynObj) {
  if ((_config.maxAgeByType as DynObj)[type] !== undefined) {
    return (_config.maxAgeByType as DynObj)[type];
  }
  return _config.defaultMaxAge;
}

/**
 * Verifica se overlay está isento de cleanup
 */
function isExempt(overlay: DynObj) {
  if (!overlay) return true;

  // Verificar por ID
  if (_config.exemptIds.includes(overlay.id)) {
    return true;
  }

  // Verificar por tipo
  const typeId = overlay.typeId || overlay.type;
  if (_config.exemptTypes.includes(typeId)) {
    return true;
  }

  // Verificar flag no overlay
  if (overlay.config?.noAutoCleanup || overlay.meta?.exempt) {
    return true;
  }

  // Max age 0 = sem limite
  const maxAge = getMaxAge(typeId);
  if (maxAge === 0) {
    return true;
  }

  return false;
}

/**
 * Verifica se overlay expirou
 */
function isExpired(overlay: DynObj) {
  if (isExempt(overlay)) return false;

  const typeId = overlay.typeId || overlay.type;
  const maxAge = getMaxAge(typeId);
  const age = getOverlayAge(overlay);

  return age > maxAge;
}

/**
 * Executa scan e cleanup
 */
export function scan() {
  if (!_store) {
    console.debug(`[${MODULE_ID}] Store not injected, cannot scan`);
    return { scanned: 0, cleaned: 0, exempted: 0, errors: ['store-not-injected'] };
  }

  _state.lastScan = Date.now();
  _state.scansCount++;

  const stack = _store.getStack ? _store.getStack() : [];
  const overlays = _store.getOverlays ? _store.getOverlays() : {};

  const result = {
    scanned: 0,
    cleaned: 0,
    exempted: 0,
    expired: [] as DynObj,
    errors: [] as DynObj
  };

  for (const id of stack) {
    const overlay = overlays[id];
    if (!overlay) continue;

    result.scanned++;

    if (isExempt(overlay)) {
      result.exempted++;
      _state.exemptedCount++;
      continue;
    }

    if (isExpired(overlay)) {
      result.expired.push({
        id: overlay.id,
        type: overlay.type || overlay.typeId,
        age: getOverlayAge(overlay),
        maxAge: getMaxAge(overlay.type || overlay.typeId)
      });

      // Tentar fechar
      if (_closeOverlay) {
        try {
          const closeResult = _closeOverlay(overlay.id, _config.closeReason);
          if (closeResult?.ok !== false) {
            result.cleaned++;
            _state.cleanedCount++;

            // Callback
            if (typeof _config.onCleanup === 'function') {
              try {
                _config.onCleanup(overlay, 'expired');
              } catch (e) {}
            }

            // Emitir evento
            if (_eventBus?.emit) {
              _eventBus.emit(OVERLAY_EVENT_NAMES.AUTO_CLEANED, {
                id: overlay.id,
                type: overlay.type,
                reason: 'expired',
                age: getOverlayAge(overlay)
              });
            }
          } else {
            result.errors.push(`failed-to-close:${overlay.id}`);
          }
        } catch (error: any) {
          result.errors.push(`error-closing:${overlay.id}:${error.message}`);
        }
      } else {
        result.errors.push('close-function-not-injected');
      }
    }
  }

  return result;
}

/**
 * Inicia auto-cleanup com intervalo
 */
export function enable(config = {}) {
  if (_state.enabled) {
    disable();
  }

  // Aplicar configuração
  if (Object.keys(config).length > 0) {
    configure(config);
  }

  _config.enabled = true;
  _state.enabled = true;
  _state.startTime = Date.now();

  // Iniciar intervalo
  _state.intervalId = setInterval(() => {
    if (_state.enabled) {
      scan();
    }
  }, _config.scanInterval);

  // Scan inicial
  scan();

  return {
    ok: true,
    enabled: true,
    scanInterval: _config.scanInterval,
    startTime: _state.startTime
  };
}

/**
 * Para auto-cleanup
 */
export function disable() {
  _config.enabled = false;
  _state.enabled = false;

  if (_state.intervalId) {
    clearInterval(_state.intervalId);
    _state.intervalId = null;
  }

  return { ok: true, enabled: false };
}

/**
 * Verifica se está habilitado
 */
export function isEnabled() {
  return _state.enabled;
}

/**
 * Atualiza configuração
 */
export function configure(config: DynObj) {
  if (!config || typeof config !== 'object') return false;

  // Merge maxAgeByType
  if (config.maxAgeByType) {
    _config.maxAgeByType = { ..._config.maxAgeByType, ...config.maxAgeByType };
    delete config.maxAgeByType;
  }

  // Merge exemptTypes
  if (config.exemptTypes) {
    _config.exemptTypes = [...new Set([..._config.exemptTypes, ...config.exemptTypes])];
    delete config.exemptTypes;
  }

  // Merge exemptIds
  if (config.exemptIds) {
    _config.exemptIds = [...new Set([..._config.exemptIds, ...config.exemptIds])];
    delete config.exemptIds;
  }

  _config = { ..._config, ...config };

  // Reiniciar intervalo se ativo e scanInterval mudou
  if (_state.enabled && config.scanInterval) {
    disable();
    enable();
  }

  return true;
}

/**
 * Retorna configuração atual
 */
export function getConfig() {
  return { ..._config, maxAgeByType: { ..._config.maxAgeByType } };
}

/**
 * Define max age para um tipo
 */
export function setMaxAge(type: DynObj, ms: number) {
  if (typeof type !== 'string' || typeof ms !== 'number') return false;
  (_config.maxAgeByType as DynObj)[type] = Math.max(0, ms);
  return true;
}

/**
 * Adiciona overlay à lista de isentos
 */
export function exempt(id: DynObj) {
  if (!_config.exemptIds.includes(id)) {
    _config.exemptIds.push(id);
  }
}

/**
 * Remove overlay da lista de isentos
 */
export function unexempt(id: DynObj) {
  _config.exemptIds = _config.exemptIds.filter((i: number) => i !== id);
}

/**
 * Adiciona tipo à lista de isentos
 */
export function exemptType(type: DynObj) {
  if (!_config.exemptTypes.includes(type)) {
    _config.exemptTypes.push(type);
  }
}

/**
 * Remove tipo da lista de isentos
 */
export function unexemptType(type: DynObj) {
  _config.exemptTypes = _config.exemptTypes.filter(t => t !== type);
}

/**
 * Verifica overlays expirados sem limpar
 */
export function getExpired() {
  if (!_store) return [];

  const stack = _store.getStack ? _store.getStack() : [];
  const overlays = _store.getOverlays ? _store.getOverlays() : {};
  const expired = [];

  for (const id of stack) {
    const overlay = overlays[id];
    if (overlay && isExpired(overlay)) {
      expired.push({
        id: overlay.id,
        type: overlay.type || overlay.typeId,
        age: getOverlayAge(overlay),
        maxAge: getMaxAge(overlay.type || overlay.typeId)
      });
    }
  }

  return expired;
}

/**
 * Retorna métricas
 */
export function getMetrics() {
  return {
    enabled: _state.enabled,
    cleanedCount: _state.cleanedCount,
    scansCount: _state.scansCount,
    exemptedCount: _state.exemptedCount,
    lastScan: _state.lastScan,
    uptime: _state.startTime ? Date.now() - _state.startTime : 0,
    currentExpired: getExpired().length
  };
}

/**
 * Reseta métricas
 */
export function resetMetrics() {
  _state.cleanedCount = 0;
  _state.scansCount = 0;
  _state.exemptedCount = 0;
}

/**
 * Health check
 */
export function healthCheck() {
  const metrics = getMetrics();
  const checks = {
    storeInjected: !!_store,
    closeFunctionInjected: !!_closeOverlay,
    configValid: _config.scanInterval > 0,
    noExpiredBacklog: metrics.currentExpired < 10
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  let status = 'HEALTHY';
  if (!_state.enabled) status = 'DEGRADED';
  else if (!checks.storeInjected || !checks.closeFunctionInjected) status = 'UNHEALTHY';
  else if (!checks.noExpiredBacklog) status = 'DEGRADED';

  return {
    status,
    score: `${passed}/${total}`,
    checks,
    enabled: _state.enabled,
    metrics: {
      cleaned: _state.cleanedCount,
      scans: _state.scansCount,
      expiredBacklog: metrics.currentExpired
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
    enabled: _state.enabled,
    config: getConfig(),
    metrics: getMetrics(),
    expired: getExpired(),
    timestamp: Date.now()
  };
}

// Export default
export default {
  inject,
  scan,
  enable,
  disable,
  isEnabled,
  configure,
  getConfig,
  setMaxAge,
  exempt,
  unexempt,
  exemptType,
  unexemptType,
  getExpired,
  getMetrics,
  resetMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
