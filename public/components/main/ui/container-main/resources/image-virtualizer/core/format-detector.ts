// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: format-detector
// PURPOSE: Image Virtualizer - Format Detector
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   detectFormatSupport() — exported function
//   getFormatSupport() — exported function
//   supportsWebP() — exported function
//   supportsAvif() — exported function
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

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.image-virtualizer.core.format-detector';

const _formatSupport = {
  webp: false,
  avif: false
};

let _detected = false;

export function detectFormatSupport() {
  if (_detected) return { ..._formatSupport };
  
  // WebP detection via canvas
  try {
    const webpCanvas = document.createElement('canvas');
    webpCanvas.width = 1;
    webpCanvas.height = 1;
    _formatSupport.webp = webpCanvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch (e) {
    _formatSupport.webp = false;
  }
  
  // AVIF detection - use feature detection instead of loading test image
  // This avoids ERR_INVALID_URL errors in console
  try {
    // Check if browser supports AVIF via HTMLImageElement.decode or createImageBitmap
    if (typeof createImageBitmap !== 'undefined') {
      // Modern approach: check accept header support
      _formatSupport.avif = CSS.supports('background-image', 'url("data:image/avif,")') || 
                           navigator.userAgent.includes('Chrome/') && parseInt(navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] || '0') >= 85;
    }
  } catch (e) {
    _formatSupport.avif = false;
  }
  
  _detected = true;
  return { ..._formatSupport };
}

export function getFormatSupport() {
  return { ..._formatSupport };
}

export function supportsWebP() {
  return _formatSupport.webp;
}

export function supportsAvif() {
  return _formatSupport.avif;
}

export default { detectFormatSupport, getFormatSupport, supportsWebP, supportsAvif };
