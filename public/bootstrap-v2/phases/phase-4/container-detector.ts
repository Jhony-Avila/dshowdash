// Phase 4 Container Detector
// @version 4.2.0-MODULAR
// @description Detecção de container existente para attach-first pattern
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v4.2.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: detectExistingContainer()
// BROWSER-APIS: document.getElementById, document.querySelector
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.phases.phase-4.container-detector';

export function detectExistingContainer() {
  if (typeof document === 'undefined') return null;
  
  const existing = document.getElementById('container-main') ||
                   document.querySelector('.dsd-container__content') ||
                   document.querySelector('[data-container-main="true"]') ||
                   document.querySelector('.dsd-container');
  
  if (!existing) return null;
  
  let contentEl = existing;
  let rootEl = existing;
  
  if (existing.classList.contains('dsd-container__content')) {
    rootEl = existing.closest('.dsd-container') || existing.parentElement || existing;
  } else if (existing.classList.contains('dsd-container') || existing.id === 'container-main') {
    contentEl = existing.querySelector('.dsd-container__content') || existing;
    rootEl = existing;
  }
  
  return { rootEl: rootEl, contentEl: contentEl, mode: 'existing' };
}

export default { detectExistingContainer };
