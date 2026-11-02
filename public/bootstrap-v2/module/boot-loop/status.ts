// Boot Loop Status
// @version 2.6.0-MODULAR
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.6.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: BOOT_LOOP_CONFIG from configs/index.js, getTracker/resetTracker from tracker.js
// PROVIDES: getBootLoopStatus(), resetBootLoopStatus()
// BROWSER-APIS: None
'use strict';

import { BOOT_LOOP_CONFIG } from '../configs/index.js';
import { getTracker, resetTracker } from './tracker.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.module.boot-loop.status';

export function getBootLoopStatus() {
  const tracker = getTracker();
  const now = Date.now();
  const windowStart = now - BOOT_LOOP_CONFIG.windowMs;
  const recentBoots = tracker.boots.filter(function(ts: number) { return ts > windowStart; });
  
  return {
    bootsInWindow: recentBoots.length,
    maxAllowed: BOOT_LOOP_CONFIG.maxBootsInWindow,
    inCooldown: tracker.cooldownUntil && now < tracker.cooldownUntil,
    cooldownRemaining: tracker.cooldownUntil ? Math.max(0, tracker.cooldownUntil - now) : 0,
    loopDetected: tracker.loopDetected,
    config: BOOT_LOOP_CONFIG
  };
}

export function resetBootLoopStatus() {
  resetTracker();
}

export default { getBootLoopStatus, resetBootLoopStatus };
