// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:image-virtualizer
// PURPOSE: Image Virtualizer - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   LOAD_STRATEGIES — exported value
//   IMAGE_STATES — exported value
//   IMAGE_QUALITY — exported value
//   DEFAULT_CONFIG — exported value
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

export const VERSION = '1.0.0-MODULAR';
export const MODULE_ID = 'container-main:image-virtualizer';

export const LOAD_STRATEGIES = Object.freeze({
  LAZY: 'lazy',
  EAGER: 'eager',
  VIEWPORT: 'viewport',
  PROGRESSIVE: 'progressive'
});

export const IMAGE_STATES = Object.freeze({
  IDLE: 'idle',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error',
  PLACEHOLDER: 'placeholder'
});

export const IMAGE_QUALITY = Object.freeze({
  THUMBNAIL: 'thumbnail',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  ORIGINAL: 'original'
});

export const DEFAULT_CONFIG = Object.freeze({
  rootMargin: '100px',
  threshold: 0.1,
  placeholderColor: '#f0f0f0',
  fadeInDuration: 300,
  retryAttempts: 2,
  retryDelay: 1000,
  maxConcurrent: 4,
  enableWebP: true,
  enableAvif: false,
  cacheDuration: 3600000
});

export default {
  VERSION, MODULE_ID,
  LOAD_STRATEGIES, IMAGE_STATES, IMAGE_QUALITY, DEFAULT_CONFIG
};
