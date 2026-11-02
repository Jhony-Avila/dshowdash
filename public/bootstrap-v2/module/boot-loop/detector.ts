// Boot Loop Detector
// @version 2.6.1-CONTRACTS
// @changelog v2.6.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.6.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   BOOT_LOOP_CONFIG from ../configs/index.js
//   getTracker, saveTracker from ./tracker.js
//   logError from ../utils/index.js
// RECEIVES: degradationNotifier (param)
// PROVIDES: checkBootLoop()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { BOOT_LOOP_CONFIG } from '../configs/index.js';
import { getTracker, saveTracker } from './tracker.js';
import { logError } from '../utils/index.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.module.boot-loop.detector';

interface DegradationNotifier {
  notify?: (type: string, message: string, data: Record<string, unknown>) => void;
  notifyBootFailed?: (message: string) => void;
  notifyBootDegraded?: (message: string, data: Record<string, unknown>) => void;
  info?: () => Record<string, unknown>;
  reset?: () => void;
}

export function checkBootLoop(degradationNotifier: DegradationNotifier | null) {
  const tracker = getTracker();
  const now = Date.now();
  
  // Em cooldown?
  if (tracker.cooldownUntil && now < tracker.cooldownUntil) {
    const remainingMs = tracker.cooldownUntil - now;

    // @ts-expect-error TS migration - TS2554
    logError('Boot blocked - in cooldown due to boot loop', {
      remainingMs: remainingMs,
      remainingSec: Math.ceil(remainingMs / 1000)
    });
    return {
      allowed: false,
      reason: 'BOOT_LOOP_COOLDOWN',
      remainingMs: remainingMs,
      loopDetected: true
    };
  }
  
  // Cooldown expirou?
  if (tracker.cooldownUntil && now >= tracker.cooldownUntil) {
    tracker.cooldownUntil = null;
    tracker.loopDetected = false;
    tracker.boots = [];
  }
  
  // Filtrar boots na janela
  const windowStart = now - BOOT_LOOP_CONFIG.windowMs;
  tracker.boots = tracker.boots.filter(function(ts: number) {
    return ts > windowStart;
  });
  
  // Loop detectado?
  if (tracker.boots.length >= BOOT_LOOP_CONFIG.maxBootsInWindow) {
    tracker.loopDetected = true;
    tracker.cooldownUntil = now + BOOT_LOOP_CONFIG.cooldownMs;
    saveTracker(tracker);
    

    // @ts-expect-error TS migration - TS2554
    logError('Boot loop detected! Entering cooldown', {
      bootsInWindow: tracker.boots.length,
      maxAllowed: BOOT_LOOP_CONFIG.maxBootsInWindow,
      cooldownMs: BOOT_LOOP_CONFIG.cooldownMs
    });
    
    // Notificar
    if (degradationNotifier && degradationNotifier.notify) {
      degradationNotifier.notify('boot-loop-detected', 'Boot loop detectado - sistema em cooldown', {
        bootsInWindow: tracker.boots.length,
        cooldownMs: BOOT_LOOP_CONFIG.cooldownMs
      });
    }
    
    return {
      allowed: false,
      reason: 'BOOT_LOOP_DETECTED',
      bootsInWindow: tracker.boots.length,
      cooldownMs: BOOT_LOOP_CONFIG.cooldownMs,
      loopDetected: true
    };
  }
  
  // Registrar boot
  tracker.boots.push(now);
  saveTracker(tracker);
  
  return {
    allowed: true,
    bootsInWindow: tracker.boots.length,
    maxAllowed: BOOT_LOOP_CONFIG.maxBootsInWindow,
    loopDetected: false
  };
}

export default { checkBootLoop };
