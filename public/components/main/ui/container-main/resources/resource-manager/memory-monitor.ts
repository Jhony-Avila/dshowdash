// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:resource-manager:memory-monitor
// PURPOSE: Resource Manager - Memory Monitor
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getResourceStats from ../../contracts/resource-contract.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createMemoryMonitor() — exported function
//   info() — exported function
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

import { getResourceStats } from '../../contracts/resource-contract.js';

export const VERSION = '2.0.0-MODULAR';
export const MODULE_ID = 'container-main:resource-manager:memory-monitor';

// Cria instância do Memory Monitor
export function createMemoryMonitor(options: Record<string, any> = {}) {
  const {
    warningThreshold,
    criticalThreshold,
    checkInterval = 30000,
    maxHistorySize = 100,
    onWarning,
    onCritical,
    onCheck
  } = options;

  let _checkTimer: ReturnType<typeof setInterval> | null = null;
  let _destroyed = false;
  let _lastCheck: Record<string, unknown> | null = null;
  const _history: unknown[] = [];

  // Executa verificação de memória
  function check(panelStats: Record<string, any> = {}) {
    if (_destroyed) return null;

    const stats = getResourceStats();
    const memoryUsage = stats.totalMemoryEstimate;

    // Registra no histórico
    _history.push({ timestamp: Date.now(), usage: memoryUsage });
    if (_history.length > maxHistorySize) _history.shift();

    _lastCheck = {
      timestamp: Date.now(),
      memoryUsage,
      resourceCount: stats.total,
      byType: stats.byType,
      byState: stats.byState,
      byPanel: panelStats
    };

    // Verifica thresholds
    if (memoryUsage >= criticalThreshold) {
      onCritical?.(memoryUsage);
    } else if (memoryUsage >= warningThreshold) {
      onWarning?.(memoryUsage);
    }

    onCheck?.(_lastCheck);
    return _lastCheck;
  }

  // Inicia monitoramento automático
  function start(getPanelStats: (() => Record<string, unknown>) | null) {
    if (_checkTimer) return;
    _checkTimer = setInterval(() => {
      const panelStats = getPanelStats?.() || {};
      check(panelStats);
    }, checkInterval);
    check(getPanelStats?.() || {});
  }

  // Para monitoramento
  function stop() {
    if (_checkTimer) {
      clearInterval(_checkTimer);
      _checkTimer = null;
    }
  }

  // Obtém último check
  function getLastCheck() {
    return _lastCheck ? { ...(_lastCheck as Record<string, unknown>) } : null;
  }

  // Obtém histórico
  function getHistory() {
    return [..._history];
  }

  // Verifica se está em estado crítico
  function isCritical() {
    const stats = getResourceStats();
    return stats.totalMemoryEstimate >= criticalThreshold;
  }

  // Verifica se está em warning
  function isWarning() {
    const stats = getResourceStats();
    const usage = stats.totalMemoryEstimate;
    return usage >= warningThreshold && usage < criticalThreshold;
  }

  // Destroy
  function destroy() {
    _destroyed = true;
    stop();
    _history.length = 0;
    _lastCheck = null;
  }

  return {
    check,
    start,
    stop,
    getLastCheck,
    getHistory,
    isCritical,
    isWarning,
    isMonitoring: () => !!_checkTimer,
    destroy
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ['createMemoryMonitor']
  };
}

export default {
  VERSION,
  MODULE_ID,
  createMemoryMonitor,
  info
};
