// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: constraints
// PURPOSE: Layout Constraints
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_CONSTRAINTS from ./constants.js
//
// PROVIDES:
//   createConstraintsManager() — exported function
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

import { DEFAULT_CONSTRAINTS } from './constants.js';

declare const defaultConstraints: Record<string, unknown>;
export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.layout-manager.constraints';

export function createConstraintsManager(options: Record<string, unknown> = {}) {
  const { defaultConstraints: constraintsOpt = {} } = options as { defaultConstraints?: Record<string, unknown> };

  const _baseConstraints = { ...DEFAULT_CONSTRAINTS, ...constraintsOpt };

  return {
    // Merge constraints
    merge(panelConstraints: Record<string, unknown> = {}) {
      return { ..._baseConstraints, ...panelConstraints };
    },

    // Aplica constraints ao tamanho
    apply(width: number, height: number, constraints: Record<string, number>) {
      let w = Math.max(constraints.minWidth, Math.min(width, constraints.maxWidth));
      let h = Math.max(constraints.minHeight, Math.min(height, constraints.maxHeight));

      if (constraints.aspectRatio) {
        const targetHeight = w / constraints.aspectRatio;
        if (targetHeight <= constraints.maxHeight && targetHeight >= constraints.minHeight) {
          h = targetHeight;
        } else {
          w = h * constraints.aspectRatio;
        }
      }
      
      return { width: Math.round(w), height: Math.round(h) };
    },

    // Valida se tamanho está dentro dos constraints
    validate(width: number, height: number, constraints: Record<string, unknown>) {
      // @ts-expect-error strict migration — TS2345
      const applied = this.apply(width, height, constraints);
      return applied.width === Math.round(width) && applied.height === Math.round(height);
    },

    getDefaults() {
      return { ..._baseConstraints };
    }
  };
}

export default { createConstraintsManager };
