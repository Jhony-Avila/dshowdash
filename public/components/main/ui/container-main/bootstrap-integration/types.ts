// ═══════════════════════════════════════════════════════════════
// Bootstrap Shared Types
// ═══════════════════════════════════════════════════════════════
'use strict';

/**
 * Generic manager/service reference. Self-referential callable type
 * that allows both method calls (obj.method?.(...args)) and nested
 * property access (obj.prop?.subProp) without requiring `any`.
 *
 * All values accessed via index are both callable and indexable,
 * enabling the dynamic optional-chaining patterns used throughout
 * the bootstrap system.
 */
export interface ManagerRef {
  (...args: unknown[]): ManagerRef;
  [key: string]: ManagerRef;
}
