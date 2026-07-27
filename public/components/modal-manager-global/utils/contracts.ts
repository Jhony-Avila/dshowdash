// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.modal-manager-global.utils.contracts
// PURPOSE: Modal Manager Global Contracts - Validation and normalization
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract MODAL_TYPES - valid modal types constant
// @contract MODAL_SIZES - valid modal sizes constant
// @contract DRAWER_POSITIONS - valid drawer positions constant
// @contract TYPE_DEFAULTS - type default configs constant
// @contract DEFAULT_DESCRIPTOR - default modal descriptor constant
// @contract IS_VALID_TYPE - isValidType() validates modal type
// @contract IS_VALID_SIZE - isValidSize() validates modal size
// @contract IS_VALID_POSITION - isValidPosition() validates position
// @contract VALIDATE - validateModalDescriptor() validates descriptor
// @contract NORMALIZE - normalizeDescriptor() normalizes descriptor
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   MODAL_TYPES — constant array
//   MODAL_SIZES — constant array
//   DRAWER_POSITIONS — constant array
//   TYPE_DEFAULTS — constant object
//   DEFAULT_MODAL_DESCRIPTOR — constant object
//   isValidType() — exported function
//   isValidSize() — exported function
//   isValidPosition() — exported function
//   validateModalDescriptor() — exported function
//   normalizeDescriptor() — exported function
//   normalizeBackdrop() — exported function
//   normalizeAnimation() — exported function
//   normalizeAria() — exported function
//   normalizeCallbacks() — exported function
//   getVersion() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): descriptor object
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ───────────────────────────────────────────────────────────────
// @changelog v1.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.1.0-ENTERPRISE: Initial enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'modal-manager-global.utils.contracts';
export const VERSION = '1.2.0-P2-ENTERPRISE';

const MODAL_TYPES = ['dialog', 'drawer', 'sheet', 'full-screen', 'alert', 'confirm', 'prompt', 'custom'];
const MODAL_SIZES = ['xs', 'sm', 'md', 'lg', 'xl', 'full'];
const DRAWER_POSITIONS = ['left', 'right', 'top', 'bottom'];

const TYPE_DEFAULTS = {
  'dialog': { size: 'md', blocking: false, closeOnEsc: true, closeOnBackdrop: true, focusTrap: true },
  'drawer': { size: 'sm', blocking: false, closeOnEsc: true, closeOnBackdrop: true, focusTrap: true, position: 'right' },
  'sheet': { size: 'md', blocking: false, closeOnEsc: true, closeOnBackdrop: true, focusTrap: true, position: 'bottom' },
  'full-screen': { size: 'full', blocking: true, closeOnEsc: true, closeOnBackdrop: false, focusTrap: true },
  'alert': { size: 'sm', blocking: true, closeOnEsc: false, closeOnBackdrop: false, focusTrap: true },
  'confirm': { size: 'sm', blocking: true, closeOnEsc: true, closeOnBackdrop: false, focusTrap: true },
  'prompt': { size: 'sm', blocking: true, closeOnEsc: true, closeOnBackdrop: false, focusTrap: true },
  'custom': { size: 'md', blocking: false, closeOnEsc: true, closeOnBackdrop: true, focusTrap: true }
};

const DEFAULT_MODAL_DESCRIPTOR: Record<string, unknown> = {
  id: null as string | null, type: 'dialog', title: '', content: null as string | null, component: null as unknown, props: {}, size: 'md', position: null as string | null,
  blocking: false, closeOnEsc: true, closeOnBackdrop: true, focusTrap: true, showCloseButton: true,
  backdrop: { visible: true, opacity: 0.5, blur: false },
  animation: { enter: 'fade-scale', exit: 'fade-scale', duration: 300 },
  aria: { label: null as string | null, labelledBy: null as string | null, describedBy: null as string | null },
  zIndex: null as number | null, owner: 'unknown', context: {},
  callbacks: { onOpen: null as ((...args: unknown[]) => void) | null, onClose: null as ((...args: unknown[]) => void) | null, onConfirm: null as ((...args: unknown[]) => void) | null, onCancel: null as ((...args: unknown[]) => void) | null },
  runtime: { createdAt: null as number | null, openedAt: null as number | null, closedAt: null as number | null, visible: false, closing: false }
};

function isValidType(type: string) { return MODAL_TYPES.indexOf(type) !== -1; }
function isValidSize(size: string) { return MODAL_SIZES.indexOf(size) !== -1; }
function isValidPosition(position: string) { return DRAWER_POSITIONS.indexOf(position) !== -1; }

