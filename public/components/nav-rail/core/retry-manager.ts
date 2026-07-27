// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.0.0-P1-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-core-retry-manager
// PURPOSE: nav-rail/core/retry-manager.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CircuitBreaker from ./circuit-breaker.js
//
// PROVIDES:
//   setLogger() — exported function
//   RetryManager — exported value
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

import { CircuitBreaker } from './circuit-breaker.js';

export const VERSION = '5.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'nav-rail.core.retry-manager';

let _log: (level: string, msg: string, data?: unknown) => void = () => {};

export function setLogger(logFn: (level: string, msg: string, data?: unknown) => void) {
    _log = logFn;
}

export const RetryManager = {
    async execute(fn: () => Promise<unknown>, options: { maxAttempts?: number; baseDelay?: number; maxDelay?: number; serviceName?: string } = {}) {
        const { maxAttempts = 3, baseDelay = 1000, maxDelay = 10000, serviceName = 'unknown' } = options;

        if (CircuitBreaker.isOpen(serviceName)) {
            _log('warn', `Circuit open for ${serviceName}, using fallback`);
            throw new Error(`Circuit breaker open for ${serviceName}`);
        }

        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const result = await fn();
                CircuitBreaker.recordSuccess(serviceName);
                return result;
            } catch (error: any) {
                lastError = error;
                CircuitBreaker.recordFailure(serviceName, error);

                if (attempt < maxAttempts) {
                    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
                    _log('warn', `${serviceName} attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms`, { error: error.message });
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError;
    }
};

export default RetryManager;
