
// Boot Persistence - #1 Persistência em SessionStorage + #4 Histórico de Boots
// @version 1.1.0-HEALTH-CONTRACT
// @changelog v1.1.0-HEALTH-CONTRACT: healthCheck migrado para HEALTH CONTRACT v1.0.0 (createHealthResult + HEALTH_STATUS)
// @changelog v1.0.1-CONTRACTS: Dependency Contract formalizado
// @description Persiste estado do boot e mantém histórico para análise
// @changelog v1.0.0-PERSISTENCE: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createHealthResult, HEALTH_STATUS from contracts/health-contract.ts
// PROVIDES: saveCurrentBoot(), getCurrentBoot(), getLastSuccessfulBoot(),
//   hasRecentValidBoot(), clearCurrentBoot(), addToHistory(), getHistory(),
//   clearHistory(), analyzeHistory(), configure()
// BROWSER APIs:
//   window.sessionStorage — LEGÍTIMO: current boot state persistence
//   window.localStorage — LEGÍTIMO: boot history persistence across sessions
//   navigator.userAgent — LEGÍTIMO: boot entry metadata (truncated)
// WINDOW ACCESS: window.sessionStorage, window.localStorage (storage APIs)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createHealthResult, HEALTH_STATUS } from '../../contracts/health-contract.ts';

export const VERSION = '1.1.0-HEALTH-CONTRACT';
export const MODULE_ID = 'boot-persistence';

// Chaves de storage
const STORAGE_KEYS = {
  CURRENT_BOOT: '__BOOTSTRAP_V2_CURRENT_BOOT__',
  BOOT_HISTORY: '__BOOTSTRAP_V2_BOOT_HISTORY__',
  LAST_SUCCESSFUL: '__BOOTSTRAP_V2_LAST_SUCCESSFUL__'
};

// Configuração
const CONFIG = {
  maxHistorySize: 10,
  persistenceEnabled: true,
  useSessionStorage: true,  // true = sessionStorage, false = localStorage
  historyInLocalStorage: true  // histórico sempre em localStorage para persistir entre sessões
};

// ============================================================================
// HELPERS
// ============================================================================

interface BootResultInput {
  success: boolean;
  state?: string;
  totalTime?: number;
  phases?: Array<{ id: string; success: boolean; duration: number; degraded?: boolean }>;
  health?: { status: string; score: number } | null;
  degraded?: boolean;
  version?: string;
  errors?: Array<string | { message?: string }>;
  error?: string;
}

interface HistoryEntry {
  id: string;
  success: boolean;
  totalTime: number;
  phasesCompleted: number;
  phasesTotal: number;
  degraded: boolean;
  health: string;
  score: number;
  errors: Array<string | { message?: string }>;
  timestamp: number;
  version: string;
  userAgent: string;
}

interface PersistenceOptions {
  maxHistorySize?: number;
  persistenceEnabled?: boolean;
  useSessionStorage?: boolean;
  historyInLocalStorage?: boolean;
}

function getStorage(forHistory: boolean): Storage | null {
  if (typeof window === 'undefined') return null;
  
  if (forHistory && CONFIG.historyInLocalStorage) {
    return window.localStorage;
  }
  
  return CONFIG.useSessionStorage ? window.sessionStorage : window.localStorage;
}

function safeGet(key: string, forHistory: boolean): unknown {
  try {
    const storage = getStorage(forHistory);
    if (!storage) return null;
    
    const data = storage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e: any) {
    console.warn('[boot-persistence] Failed to read:', key, e.message);
    return null;
  }
}

function safeSet(key: string, value: unknown, forHistory: boolean): boolean {
  try {
    const storage = getStorage(forHistory);
    if (!storage) return false;
    
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e: any) {
    console.warn('[boot-persistence] Failed to write:', key, e.message);
    return false;
  }
}

function safeRemove(key: string, forHistory: boolean): boolean {
  try {
    const storage = getStorage(forHistory);
    if (!storage) return false;
    
    storage.removeItem(key);
    return true;
  } catch (e: any) {
    return false;
  }
}

// ============================================================================
// #1: PERSISTÊNCIA DO BOOT ATUAL
// ============================================================================

/**
 * Salva o estado atual do boot
 */