function validateModalDescriptor(descriptor: Record<string, unknown>) {
  const errors = []; const warnings = [];
  if (!descriptor || typeof descriptor !== 'object') { return { valid: false, errors: ['Descriptor must be an object'], warnings: [], normalized: null }; }
  if (!descriptor.id || typeof descriptor.id !== 'string') { errors.push('id is required and must be a string'); }
  if (descriptor.type && !isValidType(descriptor.type as string)) { errors.push(`Invalid type: ${descriptor.type}. Valid: ${MODAL_TYPES.join(', ')}`); }
  if (descriptor.size && !isValidSize(descriptor.size as string)) { warnings.push(`Invalid size: ${descriptor.size}, using md`); }
  if ((descriptor.type === 'drawer' || descriptor.type === 'sheet') && descriptor.position) { if (!isValidPosition(descriptor.position as string)) { warnings.push(`Invalid position: ${descriptor.position}, using default`); } }
  if (!descriptor.content && !descriptor.component && ['alert', 'confirm', 'prompt'].indexOf(descriptor.type as string) === -1) { warnings.push('No content or component provided'); }
  if (errors.length > 0) { return { valid: false, errors, warnings, normalized: null as Record<string, unknown> | null }; }
  const normalized: Record<string, unknown> = normalizeDescriptor(descriptor);
  return { valid: true, errors: [], warnings, normalized };
}

function normalizeDescriptor(descriptor: Record<string, unknown>) {
  const type = (descriptor.type as string) || 'dialog';
  const typeDefaults = TYPE_DEFAULTS[type as keyof typeof TYPE_DEFAULTS] || TYPE_DEFAULTS['custom'];
  const normalized: Record<string, unknown> = Object.assign({}, DEFAULT_MODAL_DESCRIPTOR, typeDefaults, descriptor, {
    type, id: descriptor.id,
    size: isValidSize(descriptor.size as string) ? descriptor.size : typeDefaults.size,
    backdrop: normalizeBackdrop(descriptor.backdrop as Record<string, unknown> | false | undefined),
    animation: normalizeAnimation(descriptor.animation as Record<string, unknown> | undefined),
    aria: normalizeAria(descriptor.aria as Record<string, unknown> | undefined, descriptor.title as string),
    callbacks: normalizeCallbacks(descriptor.callbacks as Record<string, unknown> | undefined),
    runtime: { createdAt: Date.now(), openedAt: null, closedAt: null, visible: false, closing: false }
  });
  if (type === 'drawer' || type === 'sheet') { normalized.position = isValidPosition(descriptor.position as string) ? descriptor.position : (typeDefaults as Record<string, unknown>).position; }
  return normalized;
}

function normalizeBackdrop(backdrop: Record<string, unknown> | false | undefined) { if (backdrop === false) { return { visible: false, opacity: 0, blur: false }; } return { visible: (backdrop && backdrop.visible !== undefined) ? backdrop.visible : true, opacity: (backdrop && backdrop.opacity !== undefined) ? backdrop.opacity : 0.5, blur: (backdrop && backdrop.blur) || false }; }
function normalizeAnimation(animation: Record<string, unknown> | undefined) { return { enter: (animation && animation.enter) || 'fade-scale', exit: (animation && animation.exit) || 'fade-scale', duration: (animation && animation.duration) || 300 }; }
function normalizeAria(aria: Record<string, unknown> | undefined, title: string) { return { label: (aria && aria.label) || title || null, labelledBy: (aria && aria.labelledBy) || null, describedBy: (aria && aria.describedBy) || null }; }
function normalizeCallbacks(callbacks: Record<string, unknown> | undefined) { return { onOpen: (callbacks && typeof callbacks.onOpen === 'function') ? callbacks.onOpen : null, onClose: (callbacks && typeof callbacks.onClose === 'function') ? callbacks.onClose : null, onConfirm: (callbacks && typeof callbacks.onConfirm === 'function') ? callbacks.onConfirm : null, onCancel: (callbacks && typeof callbacks.onCancel === 'function') ? callbacks.onCancel : null }; }
function getVersion() { return VERSION; }

export { MODAL_TYPES, MODAL_SIZES, DRAWER_POSITIONS, TYPE_DEFAULTS, DEFAULT_MODAL_DESCRIPTOR, isValidType, isValidSize, isValidPosition, validateModalDescriptor, normalizeDescriptor, normalizeBackdrop, normalizeAnimation, normalizeAria, normalizeCallbacks, getVersion };

export function info() { return { moduleId: MODULE_ID, version: VERSION, modalTypes: MODAL_TYPES, modalSizes: MODAL_SIZES, timestamp: Date.now() }; }
export function healthCheck() { const checks: Record<string, boolean> = { typesAvailable: MODAL_TYPES.length > 0, sizesAvailable: MODAL_SIZES.length > 0, defaultsAvailable: Object.keys(TYPE_DEFAULTS).length > 0 }; const checkKeys = Object.keys(checks); let passed = 0; for (let i = 0; i < checkKeys.length; i++) { if (checks[checkKeys[i]]) passed++; } return { status: passed === checkKeys.length ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${checkKeys.length}`, checks, moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }

export default { MODAL_TYPES, MODAL_SIZES, validateModalDescriptor, normalizeDescriptor, getVersion, healthCheck, info, VERSION, MODULE_ID };
