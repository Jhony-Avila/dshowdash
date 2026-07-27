const VERSION = "2.1.0-AAA-P4";
const MODULE_ID = "ui-adapter-port";
const UIAdapterPortContract = { render: "function", update: "function", destroy: "function" };
function createNullUIAdapterPort() {
  return { render: () => null, update: () => false, destroy: () => {
  } };
}
function createUIAdapterPort(deps = {}) {
  let _rendered = /* @__PURE__ */ new Map();
  let _metrics = { rendered: 0, updated: 0, destroyed: 0 };
  return {
    render(id, container, template) {
      try {
        if (!container) return null;
        const el = document.createElement("div");
        el.id = id;
        if (typeof template === "string") el.innerHTML = template;
        else if (template instanceof HTMLElement) el.appendChild(template);
        container.appendChild(el);
        _rendered.set(id, el);
        _metrics.rendered++;
        return el;
      } catch (e) {
        return null;
      }
    },
    update(id, content) {
      try {
        const el = _rendered.get(id);
        if (!el) return false;
        if (typeof content === "string") el.innerHTML = content;
        _metrics.updated++;
        return true;
      } catch (e) {
        return false;
      }
    },
    destroy(id) {
      try {
        const el = _rendered.get(id);
        if (el) {
          el.remove();
          _rendered.delete(id);
          _metrics.destroyed++;
        }
        return true;
      } catch (e) {
        return false;
      }
    },
    getElement(id) {
      return _rendered.get(id) || null;
    },
    getMetrics() {
      return { ..._metrics, count: _rendered.size };
    }
  };
}
function validateUIAdapterPort(port) {
  return port && typeof port.render === "function";
}
function healthCheck(port) {
  return { status: typeof port?.render === "function" ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { hasRender: typeof port?.render === "function", hasUpdate: typeof port?.update === "function", hasDestroy: typeof port?.destroy === "function" } };
}
var UIAdapterPort_default = { UIAdapterPortContract, createNullUIAdapterPort, createUIAdapterPort, validateUIAdapterPort, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  UIAdapterPortContract,
  VERSION,
  createNullUIAdapterPort,
  createUIAdapterPort,
  UIAdapterPort_default as default,
  healthCheck,
  validateUIAdapterPort
};