export function saveCurrentBoot(bootResult: BootResultInput) {
  if (!CONFIG.persistenceEnabled) return false;
  
  const bootData = {
    success: bootResult.success,
    state: bootResult.state,
    totalTime: bootResult.totalTime,
    phases: bootResult.phases ? bootResult.phases.map((p: { id: string; success: boolean; duration: number; degraded?: boolean }) => ({
      id: p.id,
      success: p.success,
      duration: p.duration,
      degraded: p.degraded
    })) : [],
    health: bootResult.health ? {
      status: bootResult.health.status,
      score: bootResult.health.score
    } : null,
    degraded: bootResult.degraded || false,
    timestamp: Date.now(),
    version: bootResult.version || '2.7.0-QUALITY',
    sessionId: getSessionId()
  };
  
  const saved = safeSet(STORAGE_KEYS.CURRENT_BOOT, bootData, false);
  
  // Se sucesso, também salva como último boot bem-sucedido
  if (saved && bootResult.success) {
    safeSet(STORAGE_KEYS.LAST_SUCCESSFUL, bootData, false);
  }
  
  return saved;
}

/**
 * Recupera o estado do boot atual (da sessão)
 */
interface CurrentBootData {
  success: boolean;
  timestamp: number;
  [key: string]: unknown;
}

export function getCurrentBoot(): CurrentBootData | null {
  return safeGet(STORAGE_KEYS.CURRENT_BOOT, false) as CurrentBootData | null;
}

/**
 * Recupera o último boot bem-sucedido
 */
export function getLastSuccessfulBoot() {
  return safeGet(STORAGE_KEYS.LAST_SUCCESSFUL, false);
}

/**
 * Verifica se há um boot recente válido (para skip de re-boot)
 */
export function hasRecentValidBoot(maxAgeMs?: number) {
  if (maxAgeMs === undefined) maxAgeMs = 30000; // 30 segundos padrão
  
  const current = getCurrentBoot();
  if (!current) return false;
  
  const age = Date.now() - current.timestamp;
  return current.success && age < maxAgeMs;
}

/**
 * Limpa o boot atual
 */
export function clearCurrentBoot() {
  return safeRemove(STORAGE_KEYS.CURRENT_BOOT, false);
}

// ============================================================================
// #4: HISTÓRICO DE BOOTS
// ============================================================================

/**
 * Adiciona um boot ao histórico
 */
export function addToHistory(bootResult: BootResultInput) {
  const history = getHistory();
  
  const entry = {
    id: generateBootId(),
    success: bootResult.success,
    totalTime: bootResult.totalTime,
    phasesCompleted: bootResult.phases ? bootResult.phases.filter((p: { success: boolean }) => p.success).length : 0,
    phasesTotal: bootResult.phases ? bootResult.phases.length : 0,
    degraded: bootResult.degraded || false,
    health: bootResult.health ? bootResult.health.status : 'UNKNOWN',
    score: bootResult.health ? bootResult.health.score : 0,
    errors: bootResult.errors ? bootResult.errors.slice(0, 3) : [], // Máximo 3 erros
    timestamp: Date.now(),
    version: bootResult.version || '2.7.0-QUALITY',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 100) : 'unknown'
  };
  
  // @ts-expect-error strict migration — TS2345
  history.unshift(entry); // Adiciona no início
  
  // Limita tamanho do histórico
  while (history.length > CONFIG.maxHistorySize) {
    history.pop();
  }
  
  return safeSet(STORAGE_KEYS.BOOT_HISTORY, history, true);
}

/**
 * Recupera o histórico de boots
 */
export function getHistory(): HistoryEntry[] {
  return (safeGet(STORAGE_KEYS.BOOT_HISTORY, true) as HistoryEntry[] | null) || [];
}

/**
 * Limpa o histórico de boots
 */
export function clearHistory() {
  return safeSet(STORAGE_KEYS.BOOT_HISTORY, [], true);
}

/**
 * Analisa tendências do histórico
 */
