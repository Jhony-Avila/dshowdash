// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.modal-manager-global.ui.renderer
// PURPOSE: Modal Manager Global Renderer - DOM stack rendering
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract RENDER_STACK - renderStack() renders modal stack
// @contract RENDER_MODAL - renderModal() renders single modal
// @contract CREATE_ELEMENT - createModalElement() creates modal DOM
// @contract UPDATE_ELEMENT - updateModalElement() updates modal DOM
// @contract BUILD_CLASSES - buildModalClasses() builds CSS classes
// @contract CLEAR - clear() clears all modals
// @contract GET_ELEMENT - getModalElement() gets modal element by id
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Container from ./container.js
//   Accessibility from ../core/accessibility.js
//   escapeHtml from ../utils/helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderStack() — exported function
//   renderModal() — exported function
//   createModalElement() — exported function
//   updateModalElement() — exported function
//   buildModalClasses() — exported function
//   clear() — exported function
//   getModalElement() — exported function
//   getVersion() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: document.createElement, document.querySelectorAll
// ───────────────────────────────────────────────────────────────
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.0.1-ENTERPRISE: Initial enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'modal-manager-global.ui.renderer';

import Container from './container.js';
import Accessibility from '../core/accessibility.js';
import { escapeHtml } from '../utils/helpers.js';


function renderStack(modals: Record<string, unknown>[]) { const stackContainer = Container.getStack(); if (!stackContainer) return; const existingIds = new Set(modals.map(m => m.id)); const toRemove = stackContainer.querySelectorAll('[data-modal-id]'); toRemove.forEach(el => { if (!existingIds.has(el.getAttribute('data-modal-id'))) { el.remove(); } }); const visibleModals = modals.filter(m => (m.runtime as Record<string, unknown>).visible); const topModal = visibleModals[visibleModals.length - 1]; if (topModal && topModal.backdrop && (topModal.backdrop as Record<string, unknown>).visible) { const bd = topModal.backdrop as Record<string, unknown>; Container.updateBackdrop(true, { opacity: bd.opacity, blur: bd.blur, clickToClose: topModal.closeOnBackdrop }); } else { Container.updateBackdrop(false); } modals.forEach((modal, index) => { renderModal(modal, index); }); Container.updateAriaHidden(modals.length > 0); if (topModal && topModal.focusTrap) { const el = stackContainer.querySelector(`[data-modal-id="${topModal.id}"]`); if (el) { Accessibility.activateFocusTrap(el as HTMLElement); Accessibility.hideBackgroundFromScreenReaders(Container.getRoot() as HTMLElement); } } else { Accessibility.deactivateFocusTrap(); Accessibility.restoreBackgroundForScreenReaders(); } }

function renderModal(modal: Record<string, unknown>, stackIndex: number) { const stackContainer = Container.getStack(); if (!stackContainer) return; let element = stackContainer.querySelector(`[data-modal-id="${modal.id}"]`) as HTMLElement | null; if (!element) { element = createModalElement(modal); stackContainer.appendChild(element); } updateModalElement(element, modal, stackIndex); return element; }

function createModalElement(modal: Record<string, unknown>) { const element = document.createElement('div'); element.setAttribute('data-modal-id', modal.id as string); element.className = buildModalClasses(modal); element.innerHTML = `<div class="modal-content" role="document">${modal.showCloseButton ? '<button class="modal-close-btn" aria-label="Fechar modal" data-close><span aria-hidden="true">&times;</span></button>' : ''}${modal.title ? `<div class="modal-header"><h2 class="modal-title" id="modal-title-${modal.id}">${escapeHtml(modal.title as string)}</h2></div>` : ''}<div class="modal-body" id="modal-body-${modal.id}">${modal.content || ''}</div></div>`; Accessibility.applyAriaAttributes(element, modal as Record<string, unknown> & { aria?: { label?: string; labelledBy?: string; describedBy?: string } }); if (modal.title) { element.setAttribute('aria-labelledby', `modal-title-${modal.id}`); } element.setAttribute('aria-describedby', `modal-body-${modal.id}`); return element; }

function updateModalElement(element: HTMLElement, modal: Record<string, unknown>, stackIndex: number) { const runtime = modal.runtime as Record<string, unknown>; element.className = buildModalClasses(modal); element.setAttribute('data-modal-type', modal.type as string); element.setAttribute('data-modal-size', modal.size as string); element.setAttribute('data-visible', runtime.visible ? 'true' : 'false'); element.setAttribute('data-closing', runtime.closing ? 'true' : 'false'); element.style.zIndex = String(modal.zIndex || (2000 + stackIndex * 10)); if (modal.position) { element.setAttribute('data-position', modal.position as string); } if (runtime.visible) { element.classList.add('visible'); element.classList.remove('hidden'); } else { element.classList.remove('visible'); element.classList.add('hidden'); } if (runtime.closing) { element.classList.add('closing'); } else { element.classList.remove('closing'); } }

function buildModalClasses(modal: Record<string, unknown>) { const runtime = modal.runtime as Record<string, unknown>; const classes = ['modal-wrapper']; classes.push(`modal--${modal.type}`); classes.push(`modal--${modal.size}`); if (modal.position) { classes.push(`modal--position-${modal.position}`); } if (modal.blocking) { classes.push('modal--blocking'); } if (runtime.visible) { classes.push('visible'); } if (runtime.closing) { classes.push('closing'); } return classes.join(' '); }


function clear() { const stackContainer = Container.getStack(); if (stackContainer) { stackContainer.innerHTML = ''; } Container.updateBackdrop(false); Container.updateAriaHidden(false); Accessibility.cleanup(); }

function getModalElement(id: string) { const stackContainer = Container.getStack(); if (!stackContainer) return null; return stackContainer.querySelector(`[data-modal-id="${id}"]`); }

function getVersion() { return VERSION; }

export function info() { return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }
export function healthCheck() { const checks: Record<string, boolean> = { containerAvailable: !!Container.getStack(), accessibilityReady: typeof Accessibility.activateFocusTrap === 'function' }; const checkKeys = Object.keys(checks); let passed = 0; for (let i = 0; i < checkKeys.length; i++) { if (checks[checkKeys[i]]) passed++; } return { status: passed === checkKeys.length ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${checkKeys.length}`, checks, moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }

export { renderStack, renderModal, createModalElement, updateModalElement, buildModalClasses, clear, getModalElement, getVersion };

export default { renderStack, renderModal, clear, getModalElement, getVersion, healthCheck, info, VERSION, MODULE_ID };
