// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: tracker
// PURPOSE: navigation-model-loader/telemetry/tracker.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID, VERSION from ../core/constants.js
//
// PROVIDES:
//   track() — exported function
//   trackLoad() — exported function
//   trackError() — exported function
//   trackCache() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.DEBUG_NAV_LOADER
//   window.DShow
//   window.telemetry
// ═══════════════════════════════════════════════════════════════

'use strict';

import { MODULE_ID, VERSION } from '../core/constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


const getGlobalTelemetry = () => (window as any).DShow?.telemetry || (window as any).telemetry || null;

export const track = (event: string, data: DynObj = {}) => {
    const telemetry = getGlobalTelemetry();
    const payload = {
        module: MODULE_ID,
        version: VERSION,
        event: `${MODULE_ID}:${event}`,
        timestamp: Date.now(),
        ...data
    };

    if (telemetry?.track) {
        try {
            telemetry.track(payload.event, payload);
        } catch (e) {
            // Silent fail
        }
    }

    if ((window as any).DShow?.debug || (window as any).DEBUG_NAV_LOADER) {
        console.debug(`[${MODULE_ID}]`, event, data);
    }
};

export const trackLoad = (source: DynObj, duration: number, success = true) => {
    track('load:complete', {
        source,
        duration,
        success
    });
};

export const trackError = (error: Error, context: DynObj = {}) => {
    track('error', {
        error: error?.message || String(error),
        stack: error?.stack?.substring(0, 200),
        ...context
    });
};

export const trackCache = (action: DynObj, hit = false) => {
    track(`cache:${action}`, { hit });
};
