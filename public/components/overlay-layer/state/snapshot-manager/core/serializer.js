const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.state.snapshot-manager.core.serializer";
function serializeOverlay(overlay) {
  if (!overlay) return null;
  return {
    id: overlay.id,
    type: overlay.type,
    scope: overlay.scope || "global",
    content: typeof overlay.content === "string" ? overlay.content : null,
    config: overlay.config ? Object.assign({}, overlay.config) : {},
    meta: overlay.meta ? Object.assign({}, overlay.meta) : {},
    data: overlay.data ? Object.assign({}, overlay.data) : {},
    runtime: overlay.runtime ? {
      visible: overlay.runtime.visible,
      createdAt: overlay.runtime.createdAt,
      openedAt: overlay.runtime.openedAt
    } : null
  };
}
function serializeOverlays(stack, overlays) {
  const serialized = {};
  for (let i = 0; i < stack.length; i++) {
    const id = stack[i];
    const overlay = overlays[id];
    if (overlay) {
      serialized[id] = serializeOverlay(overlay);
    }
  }
  return serialized;
}
var serializer_default = {
  serializeOverlay,
  serializeOverlays
};
export {
  MODULE_ID,
  VERSION,
  serializer_default as default,
  serializeOverlay,
  serializeOverlays
};
