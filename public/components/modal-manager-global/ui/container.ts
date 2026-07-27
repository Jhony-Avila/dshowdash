// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.modal-manager-global.ui.container
// PURPOSE: Modal Manager Global Container - DOM container management
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract CREATE_ROOT - createModalRoot() creates modal root container
// @contract GET_ROOT - getRoot() returns root element
// @contract GET_BACKDROP - getBackdrop() returns backdrop element
// @contract GET_STACK - getStack() returns stack element
// @contract IS_MOUNTED - isMounted() checks mount status
// @contract UPDATE_BACKDROP - updateBackdrop() updates backdrop state
// @contract UPDATE_ARIA - updateAriaHidden() updates aria-hidden
// @contract DESTROY - destroy() destroys container
// @contract GET_STATE - getState() returns container state
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ROOT_ID — constant
//   BACKDROP_ID — constant
//   STACK_ID — constant
//   createModalRoot() — exported function
//   getRoot() — exported function
//   getBackdrop() — exported function
//   getStack() — exported function
//   isMounted() — exported function
//   updateBackdrop() — exported function
//   updateAriaHidden() — exported function
//   destroy() — exported function
//   getState() — exported function
//   getVersion() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): parentElement optional
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: document.getElementById, document.createElement, document.body
// ───────────────────────────────────────────────────────────────
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.0.0-ENTERPRISE: Initial enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'modal-manager-global.ui.container';
const ROOT_ID = 'modal-manager-root';
const BACKDROP_ID = 'modal-manager-backdrop';
const STACK_ID = 'modal-manager-stack';

let containerState: { root: HTMLElement | null; backdrop: HTMLElement | null; stack: HTMLElement | null; mounted: boolean } = { root: null, backdrop: null, stack: null, mounted: false };

function createModalRoot(parentElement: HTMLElement | null) { if (typeof document === 'undefined') return null; const existing = document.getElementById(ROOT_ID); if (existing) { containerState.root = existing; containerState.backdrop = existing.querySelector(`#${BACKDROP_ID}`); containerState.stack = existing.querySelector(`#${STACK_ID}`); containerState.mounted = true; return existing; } const root = document.createElement('div'); root.id = ROOT_ID; root.className = 'modal-manager-root'; root.setAttribute('data-component', 'modal-manager-global'); root.setAttribute('role', 'presentation'); root.setAttribute('aria-hidden', 'true'); const backdrop = document.createElement('div'); backdrop.id = BACKDROP_ID; backdrop.className = 'modal-manager-backdrop'; backdrop.setAttribute('aria-hidden', 'true'); root.appendChild(backdrop); const stack = document.createElement('div'); stack.id = STACK_ID; stack.className = 'modal-manager-stack'; root.appendChild(stack); const parent = parentElement || document.body; parent.appendChild(root); containerState.root = root; containerState.backdrop = backdrop; containerState.stack = stack; containerState.mounted = true; return root; }

function getRoot() { return containerState.root; }
function getBackdrop() { return containerState.backdrop; }
function getStack() { return containerState.stack; }
function isMounted() { return containerState.mounted; }

function updateBackdrop(visible: boolean, options?: Record<string, unknown>) { options = options || {}; const backdrop = containerState.backdrop; if (!backdrop) return; if (visible) { backdrop.classList.add('visible'); backdrop.style.setProperty('--modal-backdrop-opacity', String(options.opacity || 0.5)); if (options.blur) { backdrop.classList.add('blur'); } else { backdrop.classList.remove('blur'); } if (options.clickToClose) { backdrop.setAttribute('data-click-close', 'true'); } else { backdrop.removeAttribute('data-click-close'); } } else { backdrop.classList.remove('visible', 'blur'); } }

function updateAriaHidden(hasModals: boolean) { const root = containerState.root; if (!root) return; root.setAttribute('aria-hidden', hasModals ? 'false' : 'true'); }

function destroy() { if (containerState.root) { containerState.root.remove(); } containerState = { root: null, backdrop: null, stack: null, mounted: false }; }

function getState() { return { mounted: containerState.mounted, hasRoot: !!containerState.root, hasBackdrop: !!containerState.backdrop, hasStack: !!containerState.stack }; }

function getVersion() { return VERSION; }

export function info() { return { moduleId: MODULE_ID, version: VERSION, state: getState(), timestamp: Date.now() }; }
export function healthCheck() { const checks: Record<string, boolean> = { mounted: containerState.mounted, hasRoot: !!containerState.root, hasBackdrop: !!containerState.backdrop, hasStack: !!containerState.stack }; const checkKeys = Object.keys(checks); let passed = 0; for (let i = 0; i < checkKeys.length; i++) { if (checks[checkKeys[i]]) passed++; } return { status: passed === checkKeys.length ? 'HEALTHY' : passed > 0 ? 'DEGRADED' : 'NOT_MOUNTED', score: `${passed}/${checkKeys.length}`, checks, moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }

export { ROOT_ID, BACKDROP_ID, STACK_ID, createModalRoot, getRoot, getBackdrop, getStack, isMounted, updateBackdrop, updateAriaHidden, destroy, getState, getVersion };

export default { createModalRoot, getRoot, getBackdrop, getStack, isMounted, updateBackdrop, updateAriaHidden, destroy, getState, getVersion, healthCheck, info, VERSION, MODULE_ID };
