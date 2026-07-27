import Store from "../state/store.js";
const _Store = Store;
import { validateModalDescriptor } from "../utils/contracts.js";
import { deepClone, executeCallback } from "../utils/helpers.js";
const MODULE_ID = "modal-manager-global.core.engine";
const VERSION = "1.2.0-P2-ENTERPRISE";
function open(descriptor) {
  const validation = validateModalDescriptor(descriptor);
  if (!validation.valid) {
    return { ok: false, errors: validation.errors, warnings: validation.warnings };
  }
  const normalized = validation.normalized;
  const existing = _Store.getModal(normalized.id);
  if (existing) {
    _Store.updateModalRuntime(normalized.id, {
      visible: true,
      openedAt: Date.now(),
      closing: false
    });
    return {
      ok: true,
      id: normalized.id,
      wasExisting: true,
      warnings: validation.warnings,
      state: _Store.getModal(normalized.id)
    };
  }
  normalized.runtime.visible = true;
  normalized.runtime.openedAt = Date.now();
  const result = Store.pushModal(normalized);
  executeCallback(normalized.callbacks?.onOpen, { id: normalized.id, modal: result.modal });
  return {
    ok: true,
    id: normalized.id,
    wasExisting: false,
    warnings: validation.warnings,
    state: result.modal
  };
}
function update(id, patch) {
  const existing = _Store.getModal(id);
  if (!existing) {
    return { ok: false, error: "Modal not found" };
  }
  const allowedFields = ["title", "content", "props", "context", "callbacks"];
  const filteredPatch = {};
  for (const field of allowedFields) {
    if (patch[field] !== void 0) {
      filteredPatch[field] = patch[field];
    }
  }
  if (Object.keys(filteredPatch).length === 0) {
    return { ok: true, changed: false };
  }
  const updated = { ...existing, ...filteredPatch };
  Store.pushModal(updated);
  return { ok: true, changed: true, state: _Store.getModal(id) };
}
function close(id, reason, result) {
  if (reason === void 0) reason = "manual";
  if (result === void 0) result = null;
  const modal = _Store.getModal(id);
  if (!modal) {
    return { ok: true, wasOpen: false };
  }
  _Store.updateModalRuntime(id, {
    closing: true,
    visible: false,
    closedAt: Date.now()
  });
  executeCallback(modal.callbacks?.onClose, { id, reason, result, modal: deepClone(modal) });
  setTimeout(() => {
    Store.popModal(id);
  }, modal.animation?.duration || 300);
  return {
    ok: true,
    wasOpen: true,
    reason,
    result,
    modal: deepClone(modal)
  };
}
function confirm(id, result) {
  if (result === void 0) result = true;
  const modal = _Store.getModal(id);
  if (!modal) {
    return { ok: false, error: "Modal not found" };
  }
  executeCallback(modal.callbacks?.onConfirm, { id, result, modal: deepClone(modal) });
  return close(id, "confirmed", result);
}
function cancel(id) {
  const modal = _Store.getModal(id);
  if (!modal) {
    return { ok: false, error: "Modal not found" };
  }
  executeCallback(modal.callbacks?.onCancel, { id, modal: deepClone(modal) });
  return close(id, "cancelled", null);
}
function closeAll(options) {
  if (!options) options = {};
  const stack = _Store.getStack();
  const closed = [];
  for (let i = 0; i < stack.length; i++) {
    const modal = stack[i];
    if (options.keepBlocking && modal.blocking) continue;
    if (options.type && modal.type !== options.type) continue;
    if (options.owner && modal.owner !== options.owner) continue;
    const result = close(modal.id, options.reason || "close-all");
    if (result.ok && result.wasOpen) {
      closed.push(modal.id);
    }
  }
  return { ok: true, closed };
}
function getTop() {
  const stack = _Store.getStack({ visible: true });
  return stack.length > 0 ? stack[stack.length - 1] : null;
}
function isOpen(id) {
  const modal = _Store.getModal(id);
  return modal ? modal.runtime.visible : false;
}
function hasBlocking() {
  return _Store.getStack({ blocking: true, visible: true }).length > 0;
}
function getStack(filter) {
  return _Store.getStack(filter);
}
function getModal(id) {
  return _Store.getModal(id);
}
function getVersion() {
  return VERSION;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, stackSize: _Store.getStack().length, topModal: getTop()?.id || null, timestamp: Date.now() };
}
function healthCheck() {
  const stack = _Store.getStack();
  const checks = { storeAvailable: typeof _Store.getStack === "function", stackValid: Array.isArray(stack), noOrphanModals: stack.every((m) => m.id && m.runtime) };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  return { status: passed === checkKeys.length ? "HEALTHY" : "DEGRADED", score: `${passed}/${checkKeys.length}`, checks, stackSize: stack.length, moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
var engine_default = {
  open,
  update,
  close,
  confirm,
  cancel,
  closeAll,
  getTop,
  isOpen,
  hasBlocking,
  getStack,
  getModal,
  getVersion,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  cancel,
  close,
  closeAll,
  confirm,
  engine_default as default,
  getModal,
  getStack,
  getTop,
  getVersion,
  hasBlocking,
  healthCheck,
  info,
  isOpen,
  open,
  update
};
