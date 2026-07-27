// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-ui-inline-editor-dom-builder
// PURPOSE: Inline Editor - DOM Builder
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createTriggerButton() — exported function
//   createDoneButton() — exported function
//   createResetButton() — exported function
//   createEditBanner() — exported function
//   createConfirmOverlay() — exported function
//   createDropIndicator() — exported function
//   createAriaLiveRegion() — exported function
//   createPositionBadge() — exported function
//   getToastIcon() — exported function
//   injectStyles() — exported function
//   cleanupDOM() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.4.0-ES6';
export const MODULE_ID = 'header-ui-inline-editor-dom-builder';

let _metrics = { creates: 0 };

const ICONS = {
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  check: '<svg class="hie-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
  reset: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
  success: '<svg class="hie-toast-icon hie-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
  error: '<svg class="hie-toast-icon hie-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  info: '<svg class="hie-toast-icon hie-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  arrowUp: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
  arrowDown: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>',
  arrowLeft: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
  arrowRight: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>'
};

// @ts-expect-error TS migration - TS2769
export function createTriggerButton(onClick: unknown) { _metrics.creates++; const btn = document.createElement('button'); btn.id = 'hie-trigger-btn'; btn.className = 'hie-trigger-btn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Personalizar Header'); btn.setAttribute('title', 'Reorganizar itens do Header (Ctrl+Shift+E)'); btn.setAttribute('data-uarps-trigger', 'trigger:header:customize-open'); btn.innerHTML = ICONS.settings; if (onClick) btn.addEventListener('click', onClick); return btn; }

// @ts-expect-error TS migration - TS2769
export function createDoneButton(onClick: unknown) { _metrics.creates++; const btn = document.createElement('button'); btn.id = 'hie-done-btn'; btn.className = 'hie-done-btn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Concluir edição'); btn.setAttribute('data-uarps-trigger', 'trigger:header:customize-done'); btn.innerHTML = `${ICONS.check}<span class="hie-btn-text">Concluir</span><div class="hie-btn-spinner"></div>`; if (onClick) btn.addEventListener('click', onClick); return btn; }

// @ts-expect-error TS migration - TS2769
export function createResetButton(onClick: unknown) { _metrics.creates++; const btn = document.createElement('button'); btn.id = 'hie-reset-btn'; btn.className = 'hie-reset-btn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Desfazer todas alterações'); btn.setAttribute('data-uarps-trigger', 'trigger:header:customize-reset'); btn.innerHTML = `${ICONS.reset}<span>Resetar</span>`; if (onClick) btn.addEventListener('click', onClick); return btn; }

export function createEditBanner() { _metrics.creates++; const banner = document.createElement('div'); banner.id = 'hie-edit-banner'; banner.className = 'hie-edit-banner'; banner.setAttribute('role', 'status'); banner.innerHTML = `Arraste para reorganizar - <kbd>${ICONS.arrowUp}${ICONS.arrowDown}</kbd> navegar - <kbd>${ICONS.arrowLeft}${ICONS.arrowRight}</kbd> mover - <kbd>Ctrl+Z</kbd> desfazer - <kbd>ESC</kbd> sair`; return banner; }


// @ts-expect-error TS migration - TS2339
export function createConfirmOverlay(onAction) { _metrics.creates++; const overlay = document.createElement('div'); overlay.id = 'hie-confirm-overlay'; overlay.className = 'hie-confirm-overlay'; overlay.innerHTML = '<div class="hie-confirm-dialog" role="alertdialog" aria-labelledby="hie-confirm-title" aria-describedby="hie-confirm-text"><div class="hie-confirm-title" id="hie-confirm-title">Alterações não salvas</div><div class="hie-confirm-text" id="hie-confirm-text">Você tem alterações pendentes. O que deseja fazer?</div><div class="hie-confirm-buttons"><button class="hie-confirm-btn hie-secondary" data-action="cancel" data-uarps-trigger="trigger:header:customize-cancel">Cancelar</button><button class="hie-confirm-btn hie-danger" data-action="discard" data-uarps-trigger="trigger:header:customize-discard">Descartar</button><button class="hie-confirm-btn hie-primary" data-action="save" data-uarps-trigger="trigger:header:customize-save">Salvar e Sair</button></div></div>'; if (onAction) { overlay.addEventListener('click', e => { const action = e.target.dataset.action; if (action) onAction(action); }); } return overlay; }

export function createDropIndicator() { _metrics.creates++; const indicator = document.createElement('div'); indicator.className = 'hie-drop-indicator'; indicator.setAttribute('aria-hidden', 'true'); return indicator; }

export function createAriaLiveRegion() { _metrics.creates++; const region = document.createElement('div'); region.id = 'hie-aria-live'; region.setAttribute('aria-live', 'polite'); region.setAttribute('aria-atomic', 'true'); region.className = 'sr-only'; region.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;'; return region; }

export function createPositionBadge(position: string) { _metrics.creates++; const badge = document.createElement('span'); badge.className = 'hie-position-badge'; badge.setAttribute('aria-hidden', 'true'); badge.textContent = position; return badge; }

export function getToastIcon(type: string) { if (type === 'success') return ICONS.success; if (type === 'error') return ICONS.error; return ICONS.info; }

export function injectStyles() { if (document.getElementById('header-inline-editor-css')) return; const link = document.createElement('link'); link.id = 'header-inline-editor-css'; link.rel = 'stylesheet'; link.href = '/components/header/ui/inline-editor/styles.css'; document.head.appendChild(link); }

export function cleanupDOM() { const ids = ['hie-trigger-btn', 'hie-done-btn', 'hie-reset-btn', 'hie-edit-banner', 'hie-confirm-overlay', 'hie-aria-live', 'header-inline-editor-css']; ids.forEach(id => { const el = document.getElementById(id); if (el) el.remove(); }); }

export function getMetrics() { return { creates: _metrics.creates }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, iconsCount: Object.keys(ICONS).length, metrics: getMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { domBuilderReady: true }, metrics: getMetrics() }; }

export default { createTriggerButton, createDoneButton, createResetButton, createEditBanner, createConfirmOverlay, createDropIndicator, createAriaLiveRegion, createPositionBadge, getToastIcon, injectStyles, cleanupDOM, ICONS, getMetrics, info, healthCheck };
