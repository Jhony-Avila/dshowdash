// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.1-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-events
// PURPOSE: Entry point do sistema de eventos por região
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM:
//   ./constants.js — VERSION, MODULE_ID, REGION_EVENTS
//   ./core.js — emit, on, off
//   ./subscription.js — onAny, onGlobal, once, waitFor
//   ./lifecycle.js — init, destroy
//   ./history.js — getHistory, clearHistory, setHistoryLimit, getListenerCounts
//   ./health.js — getMetrics, healthCheck, info
// SIDE EFFECTS: Auto-init on DOMContentLoaded
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionEvents
 * @description Sistema de eventos granulares por região
 * @version 1.0.1-AAA
 * @since 2025-02-02
 */
'use strict';

// Constants
export { VERSION, MODULE_ID, REGION_EVENTS } from './constants.js';

// Core
export { emit, on, off } from './core.js';

// Subscription
export { onAny, onGlobal, once, waitFor } from './subscription.js';

// Lifecycle
export { init, destroy } from './lifecycle.js';

// History
export { getHistory, clearHistory, setHistoryLimit, getListenerCounts } from './history.js';

// Health
export { getMetrics, healthCheck, info } from './health.js';

// Auto-init
import { init } from './lifecycle.js';

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { init(); });
    } else {
        init();
    }
}

// Default export
import { VERSION, MODULE_ID, REGION_EVENTS } from './constants.js';
import { emit, on, off } from './core.js';
import { onAny, onGlobal, once, waitFor } from './subscription.js';
import { destroy } from './lifecycle.js';
import { getHistory, clearHistory, setHistoryLimit, getListenerCounts } from './history.js';
import { getMetrics, healthCheck, info } from './health.js';

export default {
    VERSION, MODULE_ID, EVENTS: REGION_EVENTS,
    emit, on, off, onAny, onGlobal, once, waitFor,
    init, destroy,
    getHistory, clearHistory, setHistoryLimit, getListenerCounts,
    getMetrics, healthCheck, info
};
