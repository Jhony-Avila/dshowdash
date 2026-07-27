// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: config
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   CONFIG — exported value
//   getConfig() — exported function
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

export const MODULE_ID = 'panel-07.core.config';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 07 - Configuration
 * @module panel-07/core/config
 * @version 1.1.0-AAA
 */

export const CONFIG = {
    panelId: 'panel-07',
    apiEndpoint: '/api/v1/panel-07',
    refreshInterval: 30000,
    maxItems: 100,
    defaultPageSize: 20,
    features: {
        autoRefresh: true,
        export: true,
        filtering: true,
        sorting: true
    }
};

export function getConfig(key: keyof typeof CONFIG | undefined): typeof CONFIG | typeof CONFIG[keyof typeof CONFIG] {
    return key ? CONFIG[key] : CONFIG;
}

export default CONFIG;

// ── Backward-compatibility aliases ──────────────────────────────
/** @deprecated Use CONFIG. Alias for backward compatibility. */
export const MAX_CONSECUTIVE_ERRORS = 5;
/** @deprecated Use CONFIG. Alias for backward compatibility. */
export const REQUEST_TIMEOUT = 10000;
/** @deprecated Use CONFIG. Alias for backward compatibility. */
export const CIRCUIT_BREAKER_THRESHOLD = 5;
/** @deprecated Use CONFIG. Alias for backward compatibility. */
export const CIRCUIT_BREAKER_TIMEOUT = 60000;
/** @deprecated Use CONFIG. Alias for backward compatibility. */
export const DEFAULT_PERFORMANCE_METRICS = {
    requestCount: 0,
    errorCount: 0,
    consecutiveErrors: 0,
    avgResponseTime: 0,
    lastRequestTime: 0,
    circuitBreakerTrips: 0
};
/** @deprecated Alias for backward compatibility. Returns a generic error message string. */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'An unexpected error occurred';
}