export function analyzeHistory() {
  const history = getHistory();
  
  if (history.length === 0) {
    return {
      totalBoots: 0,
      successRate: 0,
      averageTime: 0,
      degradedRate: 0,
      recentTrend: 'UNKNOWN',
      commonErrors: [] as Array<{ error: string; count: number }>
    };
  }

  const successCount = history.filter((h: HistoryEntry) => h.success).length;
  const degradedCount = history.filter((h: HistoryEntry) => h.degraded).length;
  const totalTime = history.reduce((sum: number, h: HistoryEntry) => sum + (h.totalTime || 0), 0);
  
  // Análise de tendência (últimos 3 vs anteriores)
  let recentTrend = 'STABLE';
  if (history.length >= 5) {
    const recent = history.slice(0, 3);
    const older = history.slice(3);
    
    const recentSuccessRate = recent.filter((h: HistoryEntry) => h.success).length / recent.length;
    const olderSuccessRate = older.filter((h: HistoryEntry) => h.success).length / older.length;
    
    if (recentSuccessRate > olderSuccessRate + 0.1) {
      recentTrend = 'IMPROVING';
    } else if (recentSuccessRate < olderSuccessRate - 0.1) {
      recentTrend = 'DEGRADING';
    }
  }
  
  // Erros mais comuns
  const errorCounts: Record<string, number> = {};
  history.forEach((h: HistoryEntry) => {
    if (h.errors) {
      h.errors.forEach((err: string | { message?: string }) => {
        const key = typeof err === 'string' ? err : (err.message || 'Unknown');
        errorCounts[key] = (errorCounts[key] || 0) + 1;
      });
    }
  });
  
  const commonErrors = Object.entries(errorCounts)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5)
    .map(([error, count]) => ({ error, count }));
  
  return {
    totalBoots: history.length,
    successRate: Math.round((successCount / history.length) * 100),
    averageTime: Math.round(totalTime / history.length),
    degradedRate: Math.round((degradedCount / history.length) * 100),
    recentTrend,
    commonErrors,
    lastBoot: history[0] || null,
    oldestBoot: history[history.length - 1] || null
  };
}

// ============================================================================
// HELPERS INTERNOS
// ============================================================================

function generateBootId() {
  return 'boot-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
}

function getSessionId() {
  if (typeof window === 'undefined') return 'unknown';
  
  let sessionId = window.sessionStorage.getItem('__SESSION_ID__');
  if (!sessionId) {
    sessionId = 'sess-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
    window.sessionStorage.setItem('__SESSION_ID__', sessionId);
  }
  return sessionId;
}

// ============================================================================
// API PÚBLICA
// ============================================================================

export function configure(options: PersistenceOptions) {
  if (options.maxHistorySize !== undefined) CONFIG.maxHistorySize = options.maxHistorySize;
  if (options.persistenceEnabled !== undefined) CONFIG.persistenceEnabled = options.persistenceEnabled;
  if (options.useSessionStorage !== undefined) CONFIG.useSessionStorage = options.useSessionStorage;
  if (options.historyInLocalStorage !== undefined) CONFIG.historyInLocalStorage = options.historyInLocalStorage;
}

export function getConfig() {
  return { ...CONFIG };
}

export function info() {
  const analysis = analyzeHistory();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    config: CONFIG,
    currentBoot: getCurrentBoot(),
    lastSuccessful: getLastSuccessfulBoot(),
    historySize: getHistory().length,
    analysis,
    improvements: ['#1-SessionStoragePersistence', '#4-BootHistory']
  };
}

export function healthCheck() {
  var hasStorage = typeof window !== 'undefined' && window.sessionStorage && window.localStorage;
  var analysis = analyzeHistory();
  
  var status: string = HEALTH_STATUS.HEALTHY;
  if (!hasStorage) {
    status = HEALTH_STATUS.DEGRADED;
  }
  
  return createHealthResult({
    status: status,
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      storageAvailable: !!hasStorage,
      persistenceEnabled: CONFIG.persistenceEnabled,
      historyAccessible: analysis.totalBoots >= 0
    },
    details: {
      storageAvailable: !!hasStorage,
      persistenceEnabled: CONFIG.persistenceEnabled,
      historySize: analysis.totalBoots,
      successRate: analysis.successRate,
      recentTrend: analysis.recentTrend
    }
  });
}

export default {
  VERSION,
  MODULE_ID,
  // #1: Persistência
  saveCurrentBoot,
  getCurrentBoot,
  getLastSuccessfulBoot,
  hasRecentValidBoot,
  clearCurrentBoot,
  // #4: Histórico
  addToHistory,
  getHistory,
  clearHistory,
  analyzeHistory,
  // Config
  configure,
  getConfig,
  info,
  healthCheck
};
