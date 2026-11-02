// Boot Loop Tracker - Storage Operations
// @version 2.6.0-MODULAR
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.6.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: BOOT_LOOP_CONFIG from configs/index.js
// PROVIDES: getTracker(), saveTracker(tracker), resetTracker()
// BROWSER-APIS: sessionStorage
'use strict';

import { BOOT_LOOP_CONFIG } from '../configs/index.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.module.boot-loop.tracker';

export function getTracker() {
  try {
    const data = sessionStorage.getItem(BOOT_LOOP_CONFIG.storageKey);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {}
  return { boots: [], cooldownUntil: null, loopDetected: false };
}

interface BootTracker {
  boots: number[];
  cooldownUntil: number | null;
  loopDetected: boolean;
}

export function saveTracker(tracker: BootTracker) {
  try {
    sessionStorage.setItem(BOOT_LOOP_CONFIG.storageKey, JSON.stringify(tracker));
  } catch (e) {}
}

export function resetTracker() {
  try {
    sessionStorage.removeItem(BOOT_LOOP_CONFIG.storageKey);
  } catch (e) {}
}

export default { getTracker, saveTracker, resetTracker };
