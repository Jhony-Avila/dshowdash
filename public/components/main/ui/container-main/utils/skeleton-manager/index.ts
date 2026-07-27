// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Skeleton Manager - Orchestrator
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, SKELETON_TYPES, DELAY_VARIANTS from ./constants.js
//   createSkeletonManager from ./core/manager.js
//   info as _info, healthCheck as _healthCheck from ./diagnostics/health.js
//
// PROVIDES:
//   getSkeletonManager() — exported function
//   resetSkeletonManager() — exported function
//   showSkeleton() — exported function
//   hideSkeleton() — exported function
//   showSkeletonForPanel() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   SKELETON_TYPES — exported value
//   DELAY_VARIANTS — exported value
//   createSkeletonManager — exported value
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

// ============================================================================
// IMPORTS
// ============================================================================

import { VERSION, MODULE_ID, SKELETON_TYPES, DELAY_VARIANTS } from './constants.js';
import { createSkeletonManager } from './core/manager.js';
import { info as _info, healthCheck as _healthCheck } from './diagnostics/health.js';

// ============================================================================
// SINGLETON
// ============================================================================

let _instance: Record<string, unknown> | null = null;

/**
 * Obtém instância singleton do skeleton manager
 * @param {Object} options
 * @returns {Object}
 */
export function getSkeletonManager(options: Record<string, unknown>) {
  if (!_instance) {
    _instance = createSkeletonManager(options);
  }
  return _instance;
}

/**
 * Reseta a instância singleton
 */
export function resetSkeletonManager() {
  if (_instance) {
    (_instance.reset as (...args: unknown[]) => unknown)();
    _instance = null;
  }
}

// ============================================================================
// SHORTCUTS
// ============================================================================

/**
 * Mostra skeleton em container
 * @param {HTMLElement} container
 * @param {Object} options
 * @returns {string}
 */
export function showSkeleton(container: HTMLElement, options: Record<string, unknown>) {

  // @ts-expect-error TS migration - TS2554
  return getSkeletonManager().show(container, options);
}

/**
 * Oculta skeleton
 * @param {string|HTMLElement} skeletonIdOrContainer
 * @param {Object} options
 * @returns {boolean}
 */
export function hideSkeleton(skeletonIdOrContainer: unknown, options: Record<string, unknown>) {

  // @ts-expect-error TS migration - TS2554
  return getSkeletonManager().hide(skeletonIdOrContainer, options);
}

/**
 * Mostra skeleton para painel específico
 * @param {HTMLElement} container
 * @param {string} panelId
 * @param {Object} options
 * @returns {string}
 */
export function showSkeletonForPanel(container: HTMLElement, panelId: string, options: Record<string, unknown>) {

  // @ts-expect-error TS migration - TS2554
  return getSkeletonManager().showForPanel(container, panelId, options);
}

// ============================================================================
// DIAGNOSTICS
// ============================================================================

/**
 * Info do módulo
 * @returns {Object}
 */
export function info() {
  return _info();
}

/**
 * Health check
 * @returns {Object}
 */
export function healthCheck() {
  // @ts-expect-error strict migration — TS2345
  return _healthCheck(_instance);
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export { VERSION, MODULE_ID, SKELETON_TYPES, DELAY_VARIANTS };
export { createSkeletonManager };

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  VERSION,
  MODULE_ID,
  SKELETON_TYPES,
  DELAY_VARIANTS,
  createSkeletonManager,
  getSkeletonManager,
  resetSkeletonManager,
  showSkeleton,
  hideSkeleton,
  showSkeletonForPanel,
  info,
  healthCheck
};
