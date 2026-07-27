// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: placeholder-generator
// PURPOSE: Image Virtualizer - Placeholder Generator
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_CONFIG from ../config/constants.js
//
// PROVIDES:
//   generatePlaceholder() — exported function
//   generateBlurPlaceholder() — exported function
//   generateColorPlaceholder() — exported function
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

import { DEFAULT_CONFIG } from '../config/constants.js';

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.image-virtualizer.core.placeholder-generator';

export function generatePlaceholder(width: number, height: number, color: string = DEFAULT_CONFIG.placeholderColor as string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect fill="${color}" width="100%" height="100%"/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function generateBlurPlaceholder(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(width, 20);
  canvas.height = Math.min(height, 20);
  const ctx = canvas.getContext('2d');
  
  const gradient = ctx!.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#e0e0e0');
  gradient.addColorStop(1, '#f5f5f5');
  ctx!.fillStyle = gradient;
  ctx!.fillRect(0, 0, canvas.width, canvas.height);
  
  return canvas.toDataURL('image/jpeg', 0.1);
}

export function generateColorPlaceholder(width: number, height: number, color: string) {
  return generatePlaceholder(width, height, color);
}

export default { generatePlaceholder, generateBlurPlaceholder, generateColorPlaceholder };
