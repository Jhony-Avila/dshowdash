// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-UX-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: UX Enhancements - Modular Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//   createScrollIndicator, createCompactScrollHeader from ./scroll/index.js
//   createValidationShake from ./validation/index.js
//   createSaveIndicator, createConnectionStatus from ./status/index.js
//   createParallaxBackground, enableMorphTransitions, createPiPMode from ./effect...
//   setDepth from ./utils/index.js
//   createEnhancements, createAllEnhancements from ./factory.js
//
// PROVIDES:
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   createScrollIndicator — exported value
//   createCompactScrollHeader — exported value
//   createValidationShake — exported value
//   createSaveIndicator — exported value
//   createConnectionStatus — exported value
//   createParallaxBackground — exported value
//   enableMorphTransitions — exported value
//   createPiPMode — exported value
//   setDepth — exported value
//   createEnhancements — exported value
//   createAllEnhancements — exported value
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

export { VERSION, MODULE_ID } from './constants.js';

// Scroll
export { createScrollIndicator, createCompactScrollHeader } from './scroll/index.js';

// Validation
export { createValidationShake } from './validation/index.js';

// Status
export { createSaveIndicator, createConnectionStatus } from './status/index.js';

// Effects
export { createParallaxBackground, enableMorphTransitions, createPiPMode } from './effects/index.js';

// Utils
export { setDepth } from './utils/index.js';

// Factory
export { createEnhancements, createAllEnhancements } from './factory.js';

// Info & Health
import { VERSION, MODULE_ID } from './constants.js';

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    features: ['scrollIndicator', 'validationShake', 'saveIndicator', 'connectionStatus', 'depthIndicator', 'compactScrollHeader', 'parallaxBackground', 'morphTransitions', 'pipMode']
  };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID };
}

// Default export
import { createScrollIndicator, createCompactScrollHeader } from './scroll/index.js';
import { createValidationShake } from './validation/index.js';
import { createSaveIndicator, createConnectionStatus } from './status/index.js';
import { createParallaxBackground, enableMorphTransitions, createPiPMode } from './effects/index.js';
import { setDepth } from './utils/index.js';
import { createEnhancements, createAllEnhancements } from './factory.js';

export default {
  createScrollIndicator,
  createCompactScrollHeader,
  createValidationShake,
  createSaveIndicator,
  createConnectionStatus,
  createParallaxBackground,
  enableMorphTransitions,
  createPiPMode,
  createEnhancements,
  createAllEnhancements,
  setDepth,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
