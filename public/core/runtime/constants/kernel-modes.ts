// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.constants.kernel-modes
// PURPOSE: Enum de modos do Application Kernel
// ───────────────────────────────────────────────────────────────
// PROVIDES: KERNEL_MODES, KERNEL_PHASES, AUTH_LEVELS, helpers
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.9.0-STRICT-MODE' as const;
export const MODULE_ID = 'core.runtime.constants.kernel-modes' as const;

/**
 * KERNEL_MODES
 * Modos possíveis do Application Kernel
 * Usar estas constantes ao invés de strings hardcoded
 */
export const KERNEL_MODES = {
  INITIALIZING: 'INITIALIZING',
  NORMAL: 'NORMAL',
  DEGRADED: 'DEGRADED',
  MAINTENANCE: 'MAINTENANCE',
  FAILED: 'FAILED',
  RECOVERY: 'RECOVERY'
} as const;
export type KernelMode = typeof KERNEL_MODES[keyof typeof KERNEL_MODES];

/**
 * KERNEL_PHASES
 * Fases do ciclo de vida do Kernel
 */
export const KERNEL_PHASES = {
  INITIALIZING: 'initializing',
  BOOTING: 'booting',
  READY: 'ready',
  ERROR: 'error',
  SHUTDOWN: 'shutdown'
} as const;
export type KernelPhase = typeof KERNEL_PHASES[keyof typeof KERNEL_PHASES];

/**
 * AUTH_LEVELS
 * Níveis de autenticação
 */
export const AUTH_LEVELS = {
  ANONYMOUS: 0,
  BASIC: 1,
  FULL: 2,
  ADMIN: 3
} as const;
export type AuthLevel = typeof AUTH_LEVELS[keyof typeof AUTH_LEVELS];

// Verificar se modo é operacional
export function isOperationalMode(mode: string): boolean {
  return mode === KERNEL_MODES.NORMAL || mode === KERNEL_MODES.DEGRADED;
}

// Verificar se modo é crítico
export function isCriticalMode(mode: string): boolean {
  return mode === KERNEL_MODES.FAILED || mode === KERNEL_MODES.MAINTENANCE;
}

// Verificar se modo permite UI completa
export function isFullUIMode(mode: string): boolean {
  return mode === KERNEL_MODES.NORMAL;
}

// Obter descrição do modo
export function getModeDescription(mode: string): string {
  const descriptions: Record<string, string> = {
    INITIALIZING: 'Sistema inicializando',
    NORMAL: 'Operacao normal',
    DEGRADED: 'Funcionalidades reduzidas',
    MAINTENANCE: 'Em manutencao',
    FAILED: 'Erro critico',
    RECOVERY: 'Recuperando'
  };
  return descriptions[mode] || 'Modo desconhecido';
}

// Obter classe CSS para o modo
export function getModeClass(mode: string): string {
  return `kernel-mode-${mode || 'UNKNOWN'}`;
}

// Lista de todos os modos válidos
export function getAllModes(): KernelMode[] {
  return Object.values(KERNEL_MODES);
}

// Validar se é um modo válido
export function isValidMode(mode: string): mode is KernelMode {
  return (getAllModes() as string[]).indexOf(mode) !== -1;
}

export default {
  KERNEL_MODES,
  KERNEL_PHASES,
  AUTH_LEVELS,
  isOperationalMode,
  isCriticalMode,
  isFullUIMode,
  getModeDescription,
  getModeClass,
  getAllModes,
  isValidMode
};
