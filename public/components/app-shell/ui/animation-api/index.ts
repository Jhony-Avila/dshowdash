// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: animation-api
// PURPOSE: Entry point da Animation API
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM:
//   ./constants.js — VERSION, MODULE_ID, ANIMATIONS, EASINGS
//   ./core.js — animate, sequence, parallel, stagger
//   ./region.js — transitionIn, transitionOut, crossfade
//   ./control.js — cancel, cancelAll, pause, resume, pauseAll, resumeAll, getActive
//   ./custom.js — registerAnimation, unregisterAnimation, listAnimations
//   ./config.js — configure, getConfig
//   ./subscription.js — subscribe
//   ./health.js — getMetrics, healthCheck, info
// ═══════════════════════════════════════════════════════════════
/**
 * @module AnimationAPI
 * @description API de animações para transições
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

// Constants
export { VERSION, MODULE_ID, ANIMATIONS, EASINGS } from './constants.js';

// Core
export { animate, sequence, parallel, stagger } from './core.js';

// Region
export { transitionIn, transitionOut, crossfade } from './region.js';

// Control
export { cancel, cancelAll, pause, resume, pauseAll, resumeAll, getActive } from './control.js';

// Custom
export { registerAnimation, unregisterAnimation, listAnimations } from './custom.js';

// Config
export { configure, getConfig } from './config.js';

// Subscription
export { subscribe } from './subscription.js';

// Health
export { getMetrics, healthCheck, info } from './health.js';

// Default export
import { VERSION, MODULE_ID, ANIMATIONS, EASINGS } from './constants.js';
import { animate, sequence, parallel, stagger } from './core.js';
import { transitionIn, transitionOut, crossfade } from './region.js';
import { cancel, cancelAll, pause, resume, pauseAll, resumeAll, getActive } from './control.js';
import { registerAnimation, unregisterAnimation, listAnimations } from './custom.js';
import { configure, getConfig } from './config.js';
import { subscribe } from './subscription.js';
import { getMetrics, healthCheck, info } from './health.js';

export default {
    VERSION, MODULE_ID, ANIMATIONS, EASINGS,
    animate, sequence, parallel, stagger,
    transitionIn, transitionOut, crossfade,
    cancel, cancelAll, pause, resume, pauseAll, resumeAll, getActive,
    registerAnimation, unregisterAnimation, listAnimations,
    configure, getConfig, subscribe,
    getMetrics, healthCheck, info
};
