// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: notification-center
// PURPOSE: Entry point do sistema de notificações
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM:
//   ./constants.js — VERSION, MODULE_ID, NOTIFICATION_TYPES, POSITIONS, PRIORITIES
//   ./core.js — show, dismiss, dismissAll, update
//   ./convenience.js — info, success, warning, error, loading, promise
//   ./queries.js — get, getAll, getByType, getQueueSize
//   ./config.js — configure, getConfig, setPosition
//   ./subscription.js — subscribe
//   ./health.js — getMetrics, healthCheck, getInfo
// ═══════════════════════════════════════════════════════════════
/**
 * @module NotificationCenter
 * @description Sistema de notificações avançado
 * @version 1.0.1-FIX-AAA
 * @since 2025-02-02
 */
'use strict';

// Constants
export { VERSION, MODULE_ID, NOTIFICATION_TYPES, NOTIFICATION_POSITIONS, NOTIFICATION_PRIORITIES } from './constants.js';

// Core API
export { show, dismiss, dismissAll, update } from './core.js';

// Convenience Methods
export { info, success, warning, error, loading, promise } from './convenience.js';

// Queries
export { get, getAll, getByType, getQueueSize } from './queries.js';

// Configuration
export { configure, getConfig, setPosition } from './config.js';

// Subscription
export { subscribe } from './subscription.js';

// Health & Metrics
export { getMetrics, healthCheck, getInfo } from './health.js';

// Default export
import { VERSION, MODULE_ID, NOTIFICATION_TYPES, NOTIFICATION_POSITIONS, NOTIFICATION_PRIORITIES } from './constants.js';
import { show, dismiss, dismissAll, update } from './core.js';
import { info, success, warning, error, loading, promise } from './convenience.js';
import { get, getAll, getByType, getQueueSize } from './queries.js';
import { configure, getConfig, setPosition } from './config.js';
import { subscribe } from './subscription.js';
import { getMetrics, healthCheck, getInfo } from './health.js';

export default {
    VERSION, MODULE_ID,
    TYPES: NOTIFICATION_TYPES,
    POSITIONS: NOTIFICATION_POSITIONS,
    PRIORITIES: NOTIFICATION_PRIORITIES,
    show, dismiss, dismissAll, update,
    info: getInfo, success, warning, error, loading, promise,
    get, getAll, getByType, getQueueSize,
    configure, getConfig, setPosition,
    subscribe, getMetrics, healthCheck, getInfo
};
