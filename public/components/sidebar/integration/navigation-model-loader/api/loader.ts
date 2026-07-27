// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-FIX-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: loader
// PURPOSE: navigation-model-loader/api/loader.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TOKENS, API_ENDPOINTS from ../core/constants.js
//   ERRORS from ../core/contracts.js
//   track from ../telemetry/tracker.js
//
// PROVIDES:
//   loadFromAPI — exported value
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

import { TOKENS, API_ENDPOINTS } from '../core/constants.js';
import { ERRORS } from '../core/contracts.js';
import { track } from '../telemetry/tracker.js';

export const VERSION = '7.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'sidebar.integration.navigation-model-loader.api.loader';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const loadFromAPI = async (options: { timeout?: number; retries?: number; signal?: AbortSignal | null } = {}) => {
    const {
        timeout = TOKENS.API_TIMEOUT,
        retries = TOKENS.RETRY_ATTEMPTS,
        signal = null
    } = options;

    let lastError = null;
    let attempt = 0;

    while (attempt <= retries) {
        attempt++;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            track('api:attempt', { attempt, endpoint: API_ENDPOINTS.NAVIGATION_MODEL });

            const response = await fetch(API_ENDPOINTS.NAVIGATION_MODEL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin',
                signal: signal || controller.signal
            });

            clearTimeout(timeoutId);

            if (response.status === 401 || response.status === 403) {
                track('api:auth-required', { status: response.status });
                return {
                    success: false,
                    error: ERRORS.AUTH,
                    status: response.status,
                    authRequired: true
                };
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const json = await response.json();

            if (!json || typeof json !== 'object') {
                throw new Error('Invalid response format');
            }

            // API returns { ok: true, data: { items: [...], tree: [...] } }
            // We need to check json.ok and extract json.data
            if (json.ok === false) {
                throw new Error(json.error || 'API returned error');
            }

            // Extract the actual data from the wrapper
            const data = json.data || json;

            track('api:success', { attempt, hasItems: !!data.items, hasTree: !!data.tree });

            return {
                success: true,
                data,
                source: 'api',
                attempt
            };

        } catch (error: any) {
            clearTimeout(timeoutId);
            lastError = error;

            const isAbort = error.name === 'AbortError';
            const isTimeout = isAbort || (error.message && error.message.includes('timeout'));

            track('api:error', {
                attempt,
                error: error.message,
                isTimeout,
                willRetry: attempt <= retries
            });

            if (signal && signal.aborted) {
                return {
                    success: false,
                    error: ERRORS.TIMEOUT,
                    aborted: true
                };
            }

            if (attempt <= retries) {
                await wait(TOKENS.RETRY_DELAY * attempt);
            }
        }
    }

    return {
        success: false,
        error: lastError && lastError.message && lastError.message.includes('timeout') ? ERRORS.TIMEOUT : ERRORS.NETWORK,
        message: lastError ? lastError.message : 'Unknown error',
        attempts: attempt
    };
};
