// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.1-FIX-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: nav-rail
// PURPOSE: nav-rail/core/constants.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   createLogger — exported value
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   (none)
//
// LISTENS (eventos):
//   (none)
//
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'nav-rail';
export const VERSION = '5.1.1-FIX';

// Default logger function
export const createLogger = (getPort: (name: string) => unknown) => (level: string, ...args: unknown[]) => {
    const logger = getPort('logger') as Record<string, unknown>;
    if (!logger) return;
    const fn = (logger[level] || logger.info) as ((...a: unknown[]) => void) | undefined;
    if (typeof fn === 'function') fn(`[${MODULE_ID}]`, ...args);
};
