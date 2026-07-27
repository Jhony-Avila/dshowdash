// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Overlay Layer Transitions - CSS Generator
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   _transitions, getConfig from ../state.js
//   camelToKebab from ./motion.js
//
// PROVIDES:
//   generateCSS() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { _transitions, getConfig } from '../state.js';
import { camelToKebab } from './motion.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.ui.transitions.helpers.css-generator';

export function generateCSS(transitionName: string) {
  const transition = (_transitions as DynObj)[transitionName];
  if (!transition || !transition.enter) return null;
  
  const prefix = getConfig().cssPrefix;
  
  return `
.${prefix}-${transitionName}-enter {
  ${Object.entries(transition.enter.from).map(([k, v]) => `${camelToKebab(k)}: ${v};`).join('\n  ')}
}
.${prefix}-${transitionName}-enter-active {
  ${Object.entries(transition.enter.to).map(([k, v]) => `${camelToKebab(k)}: ${v};`).join('\n  ')}
  transition: all ${transition.duration}ms ${transition.easing};
}
.${prefix}-${transitionName}-exit {
  ${Object.entries(transition.exit.from).map(([k, v]) => `${camelToKebab(k)}: ${v};`).join('\n  ')}
}
.${prefix}-${transitionName}-exit-active {
  ${Object.entries(transition.exit.to).map(([k, v]) => `${camelToKebab(k)}: ${v};`).join('\n  ')}
  transition: all ${transition.duration}ms ${transition.easing};
}
  `.trim();
}
