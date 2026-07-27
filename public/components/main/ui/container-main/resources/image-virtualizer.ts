// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: image-virtualizer
// PURPOSE: Image Virtualizer - Wrapper de Compatibilidade
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
//   createImageVirtualizer — exported value
//   getImageVirtualizer — exported value
//   resetGlobalVirtualizer — exported value
//   info — exported value
//   healthCheck — exported value
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

export {
  VERSION, MODULE_ID,
  LOAD_STRATEGIES, IMAGE_STATES, IMAGE_QUALITY,
  createImageVirtualizer, getImageVirtualizer, resetGlobalVirtualizer,
  info, healthCheck,
  default
} from './image-virtualizer/index.js';
