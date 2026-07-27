// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: factory
// PURPOSE: UX Enhancements - Factory
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//   createScrollIndicator, createCompactScrollHeader from ./scroll/index.js
//   createValidationShake from ./validation/index.js
//   createSaveIndicator, createConnectionStatus from ./status/index.js
//   createParallaxBackground, enableMorphTransitions, createPiPMode from ./effect...
//   setDepth from ./utils/index.js
//
// PROVIDES:
//   createEnhancements() — exported function
//   createAllEnhancements() — exported function
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

import { VERSION, MODULE_ID } from './constants.js';
import { createScrollIndicator, createCompactScrollHeader } from './scroll/index.js';
import { createValidationShake } from './validation/index.js';
import { createSaveIndicator, createConnectionStatus } from './status/index.js';
import { createParallaxBackground, enableMorphTransitions, createPiPMode } from './effects/index.js';
import { setDepth } from './utils/index.js';

export function createEnhancements(container: HTMLElement, options: Record<string, unknown> = {}) {
  const {
    scrollIndicator = true,
    validationShake = true,
    saveIndicator = false,
    connectionStatus = false
  } = options;

  const enhancements = {
    scroll: scrollIndicator ? createScrollIndicator(container) : null,
    validation: validationShake ? createValidationShake(container) : null,
    save: saveIndicator ? createSaveIndicator(container) : null,
    connection: connectionStatus ? createConnectionStatus(container) : null
  };

  return {
    init() {

      // @ts-expect-error TS migration - TS2339
      Object.values(enhancements).forEach(e => e?.init?.());
      return this;
    },
    getScroll() { return enhancements.scroll; },
    getValidation() { return enhancements.validation; },
    getSave() { return enhancements.save; },
    getConnection() { return enhancements.connection; },
    shake() { enhancements.validation?.shake(); return this; },
    saving() { enhancements.save?.saving(); return this; },
    saved() { enhancements.save?.saved(); return this; },
    setDepth(depth: number) { setDepth(container, depth); return this; },
    destroy() {
      Object.values(enhancements).forEach(e => e?.destroy?.());
    },
    healthCheck() {
      return {
        status: 'HEALTHY',
        version: VERSION,
        moduleId: MODULE_ID,
        features: {
          scrollIndicator: !!enhancements.scroll?.isInitialized?.(),
          validationShake: !!enhancements.validation,
          saveIndicator: !!enhancements.save?.isInitialized?.(),
          connectionStatus: !!enhancements.connection?.isInitialized?.()
        }
      };
    }
  };
}

export function createAllEnhancements(container: HTMLElement, options: Record<string, unknown> = {}) {
  const {
    scrollIndicator = true,
    validationShake = true,
    saveIndicator = false,
    connectionStatus = false,
    compactScroll = false,
    parallax = false,
    morphTransitions = false,
    pip = false
  } = options;

  const enhancements = {
    scroll: scrollIndicator ? createScrollIndicator(container) : null,
    validation: validationShake ? createValidationShake(container) : null,
    save: saveIndicator ? createSaveIndicator(container) : null,
    connection: connectionStatus ? createConnectionStatus(container) : null,
    compactScroll: compactScroll ? createCompactScrollHeader(container) : null,
    parallax: parallax ? createParallaxBackground(container) : null,
    morph: morphTransitions ? enableMorphTransitions(container) : null,
    pip: pip ? createPiPMode(container) : null
  };

  return {
    init() {

      // @ts-expect-error TS migration - TS2339
      Object.values(enhancements).forEach(e => e?.init?.());
      return this;
    },
    get(name: string) { return (enhancements as Record<string, unknown>)[name]; },
    shake() { enhancements.validation?.shake(); return this; },
    saving() { enhancements.save?.saving(); return this; },
    saved() { enhancements.save?.saved(); return this; },
    enterPiP() { enhancements.pip?.enter(); return this; },
    exitPiP() { enhancements.pip?.exit(); return this; },
    destroy() {

      // @ts-expect-error TS migration - TS2339
      Object.values(enhancements).forEach(e => e?.destroy?.());
    },
    healthCheck() {
      return {
        status: 'HEALTHY',
        version: VERSION,
        moduleId: MODULE_ID,
        features: Object.fromEntries(

          // @ts-expect-error TS migration - TS2339
          Object.entries(enhancements).map(([k, v]) => [k, !!v?.isInitialized?.() || !!v])
        )
      };
    }
  };
}
